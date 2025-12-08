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
import { LikeInfo } from "@/lib/types";

// --- Define Mock Types ---
type PrismaPostMock = {
  findUnique: Mock;
};
type PrismaLikeMock = {
  upsert: Mock;
  deleteMany: Mock;
};
type PrismaDislikeMock = {
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

// --- Declare and Initialize Mock Variables TOP LEVEL ---
let mockCookiesGet: Mock = vi.fn();
let mockCookiesSet: Mock = vi.fn();
let mockPostFindUnique: Mock = vi.fn();
let mockLikeUpsert: Mock = vi.fn();
let mockLikeDeleteMany: Mock = vi.fn();
let mockDislikeDeleteMany: Mock = vi.fn();
let mockPrismaTransaction: Mock = vi.fn();
let mockValidateSession: Mock = vi.fn();
let mockCreateBlankSessionCookie: Mock = vi.fn();
let mockCreateSessionCookie: Mock = vi.fn();

// Define Top-Level Variables needed by mocks
const loggedInUserId = "user_liker_123";
const postAuthorId = "user_post_author";
const mockLoggedInUser = { id: loggedInUserId, username: "liker" };
const mockSessionData = { id: "session_like_test", fresh: false };

// --- Top-Level Mocks ---

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: mockCookiesGet,
    set: mockCookiesSet,
  })),
}));

// Mock @/lib/prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    post: { findUnique: mockPostFindUnique },
    like: { upsert: mockLikeUpsert, deleteMany: mockLikeDeleteMany },
    dislike: { deleteMany: mockDislikeDeleteMany },
    $transaction: mockPrismaTransaction,
  },
}));

