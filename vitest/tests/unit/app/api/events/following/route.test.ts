import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import type { EventsPage, EventData } from "@/lib/types";
import type { GET as GETType } from "@/app/api/events/following/route";

// --- Mock Variable Declarations ---
let mockCookiesGet: Mock;
let mockCookiesSet: Mock;
let mockLuciaValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockEventFindMany: Mock;
let mockGetEventDataInclude: Mock;

// --- Helper Type ---
// Explicit type for API Route handlers in App Router (simplified for GET)
type ApiHandler = (request: NextRequest) => Promise<Response>;

describe("GET /api/events/following", () => {
  const loggedInUserId = "user-123";
  const mockBlankCookieData = {
    name: "auth_session",
    value: "",
    attributes: { expires: new Date(0) },
  };
  const mockNewSessionCookieData = {
    name: "auth_session",
    value: "new-session-id",
    attributes: {},
  };

  // Define handler variable
  let GET: ApiHandler;

  beforeEach(async () => {
    // 1. Reset mocks and modules
    vi.resetAllMocks();
    vi.resetModules();

    // 2. Define mock implementations
    mockCookiesGet = vi.fn();
    mockCookiesSet = vi.fn();
    mockLuciaValidateSession = vi.fn();
    mockCreateBlankSessionCookie = vi.fn(() => mockBlankCookieData);
    mockCreateSessionCookie = vi.fn(() => mockNewSessionCookieData);
    mockEventFindMany = vi.fn();
    mockGetEventDataInclude = vi.fn((_userId: string) => ({
      // Return a representative include object
      createdBy: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      bookmarks: { where: { userId: _userId } }, // Example context-specific include
      _count: { select: { attendees: true, comments: true, bookmarks: true } },
      venue: true,
      artists: { include: { artist: true } },
    }));

    // 3. Apply mocks using vi.doMock
    vi.doMock("next/headers", () => ({
      cookies: vi.fn(() => ({
        get: mockCookiesGet,
        set: mockCookiesSet,
      })),
    }));

    vi.doMock("@/lib/prisma", () => ({
      default: {
        event: {
          findMany: mockEventFindMany,
        },
      },
    }));

    const actualTypes =
      await vi.importActual<typeof import("@/lib/types")>("@/lib/types");
    vi.doMock("@/lib/types", () => ({
      ...actualTypes,
      getEventDataInclude: mockGetEventDataInclude,
    }));

    vi.doMock("@/auth", () => ({
      lucia: {
        sessionCookieName: "auth_session",
        validateSession: mockLuciaValidateSession,
        createBlankSessionCookie: mockCreateBlankSessionCookie,
        createSessionCookie: mockCreateSessionCookie,
      },
    }));

    // 4. Set default mock behaviors
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: "testuser" },
      session: { id: "valid-session-id", fresh: false },
    });

    // 5. Dynamically import the module
    const mod = await import("@/app/api/events/following/route");
    GET = mod.GET;
  });

  const createMockRequest = (cursor?: string): NextRequest => {
    const url = new URL("http://localhost/api/events/following");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }
    return new NextRequest(url);
  };

  // --- Auth Tests ---
  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    const request = createMockRequest();
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    const request = createMockRequest();
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if user is null after session validation", async () => {
    mockLuciaValidateSession.mockResolvedValue({
      user: null,
      session: { id: "valid-session-id", fresh: false },
    });
    const request = createMockRequest();
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it("should set a new cookie if the session is fresh", async () => {
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: "testuser" },
      session: { id: "valid-session-id", fresh: true },
    });
    mockEventFindMany.mockResolvedValue([]);
    const request = createMockRequest();
    await GET(request);
    expect(mockCreateSessionCookie).toHaveBeenCalledWith("valid-session-id");
    expect(mockCookiesSet).toHaveBeenCalled();
    expect(mockEventFindMany).toHaveBeenCalled();
  });

  // --- Functionality Tests ---
  it("should fetch events from followed users successfully without a cursor", async () => {
    // Arrange
    const mockEvents = [
      { id: "event-1", title: "Event 1" },
      { id: "event-2", title: "Event 2" },
    ] as EventData[];
    mockEventFindMany.mockResolvedValue(mockEvents);
    const request = createMockRequest();

    // Act
    const response = await GET(request);
    const body: EventsPage = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockGetEventDataInclude).toHaveBeenCalledWith(loggedInUserId);
    expect(mockEventFindMany).toHaveBeenCalledWith({
      where: {
        createdBy: {
          followers: {
            some: {
              followerId: loggedInUserId,
            },
          },
        },
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isCancelled: false,
      },
      orderBy: { when: "asc" },
      take: 11, // pageSize + 1
      cursor: undefined,
      include: mockGetEventDataInclude(loggedInUserId),
    });
    expect(body.events).toHaveLength(2);
    expect(body.events[0].id).toBe("event-1");
    expect(body.nextCursor).toBeNull();
  });

  it("should fetch events from followed users successfully with a cursor", async () => {
    // Arrange
    const pageSize = 10;
    const mockEvents = Array.from({ length: pageSize + 1 }, (_, i) => ({
      id: `event-${i + 1}`,
      title: `Event ${i + 1}`,
    })) as EventData[];
    mockEventFindMany.mockResolvedValue(mockEvents);
    const cursor = "event-0";
    const request = createMockRequest(cursor);

    // Act
    const response = await GET(request);
    const body: EventsPage = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockGetEventDataInclude).toHaveBeenCalledWith(loggedInUserId);
    expect(mockEventFindMany).toHaveBeenCalledWith({
      where: {
        createdBy: {
          followers: {
            some: {
              followerId: loggedInUserId,
            },
          },
        },
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isCancelled: false,
      },
      orderBy: { when: "asc" },
      take: pageSize + 1,
      cursor: { id: cursor },
      include: mockGetEventDataInclude(loggedInUserId),
    });
    expect(body.events).toHaveLength(pageSize);
    expect(body.events[0].id).toBe("event-1");
    expect(body.nextCursor).toBe(`event-${pageSize + 1}`);
  });

  it("should return 500 if prisma query fails", async () => {
    // Arrange
    mockEventFindMany.mockRejectedValue(new Error("DB Error"));
    const request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });
});
