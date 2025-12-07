import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/posts/for-you/route"; // Correct path
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";
import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";

// --- Mocks ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock prisma internally
vi.mock("@/lib/prisma", () => ({
  default: {
    post: {
      findMany: vi.fn(),
    },
  },
}));

// Mock @/lib/types INTERNALLY
vi.mock("@/lib/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/types")>();
  // Define mock function INTERNALLY
  const internalMockGetPostDataInclude = vi.fn((_userId: string) => ({
    user: true,
    group: true,
    attachments: true,
    likes: { where: { userId: _userId } },
    bookmarks: { where: { userId: _userId } },
    _count: { select: { likes: true, comments: true, bookmarks: true } },
  }));
  return {
    ...actual,
    // Export the internal mock function
    getPostDataInclude: internalMockGetPostDataInclude,
  };
});

// Explicitly import the mocked types module to access the mock
// NOTE: Ensure this import comes AFTER all vi.mock calls
import * as mockedTypes from "@/lib/types";

// Modify vi.mock for @/auth
vi.mock("@/auth", () => {
  // Define mocks INTERNALLY
  const internalMockValidateSession = vi.fn();
  const internalMockCreateBlank = vi.fn(() => ({
    name: "auth_session",
    value: "",
    attributes: { expires: new Date(0) },
  }));
  const internalMockCreateSession = vi.fn(() => ({
    name: "auth_session",
    value: "new-session-id",
    attributes: {},
  }));

  return {
    lucia: {
      // Assuming lucia is an object export
      validateSession: internalMockValidateSession,
      createBlankSessionCookie: internalMockCreateBlank,
      createSessionCookie: internalMockCreateSession,
      sessionCookieName: "auth_session", // Keep mocking this
    },
  };
});

// Update helper to use imported mock
const mockSessionValidation = (
  user: { id: string } | null,
  session: { id: string; fresh: boolean } | null,
) => {
  // Access mock via imported lucia object and cast to Mock
  (lucia.validateSession as Mock).mockResolvedValue({ user, session });
};

// Helper to mock cookie retrieval
const mockCookiesGet = (value: string | undefined) => {
  (cookies as Mock).mockReturnValue({
    get: vi.fn((name: string) =>
      name === lucia.sessionCookieName ? { value } : undefined,
    ),
    set: vi.fn(), // Mock the set method as well
  });
};

