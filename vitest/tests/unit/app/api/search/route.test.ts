import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  getPostDataInclude,
  getUserDataSelect,
  getEventDataInclude,
  PostData,
  UserWithFollowerStatus,
  // EventData, // Assuming EventData is the type for events
} from "@/lib/types";
import { parse, isValid, addDays } from "date-fns"; // Used internally by route

// --- Declare Hoisted Mock Function Variables FIRST ---
const { mockCookiesGet, mockCookiesSet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockCookiesSet: vi.fn(),
}));
const { mockPostFindMany, mockUserFindMany, mockEventFindMany } = vi.hoisted(
  () => ({
    mockPostFindMany: vi.fn(),
    mockUserFindMany: vi.fn(),
    mockEventFindMany: vi.fn(),
  }),
);
const {
  mockGetPostDataInclude,
  mockGetUserDataSelect,
  mockGetEventDataInclude,
} = vi.hoisted(() => ({
  mockGetPostDataInclude: vi.fn(),
  mockGetUserDataSelect: vi.fn(),
  mockGetEventDataInclude: vi.fn(),
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
    post: { findMany: mockPostFindMany },
    user: { findMany: mockUserFindMany }, // Simplified for search
    event: { findMany: mockEventFindMany },
    // userPreferences: { findUnique: vi.fn() }, // Mock simply if needed, or remove if not directly used
  },
}));

// Mock the specific functions from @/lib/types
vi.mock("@/lib/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/types")>();
  return {
    ...actual,
    getPostDataInclude: mockGetPostDataInclude,
    getUserDataSelect: mockGetUserDataSelect,
    getEventDataInclude: mockGetEventDataInclude,
  };
});

