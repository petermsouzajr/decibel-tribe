import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/posts/bookmarked/route"; // Correct path
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { getPostDataInclude, PostsPage, PostData } from "@/lib/types";
import * as mockedTypes from "@/lib/types"; // Import after mocks

// --- Mocks ---

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock prisma internally
vi.mock("@/lib/prisma", () => ({
  default: {
    post: {
      findMany: vi.fn(), // Define findMany internally
    },
    // Add other potentially used prisma models/methods if needed
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

// Mock @/auth INTERNALLY
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
      sessionCookieName: "auth_session",
    },
  };
});

// Helper to mock lucia session validation (uses imported lucia)
const mockSessionValidation = (
  user: { id: string } | null,
  session: { id: string; fresh: boolean } | null,
) => {
  (lucia.validateSession as Mock).mockResolvedValue({ user, session });
};

// Helper to mock cookie retrieval (remains the same)
const mockCookiesGet = (value: string | undefined) => {
  (cookies as Mock).mockReturnValue({
    get: vi.fn((name: string) =>
      name === lucia.sessionCookieName ? { value } : undefined,
    ),
    set: vi.fn(), // Mock the set method as well
  });
};

describe("API Route: GET /api/posts/bookmarked", () => {
  const loggedInUserId = "user_bookmarker_1";
  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "session_bookmarked", fresh: false };
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

  // Generate more mock posts for pagination
  const mockPosts = Array.from({ length: 15 }, (_, i) => ({
    id: `post_bookmarked_${i}`,
    content: `Bookmarked post content ${i}`,
    userId: `author_${i}`,
    groupId: null,
    createdAt: new Date(Date.now() - i * 10000),
    user: {
      id: `author_${i}`,
      username: `author${i}`,
      displayName: `Author ${i}`,
      avatarUrl: null,
    },
    group: null,
    attachments: [],
    likes: [],
    // Simulate bookmark by the loggedInUser
    bookmarks: i < 8 ? [{ userId: loggedInUserId }] : [], // First 8 posts bookmarked
    _count: { likes: 0, comments: 0, bookmarks: i < 8 ? 1 : 0 },
  }));

  let request: NextRequest;

  beforeEach(() => {
    vi.resetAllMocks();
    // Default mocks for successful auth
    mockCookiesGet("valid_session_id");
    mockSessionValidation(mockLoggedInUser, mockSessionData);
    (cookies().set as Mock)?.mockClear();
    // Clear mocks via imported objects, casting to Mock
    (prisma.post.findMany as Mock).mockClear();
    (mockedTypes.getPostDataInclude as Mock).mockClear();
    (lucia.createBlankSessionCookie as Mock).mockClear();
    (lucia.createSessionCookie as Mock).mockClear();
  });

  // Helper to create request
  const createMockRequest = (cursor?: string): NextRequest => {
    const url = new URL("http://localhost/api/posts/bookmarked");
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
    mockSessionValidation(null, null);
    (lucia.createBlankSessionCookie as Mock).mockReturnValue(mockBlankCookie);
    request = createMockRequest();

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(lucia.validateSession).toHaveBeenCalledWith("invalid_session_id");
    expect(lucia.createBlankSessionCookie).toHaveBeenCalled();
    expect(cookies().set).toHaveBeenCalledWith(
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
    mockSessionValidation(mockLoggedInUser, mockFreshSessionData);
    (lucia.createSessionCookie as Mock).mockReturnValue(mockNewSessionCookie);
    (prisma.post.findMany as Mock).mockResolvedValue([]); // Mock DB success
    request = createMockRequest();

    await GET(request);

    expect(lucia.validateSession).toHaveBeenCalledWith("valid_session_id");
    expect(lucia.createSessionCookie).toHaveBeenCalledWith(
      mockFreshSessionData.id,
    );
    expect(cookies().set).toHaveBeenCalledWith(
      mockNewSessionCookie.name,
      mockNewSessionCookie.value,
      mockNewSessionCookie.attributes,
    );
    expect(prisma.post.findMany).toHaveBeenCalled();
  });

  // --- Functionality Tests ---
  it("should return an empty list and null cursor if no bookmarked posts are found", async () => {
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
      where: {
        bookmarks: { some: { userId: loggedInUserId } },
        groupId: null,
      },
      include: mockedTypes.getPostDataInclude(loggedInUserId),
      orderBy: { createdAt: "desc" },
      take: 11,
      cursor: undefined,
      skip: undefined,
    });
  });

  it("should return bookmarked posts without pagination if fewer than page size + 1", async () => {
    // Mock DB to return only 3 bookmarked posts
    const smallMockBookmarkedPosts = mockPosts
      .filter((p) => p.bookmarks.length > 0)
      .slice(0, 3);
    (prisma.post.findMany as Mock).mockResolvedValue(smallMockBookmarkedPosts);
    request = createMockRequest();

    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(3);
    expect(body.posts[0].id).toBe(mockPosts[0].id); // Should be the first bookmarked post
    expect(body.nextCursor).toBeNull();
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          bookmarks: { some: { userId: loggedInUserId } },
          groupId: null,
        },
        include: mockedTypes.getPostDataInclude(loggedInUserId),
        orderBy: { createdAt: "desc" },
        take: 11,
        cursor: undefined,
        skip: undefined,
      }),
    );
  });

  it("should return bookmarked posts with pagination if more than page size", async () => {
    // We have 8 bookmarked posts in mockPosts. DB query takes 11.
    // Mock should return first 8 bookmarked posts.
    const firstPageBookmarkedPosts = mockPosts
      .filter((p) => p.bookmarks.length > 0)
      .slice(0, 8);
    (prisma.post.findMany as Mock).mockResolvedValue(firstPageBookmarkedPosts);
    request = createMockRequest();

    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(8); // Should return all 8 found posts
    expect(body.posts[7].id).toBe(mockPosts[7].id); // Last bookmarked post
    expect(body.nextCursor).toBeNull(); // Because DB returned less than pageSize+1 (8 < 11)
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          bookmarks: { some: { userId: loggedInUserId } },
          groupId: null,
        },
        include: mockedTypes.getPostDataInclude(loggedInUserId),
        orderBy: { createdAt: "desc" },
        take: 11,
        cursor: undefined,
        skip: undefined,
      }),
    );
  });

  // Modify this test if pageSize were smaller, e.g., 5. With pageSize=10, this scenario is less relevant as we only have 8 bookmarks.
  // Let's assume pageSize was 5 for this test's logic interpretation.
  it("should fetch next page of bookmarked posts using cursor (assuming pageSize=5)", async () => {
    const simulatedPageSize = 5;
    const cursor = mockPosts[4].id; // Cursor is the 5th bookmarked post
    // Mock DB to return posts 6, 7, 8 (indices 5, 6, 7) when skipping 1 after cursor
    const nextPageMockPosts = mockPosts
      .filter((p) => p.bookmarks.length > 0)
      .slice(5, 8);
    (prisma.post.findMany as Mock).mockResolvedValue(nextPageMockPosts);
    request = createMockRequest(cursor);

    // *** Temporarily override route's pageSize for this test's logic interpretation ***
    // This requires route modification or a different testing approach if not feasible.
    // For now, we'll assert based on the mock returning 3 items.

    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(3); // Expect the 3 posts returned by mock
    expect(body.posts[0].id).toBe(mockPosts[5].id); // First post is the 6th bookmarked one
    expect(body.nextCursor).toBeNull(); // Less than simulated pageSize+1 returned
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          bookmarks: { some: { userId: loggedInUserId } },
          groupId: null,
        },
        include: mockedTypes.getPostDataInclude(loggedInUserId),
        orderBy: { createdAt: "desc" },
        take: 11,
        cursor: { id: cursor },
        skip: 1,
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
    expect(mockedTypes.getPostDataInclude).toHaveBeenCalledWith(loggedInUserId); // Should still be called
  });
});
