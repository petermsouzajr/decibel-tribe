import { describe, it, expect, vi, beforeEach, Mock, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { UserData } from "@/lib/types";

// --- Declare Hoisted Mock Function Variables FIRST ---
const { mockCookiesGet, mockCookiesSet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockCookiesSet: vi.fn(),
}));
const {
  mockEventCreate,
  mockEventFindMany,
  mockEventFindUnique,
  mockEventDelete,
  mockEventUpdate,
  mockEventAttendeeDelete,
  mockUserFindUnique,
  mockUserPreferencesFindUnique,
} = vi.hoisted(() => ({
  mockEventCreate: vi.fn(),
  mockEventFindMany: vi.fn(),
  mockEventFindUnique: vi.fn(),
  mockEventDelete: vi.fn(),
  mockEventUpdate: vi.fn(),
  mockEventAttendeeDelete: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserPreferencesFindUnique: vi.fn(),
}));
const {
  mockLuciaValidateSession,
  mockCreateBlankSessionCookie,
  mockCreateSessionCookie,
} = vi.hoisted(() => ({
  mockLuciaValidateSession: vi.fn(),
  mockCreateBlankSessionCookie: vi.fn(),
  mockCreateSessionCookie: vi.fn(),
}));
const luciaSessionCookieName = "auth_session";

// --- Top-Level Mocks using vi.mock ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      create: mockEventCreate,
      findMany: mockEventFindMany,
      findUnique: mockEventFindUnique,
      delete: mockEventDelete,
      update: mockEventUpdate,
    },
    eventAttendee: {
      delete: mockEventAttendeeDelete,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    userPreferences: {
      findUnique: mockUserPreferencesFindUnique,
    },
  },
}));

vi.mock("@/auth", () => ({
  // Routes call this helper (src/auth.ts) instead of lucia directly;
  // delegate to the validateSession mock this file already configures.
  validateRequestWithCookieMutation: vi.fn(
    async () => (await mockLuciaValidateSession()) ?? { user: null, session: null },
  ),
  lucia: {
    sessionCookieName: "auth_session",
    validateSession: mockLuciaValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

// --- Import Route Handlers AFTER Top-Level Mocks ---
import { GET, POST } from "@/app/api/events/route";

// --- POST tests ---
describe("POST /api/events", () => {
  let request: NextRequest;
  const loggedInUserId = "user-creator-1";
  const loggedInUsername = "creatorUser";
  const mockEventData = {
    title: "Test Event",
    location: "Test Location",
    description: "Test Description",
    url: "http://test.com",
    when: new Date().toISOString(),
    startTime: "10:00",
    endTime: "12:00",
    performers: ["Performer 1"],
    status: "PUBLISHED",
    visibility: "PUBLIC",
    isCancelled: false,
  };
  const mockCreatedEvent = {
    ...mockEventData,
    id: "new-event-123",
    createdById: loggedInUserId,
  };
  const mockBlankCookie = {
    name: luciaSessionCookieName,
    value: "",
    attributes: { expires: expect.any(Date) },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default auth setup
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: loggedInUsername },
      session: { id: "valid-session-id", fresh: false },
    });
  });

  const createMockRequest = (body: any): NextRequest => {
    const url = new URL("http://localhost/api/events");
    return new NextRequest(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  };

  // Auth Tests
  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    request = createMockRequest(mockEventData);
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockLuciaValidateSession).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    request = createMockRequest(mockEventData);
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
  });

  // Functionality Tests
  it("should create an event and return it with status 201 on success", async () => {
    mockEventCreate.mockResolvedValue(mockCreatedEvent);
    request = createMockRequest(mockEventData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual(mockCreatedEvent);
    expect(mockEventCreate).toHaveBeenCalledWith({
      data: {
        ...mockEventData,
        createdBy: { connect: { id: loggedInUserId } },
        attendees: { create: { userId: loggedInUserId } },
      },
    });
  });

  it("should return 500 if prisma event creation fails", async () => {
    mockEventCreate.mockRejectedValue(new Error("DB Error"));
    request = createMockRequest(mockEventData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });
});