vi.mock("@/auth", () => ({
  lucia: {
    sessionCookieName: "auth_session", // Hardcode string literal
    validateSession: mockLuciaValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

// --- Import Route Handler AFTER Top-Level Mocks ---
import { GET } from "@/app/api/search/route";

// --- Test Suite ---
describe("API Route: GET /api/search", () => {
  const loggedInUserId = "search_user_1";
  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "session_search", fresh: false };
  const mockFreshSessionData = { ...mockSessionData, fresh: true };
  const mockBlankCookie = {
    name: "auth_session",
    value: "",
    attributes: { expires: expect.any(Date) },
  };
  const mockNewSessionCookie = {
    name: "auth_session",
    value: "new-session-id",
    attributes: {},
  };
  const pageSize = 10;

  // Sample data
  const mockUsers = [
    { id: "user1", username: "testuser", displayName: "Test User" },
  ];
  const mockPosts = [
    { id: "post1", content: "Test post content", userId: "user1" },
  ];
  const mockEvents = [
    {
      id: "event1",
      title: "Test Event",
      description: "An event description",
      location: "Venue A",
      when: new Date(2024, 5, 15),
      performers: ["Artist One"],
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isCancelled: false,
    },
    {
      id: "event2",
      title: "Another Test",
      description: "Searchable words",
      location: "Venue B",
      when: new Date(2024, 6, 20),
      performers: ["Artist Two"],
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isCancelled: false,
    },
  ];

  beforeEach(() => {
    // 1. Reset Mocks
    vi.resetAllMocks();

    // 2. Set Default Mock Behaviors for Success Path
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);
    // Default successful empty search results
    mockPostFindMany.mockResolvedValue([]);
    mockUserFindMany.mockResolvedValue([]);
    mockEventFindMany.mockResolvedValue([]);
    // Set defaults for include/select mocks - adjust based on actual usage if needed
    mockGetPostDataInclude.mockReturnValue({ user: true, _count: true });
    mockGetUserDataSelect.mockReturnValue({
      id: true,
      username: true,
      displayName: true,
    });
    mockGetEventDataInclude.mockReturnValue({ createdBy: true, _count: true });
  });

  // Helper to create request
  const createMockRequest = (query?: string): NextRequest => {
    const url = new URL("http://localhost/api/search");
    if (query) {
      url.searchParams.set("q", query);
    }
    return new NextRequest(url);
  };

  // --- Basic Validation & Auth Tests ---
  it("should return 400 if query parameter 'q' is missing", async () => {
    const request = createMockRequest(); // No query
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBe("Query is required");
  });

  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    const request = createMockRequest("test");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLuciaValidateSession).not.toHaveBeenCalled();
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    mockCookiesGet.mockReturnValue({ value: "invalid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    const request = createMockRequest("test");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("invalid_session_id");
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockBlankCookie.name,
      mockBlankCookie.value,
      mockBlankCookie.attributes,
    );
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if user is null after session validation", async () => {
    mockLuciaValidateSession.mockResolvedValue({
      user: null,
      session: mockSessionData,
    });
    const request = createMockRequest("test");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should set a new session cookie if session is fresh", async () => {
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockFreshSessionData,
    });
    const request = createMockRequest("test");

    await GET(request);

    expect(mockCreateSessionCookie).toHaveBeenCalledWith(
      mockFreshSessionData.id,
    );
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockNewSessionCookie.name,
      mockNewSessionCookie.value,
      mockNewSessionCookie.attributes,
    );
  });

  // --- Search Logic Tests ---
  it("should call prisma queries with correct search terms and includes/selects", async () => {
    const query = "Test Query";
    const request = createMockRequest(query);
    await GET(request);

    // Check Post Query
    expect(mockPostFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { content: { contains: query, mode: "insensitive" } },
          { 
            user: { 
              displayName: { contains: query, mode: "insensitive" },
              deletedAt: null,
            },
          },
          { 
            user: { 
              username: { contains: query, mode: "insensitive" },
              deletedAt: null,
            },
          },
        ],
        user: {
          deletedAt: null,
        },
      },
      include: mockGetPostDataInclude(loggedInUserId),
      orderBy: { createdAt: "desc" },
      take: pageSize,
    });
    expect(mockGetPostDataInclude).toHaveBeenCalledWith(loggedInUserId);

    // Check User Query
    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: mockGetUserDataSelect(loggedInUserId),
      take: pageSize,
    });
    expect(mockGetUserDataSelect).toHaveBeenCalledWith(loggedInUserId);

    // Check Event Query (fetchValidEvents part)
    // This depends on the default case in fetchValidEvents (no username)
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
      include: mockGetEventDataInclude(loggedInUserId),
    });
    expect(mockGetEventDataInclude).toHaveBeenCalledWith(loggedInUserId);
  });

  it("should filter events correctly based on query", async () => {
    const query = "Venue B"; // Should match event2 location
    mockEventFindMany.mockResolvedValue(mockEvents); // Provide full event list
    const request = createMockRequest(query);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].id).toBe("event2");
  });

  it("should filter events correctly based on date query", async () => {
    const query = "06/15/2024"; // Should match event1 date
    mockEventFindMany.mockResolvedValue(mockEvents); // Provide full event list
    const request = createMockRequest(query);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].id).toBe("event1");
  });

  it("should return results from all sources", async () => {
    const query = "Test";
    const request = createMockRequest(query);
    // Ensure mocks return something
    mockPostFindMany.mockResolvedValue([mockPosts[0]]);
    mockUserFindMany.mockResolvedValue([mockUsers[0]]);
    // Event filtering will happen in memory, ensure mockEventFindMany returns events that will match
    mockEventFindMany.mockResolvedValue(mockEvents);

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toEqual([mockUsers[0]]);
    expect(body.posts).toEqual([mockPosts[0]]);
    expect(body.events).toHaveLength(2); // Both mock events contain "Test"
    expect(body.events[0].id).toBe("event1"); // Sorted by date
    expect(body.events[1].id).toBe("event2");
  });

  // --- Error Handling ---
  it("should return 500 if post query fails", async () => {
    mockPostFindMany.mockRejectedValue(new Error("Post DB Error"));
    const request = createMockRequest("test");
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });

  it("should return 500 if user query fails", async () => {
    mockUserFindMany.mockRejectedValue(new Error("User DB Error"));
    const request = createMockRequest("test");
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });

  it("should return 500 if event query fails", async () => {
    mockEventFindMany.mockRejectedValue(new Error("Event DB Error"));
    const request = createMockRequest("test");
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
