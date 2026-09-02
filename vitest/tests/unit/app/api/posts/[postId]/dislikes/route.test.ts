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
import { DislikeInfo } from "@/lib/types";

// --- Define Mock Types ---
type PrismaPostMock = {
  findUnique: Mock;
};
type PrismaLikeMock = {
  deleteMany: Mock;
};
type PrismaDislikeMock = {
  upsert: Mock;
  deleteMany: Mock;
};
type PrismaMock = {
  post: PrismaPostMock;
  like: PrismaLikeMock;
  dislike: PrismaDislikeMock;
  $transaction: Mock;
};

type LuciaMock = {
  sessionCookieName: string;
  validateSession: Mock;
  createBlankSessionCookie: Mock;
  createSessionCookie: Mock;
};

// --- Declare Mock Variables ---
let mockCookies: Mock;
let mockPrismaClient: PrismaMock;
let mockAuthModule: { lucia: LuciaMock };

// Specific function mocks
let mockValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockPostFindUnique: Mock;
let mockDislikeUpsert: Mock;
let mockDislikeDeleteMany: Mock;
let mockLikeDeleteMany: Mock;
let mockPrismaTransaction: Mock;
let mockCookiesGet: Mock;
let mockCookiesSet: Mock;

// Declare handler variables at the top level
let GET: typeof import("@/app/api/posts/[postId]/dislikes/route").GET;
let POST: typeof import("@/app/api/posts/[postId]/dislikes/route").POST;
let DELETE: typeof import("@/app/api/posts/[postId]/dislikes/route").DELETE;