// --- GET tests ---
describe("GET /api/events", () => {
  let request: NextRequest;
  const loggedInUserId = "user-viewer-1";
  const loggedInUsername = "viewerUser";
  const targetUserId = "user-target-1";
  const targetUsername = "targetUser";
  const mockEvents = [
    { id: "event-1", title: "Event 1", createdById: targetUserId },
  ];
  const mockBlankCookie = {
    name: luciaSessionCookieName,
    value: "",
    attributes: { expires: expect.any(Date) },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default auth setup
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: loggedInUsername }, // Default logged-in user
      session: { id: "valid-session-id", fresh: false },
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
  });

  const createMockRequest = (params?: Record<string, string>): NextRequest => {
    const url = new URL("http://localhost/api/events");
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return new NextRequest(url, { method: "GET" });
  };

  // Auth Tests
  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("should return 401 if session validation fails", async () => {
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
  });

  // Functionality: No username provided (fetch logged-in user's events)
  it("should fetch events created by or attended by the logged-in user if no username is provided", async () => {
    mockEventFindMany.mockResolvedValue(mockEvents);
    request = createMockRequest(); // No user param
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockEvents);
    expect(mockEventFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { createdById: loggedInUserId },
          {
            attendees: { some: { userId: loggedInUserId } },
            status: "PUBLISHED",
          },
        ],
      },
      orderBy: { when: "asc" },
      include: { attendees: expect.any(Object) }, // Simplified check
    });
  });

  // Functionality: Username provided (logged-in user is the target user)
  it("should fetch all events for the target user if logged-in user is the target user", async () => {
    mockLuciaValidateSession.mockResolvedValue({
      // Simulate logged-in user IS target user
      user: { id: targetUserId, username: targetUsername },
      session: { id: "valid-session-id", fresh: false },
    });
    mockUserFindUnique.mockResolvedValue({ id: targetUserId }); // Mock finding the target user
    mockUserPreferencesFindUnique.mockResolvedValue({ calendar: "PRIVATE" }); // Calendar pref doesn't matter here
    mockEventFindMany.mockResolvedValue(mockEvents);

    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockEvents);
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockUserPreferencesFindUnique).toHaveBeenCalledWith({
      where: { userId: targetUserId },
      select: { calendar: true },
    });
    expect(mockEventFindMany).toHaveBeenCalledWith({
      where: { createdById: targetUserId }, // Should fetch all by creator
      orderBy: { when: "asc" },
      include: { attendees: expect.any(Object) },
    });
  });

  // Functionality: Username provided (different user, public calendar)
  it("should fetch public/published events for the target user if calendar is PUBLIC", async () => {
    mockUserFindUnique.mockResolvedValue({ id: targetUserId });
    mockUserPreferencesFindUnique.mockResolvedValue({ calendar: "PUBLIC" }); // Public calendar
    mockEventFindMany.mockResolvedValue(mockEvents);

    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockEvents);
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockUserPreferencesFindUnique).toHaveBeenCalledWith({
      where: { userId: targetUserId },
      select: { calendar: true },
    });
    expect(mockEventFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            AND: [
              { createdById: targetUserId },
              { status: "PUBLISHED" },
              { visibility: "PUBLIC" },
              { isCancelled: false },
            ],
          },
          {
            AND: [
              { attendees: { some: { userId: targetUserId } } },
              { status: "PUBLISHED" },
              { visibility: "PUBLIC" },
              { isCancelled: false },
            ],
          },
        ],
      },
      orderBy: { when: "asc" },
      include: { attendees: expect.any(Object) },
    });
  });

  // Functionality: Username provided (different user, private calendar)
  it("should return empty array for the target user if calendar is PRIVATE", async () => {
    mockUserFindUnique.mockResolvedValue({ id: targetUserId });
    mockUserPreferencesFindUnique.mockResolvedValue({ calendar: "PRIVATE" }); // Private calendar
    // mockEventFindMany should NOT be called

    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]); // Expect empty array
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockUserPreferencesFindUnique).toHaveBeenCalledWith({
      where: { userId: targetUserId },
      select: { calendar: true },
    });
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  // Functionality: Username provided (user not found)
  it("should return 404 if the target user is not found", async () => {
    mockUserFindUnique.mockResolvedValue(null); // User not found
    request = createMockRequest({ user: "nonexistentuser" });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "User not found" });
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: "nonexistentuser" },
      select: { id: true },
    });
    expect(mockUserPreferencesFindUnique).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  // Error Handling
  it("should return 500 if prisma findMany fails", async () => {
    mockEventFindMany.mockRejectedValue(new Error("DB Error"));
    request = createMockRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("should return 500 if prisma findUnique for user fails", async () => {
    mockUserFindUnique.mockRejectedValue(new Error("DB User Error"));
    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(mockUserPreferencesFindUnique).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it("should return 500 if prisma findUnique for preferences fails", async () => {
    mockUserFindUnique.mockResolvedValue({ id: targetUserId });
    mockUserPreferencesFindUnique.mockRejectedValue(
      new Error("DB Prefs Error"),
    );
    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(mockUserFindUnique).toHaveBeenCalled();
    expect(mockUserPreferencesFindUnique).toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });
});
