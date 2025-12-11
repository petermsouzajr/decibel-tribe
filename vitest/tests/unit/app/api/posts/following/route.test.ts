import { describe, it, expect, vi, beforeEach, Mock, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { PostsPage, PostData } from "@/lib/types";

// --- Define Persistent Mock Functions for Cookies ---
let mockCookiesGet: Mock = vi.fn();
let mockCookiesSet: Mock = vi.fn();

// --- Top-Level Let Variables for Other Mock Functions ---
let mockLuciaValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockFollowFindMany: Mock;
let mockPostFindMany: Mock;
let mockGetPostDataInclude: Mock;

// --- Mock Dependencies BEFORE Imports ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    follow: {
      findMany: vi.fn(), // Return vi.fn() directly
    },
    post: {
      findMany: vi.fn(), // Return vi.fn() directly
    },
  },
}));

vi.mock("@/auth", () => ({
  lucia: {
    sessionCookieName: "auth_session",
    validateSession: vi.fn(), // Return vi.fn() directly
    createBlankSessionCookie: vi.fn(), // Return vi.fn() directly
    createSessionCookie: vi.fn(), // Return vi.fn() directly
  },
}));

// Mock only specific parts of @/lib/types
vi.mock("@/lib/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/types")>();
  return {
    ...actual, // Keep original exports like PostData, PostsPage
    getPostDataInclude: vi.fn(), // Mock only this function
  };
});

// --- Import Mocked Modules to Access Mock Functions ---
import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { getPostDataInclude } from "@/lib/types"; // Import the mocked function

// --- Import Route Handler AFTER Mocks ---
import { GET } from "@/app/api/posts/following/route";

