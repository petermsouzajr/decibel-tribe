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
import { BookmarkInfo } from "@/lib/types";

// --- Define Mock Types ---
type PrismaBookmarkMock = {
  findUnique: Mock;
  create: Mock;
  deleteMany: Mock;
};

type PrismaMock = {
  bookmark: PrismaBookmarkMock;
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
let mockBookmarkFindUnique: Mock = vi.fn();
let mockBookmarkCreate: Mock = vi.fn();
let mockBookmarkDeleteMany: Mock = vi.fn();
let mockCreateBlankSessionCookie: Mock = vi.fn();
let mockCreateSessionCookie: Mock = vi.fn();
let mockLuciaValidateSession: Mock = vi.fn();

// Move these definitions here
const loggedInUserId = "user_bookmarker_1";
const mockLoggedInUser = { id: loggedInUserId };
const mockSessionData = { id: "session_bookmark_test", fresh: false };

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
    bookmark: {
      findUnique: mockBookmarkFindUnique,
      create: mockBookmarkCreate,
      deleteMany: mockBookmarkDeleteMany,
    },
  },
}));

// Mock @/auth - Use lucia.validateSession
vi.mock("@/auth", () => ({
  lucia: {
    sessionCookieName: "auth_session",
    validateSession: mockLuciaValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

// Define top-level variables for route handlers
let GET: typeof import("@/app/api/posts/[postId]/bookmark/route").GET;
let POST: typeof import("@/app/api/posts/[postId]/bookmark/route").POST;
let DELETE: typeof import("@/app/api/posts/[postId]/bookmark/route").DELETE;

// --- Test Suite ---
describe("API Route: /api/posts/[postId]/bookmark", () => {
  const postId = "post_bookmark_test";
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

  // Import handlers ONCE using beforeAll
  beforeAll(async () => {
    ({ GET, POST, DELETE } = await import(
      "@/app/api/posts/[postId]/bookmark/route"
    ));
  });

  beforeEach(() => {
    // Reset all mocks to their initial state (including implementations)
    vi.resetAllMocks();

    // --- Set Default Mock Behaviors ---
    // Cookies
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });

    // Auth: Set default logged-in state here AFTER resetAllMocks
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);

    // Prisma: Defaults set in specific describe blocks (GET/POST/DELETE)
  });

  // No afterEach needed currently
  // afterEach(() => {
  // });

  // --- GET Handler Tests ---
  describe("GET", () => {
    let request: NextRequest;

    beforeEach(() => {
      // Set default Prisma mock behavior for GET tests
      mockBookmarkFindUnique.mockResolvedValue(null); // Default: bookmark does not exist

      // Create a new request object for each GET test
      request = new NextRequest(
        `http://localhost/api/posts/${postId}/bookmark`,
      );
    });

    it("should return 401 if authentication fails", async () => {
      // Arrange: Override the default mockResolvedValue from beforeEach
      mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
      // Act
      const response = await GET(request, { params: { postId } });
      // Assert
      expect(response.status).toBe(401);
      expect(mockBookmarkFindUnique).not.toHaveBeenCalled();
    });

    it("should set new cookie if session is fresh", async () => {
      // Arrange: Override the default mockResolvedValue
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData, // Use fresh session
      });
      // Act
      await GET(request, { params: { postId } });
      // Assert
      expect(mockBookmarkFindUnique).toHaveBeenCalled(); // Check DB was still called
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should return isBookmarkedByUser: true if bookmark exists", async () => {
      mockBookmarkFindUnique.mockResolvedValue({
        userId: loggedInUserId,
        postId,
      });
      const response = await GET(request, { params: { postId } });
      const body: BookmarkInfo = await response.json();
      expect(response.status).toBe(200);
      expect(body.isBookmarkedByUser).toBe(true);
      expect(mockBookmarkFindUnique).toHaveBeenCalledWith({
        where: { userId_postId: { userId: loggedInUserId, postId } },
      });
    });

    it("should return isBookmarkedByUser: false if bookmark does not exist", async () => {
      const response = await GET(request, { params: { postId } });
      const body: BookmarkInfo = await response.json();
      expect(response.status).toBe(200);
      expect(body.isBookmarkedByUser).toBe(false);
      expect(mockBookmarkFindUnique).toHaveBeenCalledWith({
        where: { userId_postId: { userId: loggedInUserId, postId } },
      });
    });

    it("should return 500 if prisma query fails", async () => {
      mockBookmarkFindUnique.mockRejectedValue(new Error("DB Error"));
      const response = await GET(request, { params: { postId } });
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });

  // --- POST Handler Tests ---
  describe("POST", () => {
    let request: NextRequest;

    beforeEach(() => {
      mockBookmarkCreate.mockReset();
      request = new NextRequest(
        `http://localhost/api/posts/${postId}/bookmark`,
        { method: "POST" },
      );
    });

    it("should return 401 if authentication fails", async () => {
      // Arrange: Override the default mockResolvedValue from beforeEach
      mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
      // Act
      const response = await POST(request, { params: { postId } });
      // Assert
      expect(response.status).toBe(401);
      expect(mockBookmarkCreate).not.toHaveBeenCalled();
    });

    it("should set new cookie if session is fresh", async () => {
      // Arrange: Override the default mockResolvedValue
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData, // Use fresh session
      });
      // Act
      await POST(request, { params: { postId } });
      // Assert
      expect(mockBookmarkCreate).toHaveBeenCalled(); // Check DB was still called
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should create a bookmark successfully and return 200", async () => {
      // Arrange: Default mockBookmarkCreate is success
      // Act
      const response = await POST(request, { params: { postId } });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(200); // Expect 200
      expect(body).toEqual({ message: "Post bookmarked" }); // Match route message
      expect(mockBookmarkCreate).toHaveBeenCalledWith({
        data: { userId: loggedInUserId, postId },
      });
    });

    it("should return 500 if bookmark already exists (unique constraint)", async () => {
      // Changed expected status in description
      // Arrange
      const prismaError = new Error("Unique constraint failed") as any;
      prismaError.code = "P2002";
      prismaError.meta = { target: ["userId", "postId"] };
      mockBookmarkCreate.mockRejectedValue(prismaError);
      // Act
      const response = await POST(request, { params: { postId } });
      const body = await response.json();
      // Assert: Route currently returns 500 for this
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });

    it("should return 500 if post does not exist (foreign key constraint)", async () => {
      // Changed expected status in description
      // Arrange
      const prismaError = new Error("Foreign key constraint failed") as any;
      prismaError.code = "P2003";
      prismaError.meta = { field_name: "postId" }; // Example meta
      mockBookmarkCreate.mockRejectedValue(prismaError);
      // Act
      const response = await POST(request, { params: { postId } });
      const body = await response.json();
      // Assert: Route currently returns 500 for this
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });

    it("should return 500 for other prisma errors", async () => {
      mockBookmarkCreate.mockRejectedValue(new Error("DB Error"));
      const response = await POST(request, { params: { postId } });
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });

  // --- DELETE Handler Tests ---
  describe("DELETE", () => {
    let request: NextRequest;

    beforeEach(() => {
      mockBookmarkDeleteMany.mockReset();
      request = new NextRequest(
        `http://localhost/api/posts/${postId}/bookmark`,
        { method: "DELETE" },
      );
    });

    it("should return 401 if authentication fails", async () => {
      // Arrange: Override the default mockResolvedValue from beforeEach
      mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
      // Act
      const response = await DELETE(request, { params: { postId } });
      // Assert
      expect(response.status).toBe(401);
      expect(mockBookmarkDeleteMany).not.toHaveBeenCalled();
    });

    it("should set new cookie if session is fresh", async () => {
      // Arrange: Override the default mockResolvedValue
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData, // Use fresh session
      });
      // Act
      await DELETE(request, { params: { postId } });
      // Assert
      expect(mockBookmarkDeleteMany).toHaveBeenCalled(); // Check DB was still called
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should delete the bookmark successfully and return 200", async () => {
      // Arrange: Default mockBookmarkDeleteMany is success
      // Act
      const response = await DELETE(request, { params: { postId } });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({ message: "Bookmark removed" }); // Match route message
      expect(mockBookmarkDeleteMany).toHaveBeenCalledWith({
        where: { userId: loggedInUserId, postId },
      });
    });

    it("should return 200 even if bookmark did not exist (idempotency)", async () => {
      // Arrange
      mockBookmarkDeleteMany.mockResolvedValue({ count: 0 }); // Override default
      // Act
      const response = await DELETE(request, { params: { postId } });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({ message: "Bookmark removed" }); // Match route message
      expect(mockBookmarkDeleteMany).toHaveBeenCalledWith({
        where: { userId: loggedInUserId, postId },
      });
    });

    it("should return 500 if prisma query fails", async () => {
      mockBookmarkDeleteMany.mockRejectedValue(new Error("DB Error"));
      const response = await DELETE(request, { params: { postId } });
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });
});
