import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest } from "next/server";
import { GET, DELETE } from "@/app/api/posts/[postId]/route"; // Assuming PATCH is not used or tested here
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";
import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { getPostDataInclude, PostData } from "@/lib/types";

// --- Mocks ---

// Mock next/headers
vi.mock("next/headers", () => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  return {
    cookies: vi.fn(() => ({
      // cookies() returns an object
      get: mockGet, // with a mock .get() method
      set: mockSet, // and a mock .set() method
    })),
  };
});

// Mock prisma internally
vi.mock("@/lib/prisma", () => ({
  default: {
    post: {
      findUnique: vi.fn(), // Define internally
      delete: vi.fn(), // Define internally
      // update: vi.fn() // Add if PATCH tests were present
    },
  },
}));

// Mock @/lib/types INTERNALLY
vi.mock("@/lib/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/types")>();
  // Define mock function INTERNALLY
  const internalMockGetPostDataInclude = vi.fn((_userId: string | null) => ({
    user: true,
    group: true,
    attachments: true,
    likes: _userId ? { where: { userId: _userId } } : false,
    bookmarks: _userId ? { where: { userId: _userId } } : false,
    _count: { select: { likes: true, comments: true, bookmarks: true } },
  }));
  return {
    ...actual,
    getPostDataInclude: internalMockGetPostDataInclude,
  };
});

// Mock @/auth INTERNALLY
vi.mock("@/auth", () => {
  const internalMockValidateSession = vi.fn();
  const internalMockCreateBlank = vi.fn(() => ({
    /* ... blank cookie ... */
  }));
  const internalMockCreateSession = vi.fn(() => ({
    /* ... new session cookie ... */
  }));
  return {
    lucia: {
      validateSession: internalMockValidateSession,
      createBlankSessionCookie: internalMockCreateBlank,
      createSessionCookie: internalMockCreateSession,
      sessionCookieName: "auth_session",
    },
  };
});

// Import mocked types AFTER mocks
import * as mockedTypes from "@/lib/types";

// --- Test Suite ---

// Helper to mock lucia session validation
const mockSessionValidation = (
  user: { id: string } | null,
  session: { id: string; fresh: boolean } | null,
) => {
  (lucia.validateSession as Mock).mockResolvedValue({ user, session });
};

// Helper to mock cookie retrieval (now targets the .get method)
const mockCookiesGet = (value: string | undefined) => {
  // We need to access the mocked 'get' function inside the return value of cookies()
  const cookiesMock = (cookies() as unknown as UnsafeUnwrappedCookies) as unknown as { get: Mock; set: Mock };
  cookiesMock.get.mockReturnValue({ value }); // .get() returns an object like { value: '...' }
};

// Helper to create context
const createMockContext = (postId: string) => ({ params: Promise.resolve({ postId }) });

