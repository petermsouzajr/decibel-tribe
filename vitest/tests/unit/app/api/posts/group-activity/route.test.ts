import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest } from "next/server";

// Import types, but not the actual implementations of mocked modules yet
import type { PostsPage, PostData } from "@/lib/types"; // Keep type imports
import type { GET as GETType } from "@/app/api/posts/group-activity/route";

// --- Mock Variables Declaration ---
let mockCookiesGet: Mock;
let mockCookiesSet: Mock;
let mockLuciaValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockGroupMemberFindMany: Mock;
let mockPostFindMany: Mock;
let mockGetPostDataInclude: Mock;

// Helper function for creating mock requests remains useful
const createMockRequest = (cursor?: string): NextRequest => {
  const url = new URL("http://localhost/api/posts/group-activity");
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  return new NextRequest(url);
};

// --- Test Suite ---
describe("API Route: GET /api/posts/group-activity", () => {
  // Define test constants
  const loggedInUserId = "user_in_groups_1";
  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "session_group_act", fresh: false };
  const mockFreshSessionData = { ...mockSessionData, fresh: true };
  const mockBlankCookie = {
    name: "auth_session",
    value: "",
    attributes: { expires: new Date(0) }, // Use fixed date for predictability
  };
  const mockNewSessionCookie = {
    name: "auth_session",
    value: "new-session-id",
    attributes: {},
  };
  const mockGroupIds = ["group1", "group2"];
  const mockUserGroups = mockGroupIds.map((id) => ({ groupId: id }));
  const mockPostsData: PostData[] = Array.from({ length: 5 }, (_, i) => ({
    id: `post-${i}`,
    content: `Group post content ${i}`,
    userId: `user-${i}`,
    groupId: "group-1",
    createdAt: new Date(Date.now() - i * 1000 * 60 * 5),
    updatedAt: new Date(Date.now() - i * 1000 * 60 * 5),
    user: {
      id: `user-${i}`,
      username: `testuser${i}`,
      displayName: `User ${i}`,
      avatarUrl: null,
      bio: null,
      createdAt: new Date(),
      email: `user${i}@test.com`,
      passwordHash: null,
      deletedAt: null,
      userPreferences: null,
      userInstruments: [],
      userSkills: [],
      followers: [],
      _count: { followers: 0, posts: 0 },
    }, // Example UserData
    likes: [],
    bookmarks: [],
    attachments: [],
    dislikes: [],
    Group: {
      id: mockGroupIds[i % mockGroupIds.length],
      name: `Group ${(i % 2) + 1}`,
      slug: `group-${(i % 2) + 1}`,
    }, // Example GroupData
    _count: { likes: i, comments: i * 2, bookmarks: i * 3, dislikes: i }, // Example counts
  }));

  // Define GET function type once
  let GET: typeof GETType;

  beforeEach(async () => {
    // 1. Reset mocks and modules
    vi.resetAllMocks();
    vi.resetModules(); // Necessary when using vi.doMock and await import

    // 2. Define mock function implementations
    mockCookiesGet = vi.fn();
    mockCookiesSet = vi.fn();
    mockLuciaValidateSession = vi.fn();
    mockCreateBlankSessionCookie = vi.fn(() => mockBlankCookie);
    mockCreateSessionCookie = vi.fn(() => mockNewSessionCookie);
    mockGroupMemberFindMany = vi.fn();
    mockPostFindMany = vi.fn();
    // Keep the actual include structure for the mock
    mockGetPostDataInclude = vi.fn((_userId: string | undefined) => ({
      user: true,
      group: true,
      attachments: true,
      likes: _userId ? { where: { userId: _userId } } : false,
      bookmarks: _userId ? { where: { userId: _userId } } : false,
      _count: {
        select: {
          likes: true,
          comments: true,
          bookmarks: true,
          dislikes: true,
        },
      }, // added dislikes
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
        groupMember: { findMany: mockGroupMemberFindMany },
        post: { findMany: mockPostFindMany },
      },
    }));

    vi.doMock("@/auth", () => ({
      lucia: {
        sessionCookieName: "auth_session",
        validateSession: mockLuciaValidateSession,
        createBlankSessionCookie: mockCreateBlankSessionCookie,
        createSessionCookie: mockCreateSessionCookie,
      },
    }));

    // Mock @/lib/types using doMock
    const originalTypes =
      await vi.importActual<typeof import("@/lib/types")>("@/lib/types");
    vi.doMock("@/lib/types", () => ({
      ...originalTypes, // Keep other exports real
      getPostDataInclude: mockGetPostDataInclude,
    }));

    // 4. Set default mock behaviors *after* mocks are applied
    mockCookiesGet.mockImplementation((name: string) =>
      name === "auth_session" ? { value: "valid_session_id" } : undefined,
    );
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    // Default DB mocks
    mockGroupMemberFindMany.mockResolvedValue(mockUserGroups);
    mockPostFindMany.mockResolvedValue([]); // Default to empty posts

    // 5. Dynamically import the module under test *after* mocks are set up
    const mod = await import("@/app/api/posts/group-activity/route");
    GET = mod.GET;
  });

  // --- Authentication Tests ---
  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet.mockImplementation(() => undefined); // No cookie
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null }); // Ensure validation also fails if called

    const request = createMockRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLuciaValidateSession).not.toHaveBeenCalled(); // Should not be called if cookie missing
    expect(mockGroupMemberFindMany).not.toHaveBeenCalled();
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    mockCookiesGet.mockImplementation(() => ({ value: "invalid_session_id" }));
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null }); // Simulate validation failure

    const request = createMockRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("invalid_session_id");
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
    expect(mockCookiesSet).toHaveBeenCalledWith(
      // Check set was called
      mockBlankCookie.name,
      mockBlankCookie.value,
      mockBlankCookie.attributes,
    );
    expect(mockGroupMemberFindMany).not.toHaveBeenCalled();
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if user is null after session validation", async () => {
    // Default beforeEach sets valid cookie
    mockLuciaValidateSession.mockResolvedValue({
      user: null,
      session: mockSessionData,
    }); // Session valid, user null

    const request = createMockRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
    expect(mockGroupMemberFindMany).not.toHaveBeenCalled();
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should set a new session cookie if session is fresh", async () => {
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockFreshSessionData, // Fresh session
    });
    // Ensure DB mocks succeed for this test
    mockGroupMemberFindMany.mockResolvedValue(mockUserGroups);
    mockPostFindMany.mockResolvedValue([]);

    const request = createMockRequest();
    await GET(request); // Call the route handler

    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
    expect(mockCreateSessionCookie).toHaveBeenCalledWith(
      mockFreshSessionData.id,
    );
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockNewSessionCookie.name,
      mockNewSessionCookie.value,
      mockNewSessionCookie.attributes,
    );
    // Ensure main logic still runs
    expect(mockGroupMemberFindMany).toHaveBeenCalled();
    expect(mockPostFindMany).toHaveBeenCalled();
  });

  // --- Functionality Tests ---
  it("should return empty posts if user is not in any groups", async () => {
    mockGroupMemberFindMany.mockResolvedValue([]); // User in no groups

    const request = createMockRequest();
    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toEqual([]);
    expect(body.nextCursor).toBeNull();
    expect(mockGroupMemberFindMany).toHaveBeenCalledWith({
      where: { userId: loggedInUserId, acceptedInvite: true },
      select: { groupId: true },
    });
    // Should still call post findMany, but with an empty 'in' array
    expect(mockPostFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: { in: [] } }, // Check for empty array
      }),
    );
    expect(mockGetPostDataInclude).toHaveBeenCalledWith(loggedInUserId);
  });

  it("should return empty posts if user is in groups but groups have no posts", async () => {
    mockGroupMemberFindMany.mockResolvedValue(mockUserGroups);
    mockPostFindMany.mockResolvedValue([]); // No posts found for those groups

    const request = createMockRequest();
    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toEqual([]);
    expect(body.nextCursor).toBeNull();
    expect(mockGroupMemberFindMany).toHaveBeenCalledTimes(1);
    expect(mockPostFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: { in: mockGroupIds } }, // Check for group IDs
      }),
    );
  });

  it("should fetch posts from user's groups without cursor", async () => {
    mockGroupMemberFindMany.mockResolvedValue(mockUserGroups);
    // Return only some posts, less than pageSize + 1
    const postsToReturn = mockPostsData.slice(0, 3);
    mockPostFindMany.mockResolvedValue(postsToReturn);

    const request = createMockRequest();
    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetPostDataInclude).toHaveBeenCalledWith(loggedInUserId);
    const expectedInclude = mockGetPostDataInclude(loggedInUserId);
    expect(mockPostFindMany).toHaveBeenCalledWith({
      where: { groupId: { in: mockGroupIds } },
      include: expectedInclude,
      orderBy: { createdAt: "desc" },
      take: 11, // pageSize + 1
      // No cursor or skip expected
    });
    expect(body.posts).toHaveLength(3);
    expect(body.posts[0].id).toBe(mockPostsData[0].id);
    expect(body.nextCursor).toBeNull(); // Because less than pageSize+1 were returned
  });

  it("should fetch posts from user's groups with cursor", async () => {
    const pageSize = 10; // Default in route
    // Create enough mock posts for pagination (N+2 for this test)
    const manyMockPosts: PostData[] = Array.from(
      { length: pageSize + 2 },
      (_, i) => ({
        id: `post-${i + 1}`,
        content: `Content ${i + 1}`,
        userId: `user-${i % 3}`,
        groupId: "group-1",
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60), // Hours ago
        updatedAt: new Date(Date.now() - i * 1000 * 60 * 60), // Add updatedAt, same as createdAt
        user: {
          id: `user-${i % 3}`,
          username: `username${i % 3}`,
          displayName: `User ${i}`,
          avatarUrl: null,
          bio: null,
          createdAt: new Date(),
          email: `user${i}@test.com`,
          passwordHash: null,
          deletedAt: null,
          userPreferences: null,
          userInstruments: [],
          userSkills: [],
          followers: [],
          _count: { followers: 0, posts: 0 },
        },
        likes: [],
        bookmarks: [],
        attachments: [],
        dislikes: [],
        Group: { id: mockGroupIds[0], name: "G1", slug: "g1" },
        _count: { likes: i, comments: i * 2, bookmarks: i * 3, dislikes: 0 },
      }),
    );

    const cursor = "post-1"; // Use ID of first post as cursor

    // --- Mock Implementation for this specific test ---
    mockGroupMemberFindMany.mockResolvedValue(mockUserGroups);
    // Simulate Prisma's cursor behavior: return items *after* the cursor, respecting 'take'
    mockPostFindMany.mockImplementation(async (args) => {
      const take = args.take ?? pageSize + 1; // Default to pageSize + 1 if not specified
      if (args.cursor?.id === cursor) {
        // Find index of cursor and return the next N+1 items
        const cursorIndex = manyMockPosts.findIndex((p) => p.id === cursor);
        if (cursorIndex !== -1) {
          // Return slice starting *after* cursor, up to 'take' amount
          return manyMockPosts.slice(cursorIndex + 1, cursorIndex + 1 + take);
        }
      }
      // Default fallback or handle non-cursor case if needed for this test setup
      return manyMockPosts.slice(0, take);
    });

    const request = createMockRequest(cursor);
    const response = await GET(request);
    const body: PostsPage = await response.json();

    expect(response.status).toBe(200);
    const expectedInclude = mockGetPostDataInclude(loggedInUserId);
    expect(mockPostFindMany).toHaveBeenCalledWith({
      where: { groupId: { in: mockGroupIds } },
      include: expectedInclude,
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: { id: cursor }, // Expect cursor arg
    });
    expect(body.posts).toHaveLength(pageSize); // Should return exactly pageSize
    expect(body.posts[0].id).toBe("post-2"); // Should start after the cursor
    expect(body.nextCursor).toBe(`post-${pageSize + 2}`);
  });

  it("should return 500 if finding groups fails", async () => {
    mockGroupMemberFindMany.mockRejectedValue(new Error("DB Group Error"));
    const request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });

  it("should return 500 if finding posts fails", async () => {
    mockGroupMemberFindMany.mockResolvedValue(mockUserGroups); // Groups found
    mockPostFindMany.mockRejectedValue(new Error("DB Post Error")); // Posts fail
    const request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });
});
