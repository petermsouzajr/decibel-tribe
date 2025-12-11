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
import { PostsPage, PostData } from "@/lib/types"; // Keep necessary types

// --- Mock Types ---
type PrismaPostMock = {
  findMany: Mock;
};
type PrismaMock = {
  post: PrismaPostMock;
};

type LuciaMock = {
  sessionCookieName: string;
  validateSession: Mock;
  createBlankSessionCookie: Mock;
  createSessionCookie: Mock;
};

type LibTypesMock = {
  getPostDataInclude: Mock;
};

// --- Declare and Initialize Mock Variables TOP LEVEL ---
let mockCookiesGet: Mock = vi.fn();
let mockCookiesSet: Mock = vi.fn();
let mockPostFindMany: Mock = vi.fn();
let mockGetPostDataInclude: Mock = vi.fn(() => ({ user: true, _count: true }));
let mockValidateRequest: Mock = vi.fn();

// --- Top-Level Mocks (Using top-level vars) ---

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
    post: {
      findMany: mockPostFindMany,
    },
  },
}));

// Mock @/lib/types
vi.mock("@/lib/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/types")>();
  return {
    ...actual,
    getPostDataInclude: mockGetPostDataInclude,
  };
});

// Mock @/auth - Provide ONLY validateRequest
vi.mock("@/auth", () => ({
  validateRequest: mockValidateRequest,
}));

// Define a top-level variable for the GET handler
let GET: typeof import("@/app/api/users/[userId]/posts/route").GET;

// --- Test Suite ---
describe("GET /api/users/{userId}/posts", () => {
  let request: NextRequest;
  const loggedInUserId = "user-123";
  const targetUserId = "user-xyz"; // The user whose posts we are fetching
  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "valid-session-id", fresh: false };
  const mockFreshSessionData = { ...mockSessionData, fresh: true };

  beforeEach(() => {
    // Reset mocks state ONLY
    vi.resetAllMocks();

    // --- Set Default Mock Behaviors for this test run ---
    mockValidateRequest.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockGetPostDataInclude.mockImplementation(() => ({
      user: true,
      _count: true,
    }));

    // --- Helper to create request (Keep as is or simplify if request is constant) ---
    const createMockRequest = (cursor?: string): NextRequest => {
      const url = new URL(`http://localhost/api/users/${targetUserId}/posts`);
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }
      return new NextRequest(url);
    };
    // request = createMockRequest(); // Or create in each test
  });

  // Import the handler ONCE using beforeAll
  beforeAll(async () => {
    GET = (await import("@/app/api/users/[userId]/posts/route")).GET;
  });

  afterEach(() => {
    // vi.clearAllMocks(); // Not needed if using vi.resetAllMocks() in beforeEach
  });

  // --- Auth Tests ---
  it("should return 401 if session validation fails", async () => {
    // Arrange
    mockValidateRequest.mockResolvedValue({ user: null, session: null });
    const request = new NextRequest(
      `http://localhost/api/users/${targetUserId}/posts`,
    );

    // Act
    const response = await GET(request, { params: Promise.resolve({ userId: targetUserId }) });

    // Assert
    expect(response.status).toBe(401);
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("should handle fresh session correctly (if applicable)", async () => {
    // Arrange
    mockValidateRequest.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockFreshSessionData,
    });
    mockPostFindMany.mockResolvedValue([]);
    const request = new NextRequest(
      `http://localhost/api/users/${targetUserId}/posts`,
    );

    // Act
    await GET(request, { params: Promise.resolve({ userId: targetUserId }) });

    // Assert
    expect(mockPostFindMany).toHaveBeenCalled();
  });

  // --- Functionality Tests ---
  it("should fetch posts for the target user successfully without a cursor", async () => {
    // Arrange
    const mockPosts = [
      { id: "post-1", content: "Post 1", userId: targetUserId },
      { id: "post-2", content: "Post 2", userId: targetUserId },
    ] as PostData[];
    mockPostFindMany.mockResolvedValue(mockPosts);
    const request = new NextRequest(
      `http://localhost/api/users/${targetUserId}/posts`,
    );

    // Act
    const response = await GET(request, { params: Promise.resolve({ userId: targetUserId }) });
    const body: PostsPage = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockGetPostDataInclude).toHaveBeenCalledWith(loggedInUserId);
    expect(mockPostFindMany).toHaveBeenCalledWith({
      where: {
        userId: targetUserId,
        groupId: null,
        user: {
          deletedAt: null,
          blocksReceived: { none: { blockerId: loggedInUserId } },
        },
      },
      include: mockGetPostDataInclude(loggedInUserId), // Use mock fn directly
      orderBy: { createdAt: "desc" },
      take: 11, // pageSize + 1
      cursor: undefined,
    });
    expect(body.posts).toHaveLength(2);
    expect(body.posts[0].id).toBe("post-1");
    expect(body.nextCursor).toBeNull();
  });

  it("should fetch posts for the target user successfully with a cursor", async () => {
    // Arrange
    const pageSize = 10;
    const mockPosts = Array.from({ length: pageSize + 1 }, (_, i) => ({
      id: `post-${i + 1}`,
      content: `Post ${i + 1}`,
      userId: targetUserId,
    })) as PostData[];
    mockPostFindMany.mockResolvedValue(mockPosts);
    const cursor = "post-0";
    const request = new NextRequest(
      `http://localhost/api/users/${targetUserId}/posts?cursor=${cursor}`,
    );

    // Act
    const response = await GET(request, { params: Promise.resolve({ userId: targetUserId }) });
    const body: PostsPage = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockGetPostDataInclude).toHaveBeenCalledWith(loggedInUserId);
    expect(mockPostFindMany).toHaveBeenCalledWith({
      where: {
        userId: targetUserId,
        groupId: null,
        user: {
          deletedAt: null,
          blocksReceived: { none: { blockerId: loggedInUserId } },
        },
      },
      include: mockGetPostDataInclude(loggedInUserId), // Use mock fn directly
      orderBy: { createdAt: "desc" },
      take: 11, // Use pageSize + 1 directly if pageSize is constant
      cursor: { id: cursor },
    });
    expect(body.posts).toHaveLength(pageSize);
    expect(body.posts[0].id).toBe("post-1");
    expect(body.nextCursor).toBe(`post-${pageSize + 1}`); // Check if last post id is correctly used
  });

  it("should return 500 if prisma query fails", async () => {
    // Arrange
    mockPostFindMany.mockRejectedValue(new Error("DB Error"));
    const request = new NextRequest(
      `http://localhost/api/users/${targetUserId}/posts`,
    );

    // Act
    const response = await GET(request, { params: Promise.resolve({ userId: targetUserId }) });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });
});