describe("API Route: /api/posts/[postId]", () => {
  const testPostId = "post123";
  const authorUserId = "user_author_abc";
  const loggedInUserId = "user_viewer_xyz";
  const otherUserId = "user_other_123";

  // Restore the detailed mockPost object definition
  const mockPost: PostData = {
    id: testPostId,
    content: "Test post content",
    userId: authorUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    groupId: null,
    sharedFromId: null,
    sharedCount: 0,
    user: {
      id: authorUserId,
      username: "author",
      displayName: "Author",
      avatarUrl: null,
      bio: null,
      createdAt: new Date(),
      email: "author@test.com",
      passwordHash: null,
      deletedAt: null,
      userPreferences: null,
      userInstruments: [],
      userSkills: [],
      isDatingActive: false,
      userDatingPreferences: null,
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
  };

  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "session_post_detail", fresh: false };
  const mockBlankCookie = {
    name: "auth_session",
    value: "",
    attributes: { expires: expect.any(Date) },
  };

  let request: NextRequest;
  let context: { params: Promise<{ postId: string }> };

  beforeEach(() => {
    vi.resetAllMocks();
    mockCookiesGet("valid_session_id"); // Set up the default .get() mock
    mockSessionValidation(mockLoggedInUser, mockSessionData);
    // (cookies().set as Mock)?.mockClear(); // Remove this line - resetAllMocks handles it
    // Clear mocks using imported objects
    (prisma.post.findUnique as Mock).mockClear();
    (prisma.post.delete as Mock).mockClear();
    // (prisma.post.update as Mock)?.mockClear(); // If update mock was added
    (mockedTypes.getPostDataInclude as Mock).mockClear();
    (lucia.createBlankSessionCookie as Mock).mockClear();
    (lucia.createSessionCookie as Mock).mockClear();

    // Default successful mocks using imported objects
    (prisma.post.findUnique as Mock).mockResolvedValue(mockPost);
    (prisma.post.delete as Mock).mockResolvedValue(mockPost);

    request = new NextRequest(`http://localhost/api/posts/${testPostId}`);
    context = createMockContext(testPostId);
  });

  // --- GET Tests ---
  describe("GET /api/posts/[postId]", () => {
    it("should return post details if found and user is logged in", async () => {
      const response = await GET(request, context);
      const body: PostData = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe(testPostId);
      expect(prisma.post.findUnique).toHaveBeenCalledTimes(1);
      expect(mockedTypes.getPostDataInclude).toHaveBeenCalledWith(
        loggedInUserId,
      );
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: testPostId },
        include: mockedTypes.getPostDataInclude(loggedInUserId),
      });
      expect(lucia.validateSession).toHaveBeenCalledWith("valid_session_id");
    });

    it("should return post details if found and user is logged out", async () => {
      mockCookiesGet(undefined);
      mockSessionValidation(null, null);
      (prisma.post.findUnique as Mock).mockResolvedValue(mockPost);

      const response = await GET(request, context);
      const body: PostData = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe(testPostId);
      expect(prisma.post.findUnique).toHaveBeenCalledTimes(1);
      expect(mockedTypes.getPostDataInclude).toHaveBeenCalledWith(undefined);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: testPostId },
        include: mockedTypes.getPostDataInclude(null),
      });
    });

    it("should return 404 if post is not found", async () => {
      (prisma.post.findUnique as Mock).mockResolvedValue(null);
      const response = await GET(request, context);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
      expect(prisma.post.findUnique).toHaveBeenCalledTimes(1);
    });

    it("should return 500 if database query fails", async () => {
      (prisma.post.findUnique as Mock).mockRejectedValue(new Error("DB Error"));
      const response = await GET(request, context);
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });

  // --- DELETE Tests ---
  describe("DELETE /api/posts/[postId]", () => {
    it("should return 401 if no session cookie", async () => {
      mockCookiesGet(undefined);
      mockSessionValidation(null, null);
      const response = await DELETE(request, context);
      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("should return 401 if session is invalid", async () => {
      mockCookiesGet("invalid_session_id"); // Update the .get() mock return value
      mockSessionValidation(null, null);
      (lucia.createBlankSessionCookie as Mock).mockReturnValue(mockBlankCookie);
      const response = await DELETE(request, context);
      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(lucia.validateSession).toHaveBeenCalledWith("invalid_session_id");
      expect(lucia.createBlankSessionCookie).toHaveBeenCalled();
      // Check if the mock .set() method was called correctly
      const cookiesMock = await cookies() as unknown as { get: Mock; set: Mock };
      expect(cookiesMock.set).toHaveBeenCalledWith(
        mockBlankCookie.name,
        mockBlankCookie.value,
        mockBlankCookie.attributes,
      );
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("should return 404 if post to delete is not found", async () => {
      (prisma.post.findUnique as Mock).mockResolvedValue(null);
      const response = await DELETE(request, context);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: testPostId },
      });
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not the author of the post", async () => {
      (prisma.post.findUnique as Mock).mockResolvedValue({
        ...mockPost,
        userId: authorUserId,
      });
      mockSessionValidation({ id: otherUserId }, mockSessionData);
      const response = await DELETE(request, context);
      const body = await response.json();
      expect(response.status).toBe(403);
      expect(body.error).toBe("Forbidden");
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: testPostId },
      });
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("should delete the post and return 204 if user is the author", async () => {
      (prisma.post.findUnique as Mock).mockResolvedValue({
        ...mockPost,
        userId: loggedInUserId,
      });
      mockSessionValidation({ id: loggedInUserId }, mockSessionData);
      const response = await DELETE(request, context);
      expect(response.status).toBe(204);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: testPostId },
      });
      expect(prisma.post.delete).toHaveBeenCalledTimes(1);
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: testPostId },
      });
    });

    it("should return 500 if findUnique fails during delete check", async () => {
      (prisma.post.findUnique as Mock).mockRejectedValue(
        new Error("DB Find Error"),
      );
      const response = await DELETE(request, context);
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("should return 500 if prisma delete fails", async () => {
      (prisma.post.findUnique as Mock).mockResolvedValue({
        ...mockPost,
        userId: loggedInUserId,
      });
      mockSessionValidation({ id: loggedInUserId }, mockSessionData);
      (prisma.post.delete as Mock).mockRejectedValue(
        new Error("DB Delete Error"),
      );
      const response = await DELETE(request, context);
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(prisma.post.delete).toHaveBeenCalledTimes(1);
    });
  });
});