// Mock @/auth
vi.mock("@/auth", () => ({
  lucia: {
    sessionCookieName: "auth_session",
    validateSession: mockValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

// --- Define top-level variables for route handlers ---
let GET: typeof import("@/app/api/posts/[postId]/likes/route").GET;
let POST: typeof import("@/app/api/posts/[postId]/likes/route").POST;
let DELETE: typeof import("@/app/api/posts/[postId]/likes/route").DELETE;

// --- Test Suite ---
describe("API Route: /api/posts/[postId]/likes", () => {
  const postId = "post_abc";
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

  // Import handlers ONCE using beforeAll AFTER mocks are defined
  beforeAll(async () => {
    ({ GET, POST, DELETE } = await import(
      "@/app/api/posts/[postId]/likes/route"
    ));
  });

  // Reset mocks and set default behaviors before each test
  beforeEach(() => {
    vi.resetAllMocks(); // Reset mocks to initial state

    // --- Set Default Mock Behaviors (Common) ---
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    // Assume post exists by default, return necessary fields
    mockPostFindUnique.mockResolvedValue({
      userId: postAuthorId, // For notification check in POST
      _count: { likes: 0 }, // For GET
      likes: [], // For GET
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);
    // Default transaction mock (can be overridden in specific tests)
    mockPrismaTransaction.mockImplementation(async (ops) => {
      const results = [];
      for (const op of ops) {
        results.push(await op); // Await each promise sequentially
      }
      return results;
    });
  });

  // --- GET Handler Tests ---
  describe("GET", () => {
    let request: NextRequest;

    beforeEach(() => {
      // Clear specific mocks if needed for GET tests (resetAllMocks does a lot)
      // mockPostFindUnique.mockClear(); // Optional: Already cleared by resetAllMocks
    });

    const createGetRequest = () =>
      new NextRequest(`http://localhost/api/posts/${postId}/likes`);

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
      // Ensure post find was still called
      expect(mockPostFindUnique).toHaveBeenCalled();
      // Check cookie calls
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
      expect(mockPostFindUnique).toHaveBeenCalledWith({
        where: { id: postId },
        select: expect.any(Object), // Keep this check
      });
    });

    it("should return like count and isLikedByUser: true if user has liked", async () => {
      // Arrange
      const mockPostData = {
        _count: { likes: 10 },
        likes: [{ userId: loggedInUserId }],
        userId: postAuthorId,
      };
      mockPostFindUnique.mockResolvedValue(mockPostData);
      request = createGetRequest();

      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body: LikeInfo = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.likes).toBe(10);
      expect(body.isLikedByUser).toBe(true);
      expect(mockPostFindUnique).toHaveBeenCalledWith({
        where: { id: postId },
        select: {
          _count: { select: { likes: true } },
          likes: {
            where: { userId: loggedInUserId },
            select: { userId: true },
          },
        },
      });
    });

    it("should return like count and isLikedByUser: false if user has not liked", async () => {
      // Arrange
      request = createGetRequest();

      // Act
      const response = await GET(request, { params: Promise.resolve({ postId }) });
      const body: LikeInfo = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.likes).toBe(0);
      expect(body.isLikedByUser).toBe(false);
      expect(mockPostFindUnique).toHaveBeenCalled();
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

    const createPostRequest = () =>
      new NextRequest(`http://localhost/api/posts/${postId}/likes`, {
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
      expect(mockPrismaTransaction).toHaveBeenCalled();
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should return 404 if post does not exist (checked before transaction)", async () => {
      // Arrange
      mockPostFindUnique.mockResolvedValue(null); // Simulate post not found before transaction
      request = createPostRequest();

      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body.error).toBe("Post not found");
      expect(mockPostFindUnique).toHaveBeenCalledWith({
        // Check the specific call
        where: { id: postId },
        select: { userId: true },
      });
      expect(mockPrismaTransaction).not.toHaveBeenCalled(); // Ensure transaction wasn't called
    });

    it("should like the post and remove dislike in a transaction", async () => {
      // Arrange
      mockLikeUpsert.mockResolvedValue({});
      mockDislikeDeleteMany.mockResolvedValue({ count: 1 });
      request = createPostRequest();

      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({ message: "Post liked" });
      expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
      expect(mockLikeUpsert).toHaveBeenCalledWith({
        where: { userId_postId: { userId: loggedInUserId, postId } },
        create: { userId: loggedInUserId, postId },
        update: {},
      });
      expect(mockDislikeDeleteMany).toHaveBeenCalledWith({
        where: { userId: loggedInUserId, postId },
      });
    });

    it("should return 500 if transaction fails", async () => {
      // Arrange
      // Initial post check succeeds (default mock)
      const txError = new Error("DB Transaction Error");
      mockPrismaTransaction.mockRejectedValue(txError); // Simulate generic transaction error
      request = createPostRequest();

      // Act
      const response = await POST(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500); // Expect 500 due to generic catch block
      expect(body.error).toBe("Internal server error");
      expect(mockPrismaTransaction).toHaveBeenCalled();
      // We could also check console.error was called if needed/possible
    });
  });

  // --- DELETE Handler Tests ---
  describe("DELETE", () => {
    let request: NextRequest;

    const createDeleteRequest = () =>
      new NextRequest(`http://localhost/api/posts/${postId}/likes`, {
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
      expect(mockLikeDeleteMany).not.toHaveBeenCalled();
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
      expect(mockLikeDeleteMany).toHaveBeenCalled();
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should delete the like successfully and return 200", async () => {
      // Arrange
      mockLikeDeleteMany.mockResolvedValue({ count: 1 });
      request = createDeleteRequest();

      // Act
      const response = await DELETE(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({ message: "Like removed" });
      expect(mockLikeDeleteMany).toHaveBeenCalledWith({
        where: { userId: loggedInUserId, postId },
      });
    });

    it("should return 200 even if like did not exist (idempotency)", async () => {
      // Arrange
      mockLikeDeleteMany.mockResolvedValue({ count: 0 });
      request = createDeleteRequest();

      // Act
      const response = await DELETE(request, { params: Promise.resolve({ postId }) });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({ message: "Like removed" });
      expect(mockLikeDeleteMany).toHaveBeenCalledWith({
        where: { userId: loggedInUserId, postId },
      });
    });

    it("should return 500 if prisma query fails", async () => {
      // Arrange
      mockLikeDeleteMany.mockRejectedValue(new Error("DB Error"));
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