// --- Test Suite ---
describe("API Route: /api/posts/[postId]/dislikes", () => {
  // --- Constants ---
  const postId = "post_xyz";
  const loggedInUserId = "user_disliker_456";
  const mockLoggedInUser = { id: loggedInUserId, username: "disliker" };
  const mockSessionData = { id: "session_dislike_test", fresh: false };
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

  // --- Implement async beforeAll for Mock Setup ---
  beforeAll(async () => {
    // Initialize mocks inside beforeAll
    mockValidateSession = vi.fn();
    mockCreateBlankSessionCookie = vi.fn();
    mockCreateSessionCookie = vi.fn();
    mockPostFindUnique = vi.fn();
    mockDislikeUpsert = vi.fn();
    mockDislikeDeleteMany = vi.fn();
    mockLikeDeleteMany = vi.fn();
    mockPrismaTransaction = vi.fn().mockImplementation(async (ops) => {
      const results = [];
      for (const op of ops) {
        results.push(await op);
      }
      return results;
    });
    mockCookiesGet = vi.fn();
    mockCookiesSet = vi.fn();

    // Use vi.doMock for all mocks
    vi.doMock("next/headers", () => ({
      cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
    }));

    vi.doMock("@/lib/prisma", () => ({
      default: {
        post: { findUnique: mockPostFindUnique },
        like: { deleteMany: mockLikeDeleteMany },
        dislike: {
          upsert: mockDislikeUpsert,
          deleteMany: mockDislikeDeleteMany,
        },
        $transaction: mockPrismaTransaction,
      },
    }));

    vi.doMock("@/auth", () => ({
      // Routes call this helper (src/auth.ts) instead of lucia directly.
      validateRequestWithCookieMutation: vi.fn(
        async () => (await mockValidateSession()) ?? { user: null, session: null },
      ),
      lucia: {
        sessionCookieName: "auth_session",
        validateSession: mockValidateSession,
        createBlankSessionCookie: mockCreateBlankSessionCookie,
        createSessionCookie: mockCreateSessionCookie,
      },
    }));

    // Dynamically import handlers at the END of beforeAll
    const handlers = await import("@/app/api/posts/[postId]/dislikes/route");
    GET = handlers.GET;
    POST = handlers.POST;
    DELETE = handlers.DELETE;
  }, 10000);

  // --- Simplify beforeEach --- (Only reset and set behaviors)
  beforeEach(() => {
    vi.resetAllMocks();

    // Set Default Mock Behaviors (using constants defined above)
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);
    mockPostFindUnique.mockResolvedValue({
      // Default assumption: post exists
      _count: { dislikes: 0 },
      dislikes: [],
    });
  });

  // Keep afterEach
  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- GET Handler Tests ---
  describe("GET", () => {
    let request: NextRequest;

    beforeEach(() => {
      mockPostFindUnique.mockClear();
    });

    const createGetRequest = () =>
      new NextRequest(`http://localhost/api/posts/${postId}/dislikes`);

    it("should return 401 if authentication fails", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({ user: null, session: null });
      request = createGetRequest();
      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      // Assert
      expect(response.status).toBe(401);
      expect(mockPostFindUnique).not.toHaveBeenCalled();
    });

    it("should set new cookie if session is fresh", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData,
      });
      request = createGetRequest();
      // Act
      await GET(request, { params: Promise.resolve({ postId }) });
      // Assert
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should return 404 if post not found", async () => {
      // Arrange
      mockPostFindUnique.mockResolvedValue(null);
      request = createGetRequest();
      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("should return dislike count and isDislikedByUser: true if user has disliked", async () => {
      // Arrange
      const mockPostData = {
        _count: { dislikes: 5 },
        dislikes: [{ userId: loggedInUserId }],
      };
      mockPostFindUnique.mockResolvedValue(mockPostData);
      request = createGetRequest();
      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body: DislikeInfo = await response.json();
      // Assert
      expect(response.status).toBe(200);
      expect(body.dislikes).toBe(5);
      expect(body.isDislikedByUser).toBe(true);
      expect(mockPostFindUnique).toHaveBeenCalledWith({
        where: { id: postId },
        select: {
          _count: { select: { dislikes: true } },
          dislikes: {
            where: { userId: loggedInUserId },
            select: { userId: true },
          },
        },
      });
    });

    it("should return dislike count and isDislikedByUser: false if user has not disliked", async () => {
      // Arrange
      const mockPostData = { _count: { dislikes: 2 }, dislikes: [] };
      mockPostFindUnique.mockResolvedValue(mockPostData);
      request = createGetRequest();
      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body: DislikeInfo = await response.json();
      // Assert
      expect(response.status).toBe(200);
      expect(body.dislikes).toBe(2);
      expect(body.isDislikedByUser).toBe(false);
    });

    it("should return 500 if prisma query fails", async () => {
      // Arrange
      mockPostFindUnique.mockRejectedValue(new Error("DB Error"));
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

    beforeEach(() => {
      mockPrismaTransaction.mockClear();
      mockDislikeUpsert.mockClear();
      mockLikeDeleteMany.mockClear();
    });

    const createPostRequest = () =>
      new NextRequest(`http://localhost/api/posts/${postId}/dislikes`, {
        method: "POST",
      });

    it("should return 401 if authentication fails", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({ user: null, session: null });
      request = createPostRequest();
      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      // Assert
      expect(response.status).toBe(401);
      expect(mockPrismaTransaction).not.toHaveBeenCalled();
    });

    it("should set new cookie if session is fresh", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData,
      });
      request = createPostRequest();
      // Act
      await POST(request, { params: Promise.resolve({ postId }) });
      // Assert
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should dislike the post and remove like in a transaction", async () => {
      // Arrange
      mockDislikeUpsert.mockResolvedValue({});
      mockLikeDeleteMany.mockResolvedValue({ count: 1 });
      mockPrismaTransaction.mockResolvedValue([{}, { count: 1 }]);
      request = createPostRequest();

      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({ message: "Post disliked" });
      expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
      // Check operations passed to transaction
      expect(mockDislikeUpsert).toHaveBeenCalledWith({
        where: { userId_postId: { userId: loggedInUserId, postId } },
        create: { userId: loggedInUserId, postId },
        update: {},
      });
      expect(mockLikeDeleteMany).toHaveBeenCalledWith({
        where: { userId: loggedInUserId, postId },
      });
    });

    it("should return 404 if post does not exist (on transaction fail)", async () => {
      // Arrange
      const error = new Error("Mock Prisma Error") as any;
      error.code = "P2025"; // Prisma code for record not found
      mockDislikeUpsert.mockRejectedValue(error);
      mockLikeDeleteMany.mockResolvedValue({});
      mockPrismaTransaction.mockImplementation(async (ops) => {
        await ops[1]; // like delete
        await ops[0]; // dislike upsert (throws)
      });
      request = createPostRequest();

      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
    });

    it("should return 500 if transaction fails for other reasons", async () => {
      // Arrange
      const error = new Error("Generic DB Error");
      mockPrismaTransaction.mockRejectedValue(error);
      request = createPostRequest();
      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });

  // --- DELETE Handler Tests ---
  describe("DELETE", () => {
    let request: NextRequest;

    beforeEach(() => {
      mockDislikeDeleteMany.mockClear();
    });

    const createDeleteRequest = () =>
      new NextRequest(`http://localhost/api/posts/${postId}/dislikes`, {
        method: "DELETE",
      });

    it("should return 401 if authentication fails", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({ user: null, session: null });
      request = createDeleteRequest();
      // Act
      const response = await DELETE(request, { params: Promise.resolve({ postId }) });
      // Assert
      expect(response.status).toBe(401);
      expect(mockDislikeDeleteMany).not.toHaveBeenCalled();
    });

    it("should set new cookie if session is fresh", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData,
      });
      request = createDeleteRequest();
      // Act
      await DELETE(request, { params: Promise.resolve({ postId }) });
      // Assert
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should delete the dislike successfully and return 200", async () => {
      // Arrange
      mockDislikeDeleteMany.mockResolvedValue({ count: 1 });
      request = createDeleteRequest();
      // Act
      const response = await DELETE(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({ message: "Dislike removed" });
      expect(mockDislikeDeleteMany).toHaveBeenCalledWith({
        where: { userId: loggedInUserId, postId },
      });
    });

    it("should return 200 even if dislike did not exist (idempotency)", async () => {
      // Arrange
      mockDislikeDeleteMany.mockResolvedValue({ count: 0 });
      request = createDeleteRequest();
      // Act
      const response = await DELETE(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({ message: "Dislike removed" });
    });

    it("should return 500 if prisma query fails", async () => {
      // Arrange
      mockDislikeDeleteMany.mockRejectedValue(new Error("DB Error"));
      request = createDeleteRequest();
      // Act
      const response = await DELETE(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });
});
