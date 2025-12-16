import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  Mock,
  afterEach,
  beforeAll,
} from "vitest";
import { NextRequest } from "next/server";
import { CommentsPage, CommentData } from "@/lib/types";

// --- Define Mock Types ---
type PrismaCommentMock = {
  findMany: Mock;
  create: Mock;
};
type PrismaPostMock = {
  findUnique: Mock; // Assuming we might need this for POST checks later
};
type PrismaNotificationMock = {
  findFirst: Mock;
  create: Mock;
};
type PrismaMock = {
  comment: PrismaCommentMock;
  post: PrismaPostMock;
  notification: PrismaNotificationMock;
};

type LuciaMock = {
  sessionCookieName: string;
  validateSession: Mock;
  createBlankSessionCookie: Mock;
  createSessionCookie: Mock;
};

type LibTypesMock = {
  getCommentDataInclude: Mock;
};

// --- Declare Mock Variables ---
let mockCookies: Mock;
let mockPrismaClient: PrismaMock;
let mockAuthModule: { lucia: LuciaMock };
let mockLibTypes: LibTypesMock;

// Specific function mocks
let mockValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockCommentFindMany: Mock;
let mockCommentCreate: Mock;
let mockPostFindUnique: Mock;
let mockNotificationFindFirst: Mock;
let mockNotificationCreate: Mock;
let mockGetCommentDataInclude: Mock;
let mockCookiesGet: Mock;
let mockCookiesSet: Mock;

// Declare handler variables at the top level
let GET: typeof import("@/app/api/posts/[postId]/comments/route").GET;
let POST: typeof import("@/app/api/posts/[postId]/comments/route").POST;
// Assuming DELETE might exist or be added later
// let DELETE: typeof import("@/app/api/posts/[postId]/comments/route").DELETE;