describe("API Route: GET /api/posts/for-you", () => {
  const loggedInUserId = "user_for_you_viewer_1";
  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "session_for_you", fresh: false };
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
  const mockPosts = Array.from({ length: 15 }, (_, i) => ({
    id: `post_for_you_${i}`,
    content: `For You post content ${i}`,
    userId: `author_${i}`,
    groupId: null,
    createdAt: new Date(Date.now() - i * 10000),
    // Add other fields based on PostData type and getPostDataInclude
    user: {
      id: `author_${i}`,
      username: `author${i}`,
      displayName: `Author ${i}`,
      avatarUrl: null,
    },
    group: null,
    attachments: [],
    likes: [],
    bookmarks: [],
    _count: { likes: 0, comments: 0, bookmarks: 0 },
  }));

  let request: NextRequest;

  beforeEach(() => {
    vi.resetAllMocks();
    mockCookiesGet("valid_session_id");
    mockSessionValidation(mockLoggedInUser, mockSessionData);
    ((cookies() as unknown as UnsafeUnwrappedCookies).set as Mock)?.mockClear();
    // Clear prisma mock via imported object
    (prisma.post.findMany as Mock).mockClear();
    // Clear mock via imported object, casting to Mock
    (mockedTypes.getPostDataInclude as Mock).mockClear();
    (lucia.createBlankSessionCookie as Mock).mockClear();
    (lucia.createSessionCookie as Mock).mockClear();
  });

  // Helper to create request
  const createMockRequest = (cursor?: string): NextRequest => {
    const url = new URL("http://localhost/api/posts/for-you");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }
    return new NextRequest(url);
  };

  // --- Authentication Tests ---
  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet(undefined);
    mockSessionValidation(null, null);
    request = createMockRequest();

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(lucia.validateSession).not.toHaveBeenCalled();
    expect(prisma.post.findMany).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    mockCookiesGet("invalid_session_id");
    mockSessionValidation(null, null); // Simulate validation failure
    // Cast to Mock to use mockReturnValue
    (lucia.createBlankSessionCookie as Mock).mockReturnValue(mockBlankCookie);
    request = createMockRequest();

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(lucia.validateSession).toHaveBeenCalledWith("invalid_session_id");
    expect(lucia.createBlankSessionCookie).toHaveBeenCalled();
    expect((await cookies()).set).toHaveBeenCalledWith(
      mockBlankCookie.name,
      mockBlankCookie.value,
      mockBlankCookie.attributes,
    );
    expect(prisma.post.findMany).not.toHaveBeenCalled();
  });

  it("should return 401 if user is null after session validation", async () => {
    mockCookiesGet("valid_session_id");
    mockSessionValidation(null, mockSessionData); // Session valid, user null
    request = createMockRequest();

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(lucia.validateSession).toHaveBeenCalledWith("valid_session_id");
    expect(prisma.post.findMany).not.toHaveBeenCalled();
  });

  it("should set a new session cookie if session is fresh", async () => {
    mockSessionValidation(mockLoggedInUser, mockFreshSessionData); // Fresh session
    // Cast to Mock to use mockReturnValue
    (lucia.createSessionCookie as Mock).mockReturnValue(mockNewSessionCookie);
    (prisma.post.findMany as Mock).mockResolvedValue([]); // Mock DB success for posts
    request = createMockRequest();

    await GET(request);

    expect(lucia.validateSession).toHaveBeenCalledWith("valid_session_id");
    expect(lucia.createSessionCookie).toHaveBeenCalledWith(
      mockFreshSessionData.id,
    );
    expect((await cookies()).set).toHaveBeenCalledWith(
      mockNewSessionCookie.name,
      mockNewSessionCookie.value,
      mockNewSessionCookie.attributes,
    );
    expect(prisma.post.findMany).toHaveBeenCalled();
  });

  // --- Functionality Tests ---
  it("should return an empty list and null cursor if no posts are found", async () => {
    (prisma.post.findMany as Mock).mockResolvedValue([]);
    request = createMockRequest();

    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toEqual([]);
    expect(body.nextCursor).toBeNull();
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(mockedTypes.getPostDataInclude).toHaveBeenCalledWith(loggedInUserId);
    expect(prisma.post.findMany).toHaveBeenCalledWith({
      where: { groupId: null },
      include: mockedTypes.getPostDataInclude(loggedInUserId),
      orderBy: { createdAt: "desc" },
      take: 11, // pageSize + 1
      cursor: undefined,
    });
  });

  it("should return posts without pagination if fewer than page size + 1", async () => {
    // Simulate returning fewer posts than pageSize + 1
    const smallMockPosts = mockPosts.slice(0, 3);
    (prisma.post.findMany as Mock).mockResolvedValue(smallMockPosts);
    request = createMockRequest();

    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(3);
    expect(body.posts[0].id).toBe(mockPosts[0].id);
    expect(body.nextCursor).toBeNull();
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(mockedTypes.getPostDataInclude).toHaveBeenCalledWith(loggedInUserId);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: null },
        take: 11,
        cursor: undefined,
      }),
    );
  });

  it("should return posts with pagination if more than page size", async () => {
    // Simulate returning pageSize + 1 posts (11 posts)
    const paginatedMockPosts = mockPosts.slice(0, 11); // Get 11 posts
    (prisma.post.findMany as Mock).mockResolvedValue(paginatedMockPosts);
    request = createMockRequest();

    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(10); // Should only return pageSize (10) posts
    expect(body.posts[9].id).toBe(mockPosts[9].id); // Check last post is correct (index 9)
    // Cursor should be the ID of the 10th post (index 9) because we didn't skip
    expect(body.nextCursor).toBe(mockPosts[10].id); // Cursor is 11th item (index 10)
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: null },
        take: 11,
        cursor: undefined,
        skip: undefined, // Ensure skip is undefined here
      }),
    );
  });

  it("should fetch next page using cursor", async () => {
    const cursor = mockPosts[9].id; // Use ID of the 10th post from the previous page simulation
    // Simulate next page posts (posts 11-15 -> indices 10-14)
    // Fetch take:11, skip:1 starting AFTER index 9. Mock should return items 10, 11, 12, 13, 14 (5 items)
    const nextPageMockPosts = mockPosts.slice(10, 15);
    (prisma.post.findMany as Mock).mockResolvedValue(nextPageMockPosts);
    request = createMockRequest(cursor);

    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(5); // Expect the 5 posts returned by mock
    expect(body.posts[0].id).toBe(mockPosts[10].id); // First post is the 11th overall
    expect(body.nextCursor).toBeNull(); // Less than pageSize returned, so no next cursor
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: null },
        take: 11,
        cursor: { id: cursor }, // Check cursor is used
        skip: 1, // Check skip is used
      }),
    );
  });

  it("should return 500 if database query fails", async () => {
    (prisma.post.findMany as Mock).mockRejectedValue(new Error("DB Error"));
    request = createMockRequest();

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    // Check that getPostDataInclude was still called as part of the attempt
    expect(mockedTypes.getPostDataInclude).toHaveBeenCalledWith(loggedInUserId);
  });
});