// --- Test Suite ---
describe("API Route: GET /api/posts/following", () => {
  // --- Constants ---
  const loggedInUserId = "user_posts_follower_1";
  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "session_following_posts", fresh: false };
  const mockFreshSessionData = { ...mockSessionData, fresh: true };
  const mockBlankCookie = {
    name: "auth_session",
    value: "",
    attributes: { expires: expect.any(Date) },
  };
  const newSessionCookie = {
    name: "auth_session",
    value: "new-session-id",
    attributes: {},
  };
  const mockFollowingIds = ["followed_user_1", "followed_user_2"];
  const mockFollows = mockFollowingIds.map((id) => ({ followingId: id }));
  // Define a more complete PostData structure matching Prisma select/include
  const mockPosts: PostData[] = Array.from({ length: 11 }, (_, i) => ({
    // Create 11 for pagination check
    id: `post_following_${i}`,
    content: `Following post content ${i}`,
    userId: mockFollowingIds[i % mockFollowingIds.length],
    groupId: null,
    sharedFromId: null,
    sharedCount: 0,
    createdAt: new Date(Date.now() - i * 3600 * 1000), // More spread out dates
    updatedAt: new Date(Date.now() - i * 3600 * 1000), // Add updatedAt, same as createdAt
    user: {
      id: mockFollowingIds[i % mockFollowingIds.length],
      username: `followed_user_${(i % 2) + 1}`,
      displayName: `User ${(i % 2) + 1}`,
      avatarUrl: null,
      bio: null,
      createdAt: new Date(),
      email: `user${(i % 2) + 1}@test.com`,
      passwordHash: null,
      deletedAt: null,
      userPreferences: null,
      userInstruments: [],
      userSkills: [],
      isDatingActive: false,
      user_dating_preferences: null,
      _count: { posts: 0, followers: 0 },
      followers: [],
    },
    Group: null,
    likes: [],
    dislikes: [],
    bookmarks: [],
    _count: { likes: 0, dislikes: 0, comments: 0 },
    attachments: [],
    sharedFrom: null,
  }));

  const expectedPostFindManyWhereClause = {
    user: {
      followers: { some: { followerId: loggedInUserId } },
      deletedAt: null,
      blocksReceived: { none: { blockerId: loggedInUserId } },
    },
    groupId: null,
  };
  const expectedPostFindManyBaseArgs = {
    include: expect.any(Object), // We trust getPostDataInclude mock covers this
    orderBy: { createdAt: "desc" },
    take: 11, // pageSize + 1
  };

  let request: NextRequest;

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    // Reset persistent cookie mocks specifically
    mockCookiesGet.mockReset();
    mockCookiesSet.mockReset();

    // Assign mocks to top-level variables
    mockLuciaValidateSession = lucia.validateSession as Mock;
    mockCreateBlankSessionCookie = lucia.createBlankSessionCookie as Mock;
    mockCreateSessionCookie = lucia.createSessionCookie as Mock;
    mockFollowFindMany = prisma.follow.findMany as Mock;
    mockPostFindMany = prisma.post.findMany as Mock;
    mockGetPostDataInclude = getPostDataInclude as Mock;

    // --- Set Default Mock Behaviors ---
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(newSessionCookie);
    mockFollowFindMany.mockResolvedValue(mockFollows); // Default: user follows people
    // IMPORTANT: Resolve with 11 posts by default for pagination check in relevant tests
    mockPostFindMany.mockResolvedValue(mockPosts.slice(0, 11));
    // Default mock for getPostDataInclude - adjust based on actual implementation if needed
    mockGetPostDataInclude.mockReturnValue({
      user: { select: { username: true, displayName: true, avatarUrl: true } },
      attachments: true,
      likes: { where: { userId: loggedInUserId } },
      dislikes: { where: { userId: loggedInUserId } },
      bookmarks: { where: { userId: loggedInUserId } },
      _count: {
        select: {
          likes: true,
          dislikes: true,
          comments: true,
          bookmarks: true,
        },
      },
    });
  });

  // Helper to create request
  const createMockRequest = (cursor?: string): NextRequest => {
    const url = new URL("http://localhost/api/posts/following");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }
    // Add limit parameter if needed by route
    // url.searchParams.set("limit", "10");
    return new NextRequest(url);
  };

  // --- Authentication Tests ---
  it("should return 401 if no session cookie is found", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue(undefined);
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).not.toHaveBeenCalled();
    expect(mockFollowFindMany).not.toHaveBeenCalled();
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "invalid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("invalid_session_id");
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockBlankCookie.name,
      mockBlankCookie.value,
      mockBlankCookie.attributes,
    );
    expect(mockFollowFindMany).not.toHaveBeenCalled();
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if user is null after session validation", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: null, // Session valid, user null
      session: mockSessionData,
    });
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
    expect(mockFollowFindMany).not.toHaveBeenCalled();
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should set a new session cookie if session is fresh", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockFreshSessionData, // Use fresh session
    });
    // Ensure prisma mocks resolve for the success path
    mockFollowFindMany.mockResolvedValue(mockFollows);
    mockPostFindMany.mockResolvedValue(mockPosts.slice(0, 11)); // Provide enough posts
    request = createMockRequest();

    // Act
    await GET(request);

    // Assert
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
    expect(mockCreateSessionCookie).toHaveBeenCalledWith(
      mockFreshSessionData.id,
    );
    expect(mockCookiesSet).toHaveBeenCalledWith(
      newSessionCookie.name,
      newSessionCookie.value,
      newSessionCookie.attributes,
    );
    // Check prisma calls still happened
    expect(mockFollowFindMany).toHaveBeenCalled();
    expect(mockPostFindMany).toHaveBeenCalled();
  });

  // --- Data Fetching Tests ---
  it("should fetch posts from followed users correctly on initial load", async () => {
    // Arrange
    request = createMockRequest();
    // Ensure post mock returns enough for pagination check but not zero
    mockPostFindMany.mockResolvedValue(mockPosts.slice(0, 11));
    // No need to mock follow findMany here as it's not directly used for the post query filter

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(10); // Should slice to pageSize
    expect(body.nextCursor).toBe(mockPosts[9].id); // 10th post's ID (index 9)
    expect(mockGetPostDataInclude).toHaveBeenCalledWith(loggedInUserId);
    // Check the actual Prisma Post query
    expect(mockPostFindMany).toHaveBeenCalledWith({
      ...expectedPostFindManyBaseArgs,
      where: expectedPostFindManyWhereClause,
      cursor: undefined, // No cursor on initial load
    });
    // Follow query is still called internally by the route, just not used for post filtering directly
    expect(mockFollowFindMany).toHaveBeenCalledWith({
      where: { followerId: loggedInUserId },
      select: { followingId: true },
    });
  });

  it("should fetch the next page of posts using the cursor", async () => {
    // Arrange
    const cursor = "post_following_9"; // Cursor points to the 10th item
    request = createMockRequest(cursor);
    // Simulate DB returning the next set of posts (fewer than pageSize + 1)
    mockPostFindMany.mockResolvedValue(mockPosts.slice(10)); // Only the 11th post remains

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(1); // Only the 11th post
    expect(body.nextCursor).toBeNull(); // No more posts after this page
    expect(mockGetPostDataInclude).toHaveBeenCalledWith(loggedInUserId);
    // Check the actual Prisma Post query with cursor
    expect(mockPostFindMany).toHaveBeenCalledWith({
      ...expectedPostFindManyBaseArgs,
      where: expectedPostFindManyWhereClause,
      cursor: { id: cursor }, // Cursor should be included
    });
    // Follow query is still called internally by the route
    expect(mockFollowFindMany).toHaveBeenCalledWith({
      where: { followerId: loggedInUserId },
      select: { followingId: true },
    });
  });

  it("should return an empty list and null cursor if user follows no one", async () => {
    // Arrange
    request = createMockRequest();
    // Explicitly mock follow findMany to return empty for this scenario
    mockFollowFindMany.mockResolvedValue([]);
    // Crucially, mock post findMany to return empty because the 'where' clause
    // derived from the loggedInUserId will find no posts if no one is followed.
    mockPostFindMany.mockResolvedValue([]);

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.posts).toEqual([]); // Expect empty posts array
    expect(body.nextCursor).toBeNull();
    expect(mockFollowFindMany).toHaveBeenCalledWith({
      // Follow query is still called
      where: { followerId: loggedInUserId },
      select: { followingId: true },
    });
    expect(mockPostFindMany).toHaveBeenCalledWith({
      // Post query is called but returns [] due to mock
      ...expectedPostFindManyBaseArgs,
      where: expectedPostFindManyWhereClause,
      cursor: undefined,
    });
  });

  it("should return an empty list and null cursor if followed users have no posts", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockFollowFindMany.mockResolvedValue(mockFollows);
    mockPostFindMany.mockResolvedValue([]); // No posts found
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body: PostsPage = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.posts).toEqual([]);
    expect(body.nextCursor).toBeNull();
    expect(mockFollowFindMany).toHaveBeenCalled();
    expect(mockPostFindMany).toHaveBeenCalled();
  });

  // --- Error Handling Tests ---
  it("should return 500 if prisma follow query fails", async () => {
    // Arrange
    // Removed await import
    const dbError = new Error("DB Follow Error");
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockFollowFindMany.mockRejectedValue(dbError);
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(mockFollowFindMany).toHaveBeenCalled(); // Ensure it was called
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should return 500 if prisma post query fails", async () => {
    // Arrange
    // Removed await import
    const dbError = new Error("DB Post Error");
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockFollowFindMany.mockResolvedValue(mockFollows);
    mockPostFindMany.mockRejectedValue(dbError);
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(mockFollowFindMany).toHaveBeenCalled();
    expect(mockPostFindMany).toHaveBeenCalled(); // Ensure it was called
  });
});