// --- Test Suite ---
describe("API Route: /api/posts/[postId]/comments", () => {
  // --- Constants ---
  const postId = "post_for_comments";
  const loggedInUserId = "commenter_user_1";
  const postAuthorId = "post_author_user";
  const mockLoggedInUser = { id: loggedInUserId, username: "commenter" };
  const mockSessionData = { id: "session_comment_test", fresh: false };
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
  const mockCommentInclude = {
    user: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        email: true,
        passwordHash: true,
        bio: true,
        deletedAt: true,
        isDatingActive: true,
        userDatingProfile: true,
        userDatingPreferences: true,
        userPreferences: true,
        userInstruments: true,
        userSkills: true,
        _count: true,
      },
    },
    post: { select: { userId: true } },
    likes: { where: { userId: loggedInUserId } },
  } as any;
  // Define mockComments data here so it's accessible in beforeEach
  const mockComments: CommentData[] = Array.from({ length: 7 }, (_, i) => ({
    id: `comment_${i}`,
    content: `Comment content ${i}`,
    postId: postId,
    userId: `user_${i}`,
    createdAt: new Date(Date.now() - (7 - i) * 60000),
    deletedAt: null,
    parentId: null,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    updatedAt: new Date(Date.now() - (7 - i) * 60000),
    user: {
      id: `user_${i}`,
      username: `user${i}`,
      displayName: `User ${i}`,
      avatarUrl: null,
      email: `user${i}@test.com`,
      passwordHash: null,
      bio: null,
      deletedAt: null,
      createdAt: new Date(),
      userInstruments: [],
      userSkills: [],
      userPreferences: null,
      isDatingActive: false,
      userDatingProfile: null as any,
      userDatingPreferences: null,
      _count: { followers: 0, following: 0, posts: 0 },
    },
    parent: null,
    replies: [],
    likes: [],
    _count: { replies: 0, likes: 0 },
  }));

  // --- Implement async beforeAll for Mock Setup ---
  beforeAll(async () => {
    // Initialize mocks inside beforeAll
    mockValidateSession = vi.fn();
    mockCreateBlankSessionCookie = vi.fn();
    mockCreateSessionCookie = vi.fn();
    mockCommentFindMany = vi.fn();
    mockCommentCreate = vi.fn();
    mockPostFindUnique = vi.fn();
    mockNotificationFindFirst = vi.fn();
    mockNotificationCreate = vi.fn();
    mockGetCommentDataInclude = vi.fn();
    mockCookiesGet = vi.fn();
    mockCookiesSet = vi.fn();

    // Use vi.doMock for all mocks
    vi.doMock("next/headers", () => ({
      cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
    }));

    vi.doMock("@/lib/prisma", () => ({
      default: {
        comment: {
          findMany: mockCommentFindMany,
          create: mockCommentCreate,
        },
        post: {
          findUnique: mockPostFindUnique,
        },
        notification: {
          findFirst: mockNotificationFindFirst,
          create: mockNotificationCreate,
        },
      },
    }));

    vi.doMock("@/auth", () => ({
      lucia: {
        sessionCookieName: "auth_session",
        validateSession: mockValidateSession,
        createBlankSessionCookie: mockCreateBlankSessionCookie,
        createSessionCookie: mockCreateSessionCookie,
      },
    }));

    // Mock @/lib/types
    const actualLibTypes = await import("@/lib/types");
    vi.doMock("@/lib/types", () => ({
      ...actualLibTypes,
      getCommentDataInclude: mockGetCommentDataInclude,
    }));

    // Dynamically import handlers at the END of beforeAll
    const handlers = await import("@/app/api/posts/[postId]/comments/route");
    GET = handlers.GET;
    POST = handlers.POST;
    // DELETE = handlers.DELETE; // Uncomment if DELETE exists
  }, 10000);

  // --- Simplify beforeEach --- (Only reset and set behaviors)
  beforeEach(() => {
    vi.resetAllMocks();

    // Set Default Mock Behaviors
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);
    mockGetCommentDataInclude.mockReturnValue(mockCommentInclude);
    // Assume post exists and find post author ID for notifications
    mockPostFindUnique.mockResolvedValue({ userId: postAuthorId });
    mockNotificationFindFirst.mockResolvedValue(null); // No existing notification by default
    // Default findMany behavior (can be overridden in tests)
    mockCommentFindMany.mockResolvedValue(mockComments.slice(-5));
  });

  // Keep afterEach
  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- GET Handler Tests ---
  describe("GET", () => {
    let request: NextRequest;

    const createGetRequest = (cursor?: string): NextRequest => {
      const url = new URL(`http://localhost/api/posts/${postId}/comments`);
      if (cursor) url.searchParams.set("cursor", cursor);
      return new NextRequest(url);
    };

    it("should handle unauthenticated request correctly", async () => {
      // Arrange
      mockCookiesGet.mockReturnValue(undefined);
      mockValidateSession.mockResolvedValue({ user: null, session: null });
      request = createGetRequest();

      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body: CommentsPage = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.comments).toHaveLength(5);
      expect(mockValidateSession).not.toHaveBeenCalled();
      expect(mockGetCommentDataInclude).toHaveBeenCalledWith(undefined);
      expect(mockCommentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: mockCommentInclude,
          take: -6,
        }),
      );
    });

    it("should handle authenticated request correctly (non-fresh session)", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockSessionData,
      }); // Valid, non-fresh
      mockCommentFindMany.mockResolvedValue(mockComments.slice(-5));
      request = createGetRequest();

      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body: CommentsPage = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.comments).toHaveLength(5);
      expect(mockValidateSession).toHaveBeenCalledWith("valid_session_id");
      expect(mockGetCommentDataInclude).toHaveBeenCalledWith(loggedInUserId);
      expect(mockCommentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: mockCommentInclude,
        }),
      );
      expect(mockCookiesSet).not.toHaveBeenCalled(); // Non-fresh session, no set
    });

    it("should handle authenticated request and set cookie (fresh session)", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData,
      }); // Fresh session
      mockCommentFindMany.mockResolvedValue(mockComments.slice(-5));
      request = createGetRequest();

      // Act
      await GET(request, { params: Promise.resolve({ postId }) });

      // Assert
      expect(mockValidateSession).toHaveBeenCalledWith("valid_session_id");
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
      expect(mockGetCommentDataInclude).toHaveBeenCalledWith(loggedInUserId);
    });

    it("should fetch initial page of comments correctly (reverse infinite scroll)", async () => {
      // Arrange
      const pageSize = 5;
      mockCommentFindMany.mockResolvedValue(
        mockComments.slice(0, pageSize + 1),
      ); // 6 oldest items
      request = createGetRequest();

      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body: CommentsPage = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.comments).toHaveLength(pageSize);
      expect(body.comments[0].id).toBe("comment_1"); // Excludes the 0th item
      expect(body.previousCursor).toBe("comment_0"); // Cursor is 0th item ID
      expect(mockCommentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: -(pageSize + 1),
          cursor: undefined,
        }),
      );
    });

    it("should fetch previous page of comments using cursor (reverse infinite scroll)", async () => {
      // Arrange
      const pageSize = 5;
      const cursor = "comment_0"; // Oldest item from previous fetch
      const previousPageData = [mockComments[0]]; // Only 1 older item left
      mockCommentFindMany.mockResolvedValue(previousPageData);
      request = createGetRequest(cursor);

      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body: CommentsPage = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.comments).toHaveLength(1); // Returns the single older item
      expect(body.comments[0].id).toBe("comment_0");
      expect(body.previousCursor).toBeNull(); // No more older comments
      expect(mockCommentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: -(pageSize + 1),
          skip: 1,
          cursor: { id: cursor },
        }),
      );
    });

    it("should return 500 if prisma query fails", async () => {
      // Arrange
      mockCommentFindMany.mockRejectedValue(new Error("DB Error"));
      request = createGetRequest();

      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });

  // --- POST Handler Tests ---
  describe("POST", () => {
    let request: NextRequest;
    const commentContent = "This is a test comment.";

    beforeEach(() => {
      mockCommentCreate.mockReset();
      mockPostFindUnique.mockClear();
      mockNotificationFindFirst.mockClear();
      mockNotificationCreate.mockClear();
    });

    const createPostRequest = (body: any) => {
      const url = `http://localhost/api/posts/${postId}/comments`;
      return new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
    };

    it("should return 401 if authentication fails", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({ user: null, session: null });
      request = createPostRequest({ content: commentContent });
      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      // Assert
      expect(response.status).toBe(401);
      expect(mockCommentCreate).not.toHaveBeenCalled();
    });

    it("should return 400 if content is missing or empty", async () => {
      // Arrange
      request = createPostRequest({ content: "" });
      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(400);
      expect(body.error).toBe("Content is required");
      expect(mockCommentCreate).not.toHaveBeenCalled();
    });

    it("should create comment and notification successfully", async () => {
      // Arrange
      const createdComment = {
        ...mockComments[0],
        id: "new_comment_id",
        content: commentContent,
        userId: loggedInUserId,
        // Ensure dates match the expected type (Date object initially)
        createdAt: new Date(mockComments[0].createdAt),
        user: {
          ...mockComments[0].user,
          createdAt: new Date(mockComments[0].user.createdAt),
        },
      };
      mockCommentCreate.mockResolvedValue(createdComment);
      mockNotificationCreate.mockResolvedValue({});
      request = createPostRequest({ content: commentContent });

      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Convert expected dates to ISO strings to match JSON response
      const expectedCommentForAssertion = {
        ...createdComment,
        createdAt: createdComment.createdAt.toISOString(),
        user: {
          ...createdComment.user,
          createdAt: createdComment.user.createdAt.toISOString(),
        },
      };

      // Assert
      expect(response.status).toBe(201);
      // Use toEqual now that dates are strings in the expected object
      expect(body).toEqual(expectedCommentForAssertion);
      expect(mockCommentCreate).toHaveBeenCalledWith({
        data: {
          content: commentContent.trim(),
          postId,
          userId: loggedInUserId,
        },
        include: mockCommentInclude,
      });
      expect(mockPostFindUnique).toHaveBeenCalledWith({
        where: { id: postId },
        select: { userId: true },
      });
      expect(mockNotificationFindFirst).toHaveBeenCalledWith({
        where: {
          type: "COMMENT",
          issuerId: loggedInUserId,
          postId: postId,
          recipientId: postAuthorId,
        },
      });
      expect(mockNotificationCreate).toHaveBeenCalledOnce();
      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: {
          type: "COMMENT",
          issuerId: loggedInUserId,
          recipientId: postAuthorId,
          postId: postId,
        },
      });
    });

    it("should not create notification if user comments on own post", async () => {
      // Arrange
      mockPostFindUnique.mockResolvedValue({ userId: loggedInUserId }); // Post is owned by user
      mockCommentCreate.mockResolvedValue({});
      request = createPostRequest({ content: commentContent });
      // Act
      await POST(request, { params: Promise.resolve({ postId }) });
      // Assert
      expect(mockPostFindUnique).toHaveBeenCalled();
      expect(mockNotificationCreate).not.toHaveBeenCalled();
    });

    it("should not create notification if it already exists", async () => {
      // Arrange
      mockNotificationFindFirst.mockResolvedValue({ id: "existing_notif" }); // Notification found
      mockCommentCreate.mockResolvedValue({});
      request = createPostRequest({ content: commentContent });
      // Act
      await POST(request, { params: Promise.resolve({ postId }) });
      // Assert
      expect(mockNotificationFindFirst).toHaveBeenCalled();
      expect(mockNotificationCreate).not.toHaveBeenCalled();
    });

    it("should return 500 if comment creation fails", async () => {
      // Arrange
      const dbError = new Error("DB Create Error");
      mockCommentCreate.mockRejectedValue(dbError);
      request = createPostRequest({ content: commentContent });

      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(mockNotificationCreate).not.toHaveBeenCalled();
    });

    it("should return 201 (but log error) if notification creation fails", async () => {
      // Arrange
      const notificationError = new Error("Notification DB Error");
      mockCommentCreate.mockResolvedValue(mockComments[0]);
      mockNotificationCreate.mockRejectedValue(notificationError);
      request = createPostRequest({ content: commentContent });
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(body.id).toBe(mockComments[0].id);
      expect(mockNotificationCreate).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
