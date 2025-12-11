import { describe, it, expect, vi, beforeEach, Mock, afterEach } from "vitest";
import { NextRequest } from "next/server";
// Remove direct imports of mocked modules
// import { cookies } from "next/headers";
// import prisma from "@/lib/prisma";
// import { lucia } from "@/auth";
// import { getUserDataSelect } from "@/lib/types";
import { UserData } from "@/lib/types"; // Keep non-mocked types

// --- Define Mock Types ---
type PrismaMock = {
  follow: {
    findMany: Mock;
  };
  user: {
    findUnique: Mock;
  };
};

type LuciaMock = {
  sessionCookieName: string;
  validateSession: Mock;
  createBlankSessionCookie: Mock;
  createSessionCookie: Mock;
};

type LibTypesMock = {
  getUserDataSelect: Mock;
  // Include other exports if needed
};

// --- Declare Hoisted Mock Function Variables FIRST ---
const { mockCookiesGet, mockCookiesSet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockCookiesSet: vi.fn(),
}));
const { mockFollowFindMany, mockUserFindUnique } = vi.hoisted(() => ({
  mockFollowFindMany: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));
const { mockGetUserDataSelect } = vi.hoisted(() => ({
  mockGetUserDataSelect: vi.fn(),
}));
const {
  mockLuciaValidateSession,
  mockCreateBlankSessionCookie,
  mockCreateSessionCookie,
} = vi.hoisted(() => ({
  mockLuciaValidateSession: vi.fn(),
  mockCreateBlankSessionCookie: vi.fn(),
  mockCreateSessionCookie: vi.fn(),
}));
const luciaSessionCookieName = "auth_session";

// --- Top-Level Mocks using vi.mock ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    follow: { findMany: mockFollowFindMany },
    user: { findUnique: mockUserFindUnique },
  },
}));

vi.mock("@/auth", () => ({
  lucia: {
    sessionCookieName: "auth_session", // Hardcode string literal
    validateSession: mockLuciaValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

// Mock @/lib/types specifically for getUserDataSelect
// Import getUserDataSelect from the mocked module later if needed for assertions
vi.mock("@/lib/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/types")>();
  return {
    ...actual, // Keep original exports like UserData
    getUserDataSelect: mockGetUserDataSelect,
  };
});

// --- Import Route Handler AFTER Top-Level Mocks ---
import { GET } from "@/app/api/users/followed-by/route";

// --- Test Suite ---
describe("GET /api/users/followed-by", () => {
  // --- Constants ---
  const loggedInUserId = "user-abc";
  const mockLoggedInUser = { id: loggedInUserId, username: "loggedintestuser" };
  const mockSessionData = { id: "valid-session-id", fresh: false };
  const mockFreshSessionData = { ...mockSessionData, fresh: true };
  const targetUsername = "targetuser";
  const targetUserId = "user-xyz";
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
  const mockUserDataSelectObject = {
    // Define the select object structure
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    // Add other fields if they are part of the actual select object
    followers: { where: { followerId: loggedInUserId } }, // Simulating isFollowedByLoggedInUser check
  };
  const routePageSize = 10; // Use the actual page size from the route

  let request: NextRequest;

  // --- Simplify beforeEach --- (Reset mocks and set default behaviors)
  beforeEach(() => {
    vi.resetAllMocks();

    // Set Default Mock Behaviors using correct variable names
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);
    mockUserFindUnique.mockResolvedValue({ id: targetUserId }); // Default: target user exists
    mockFollowFindMany.mockResolvedValue([]); // Default: no followers found
    // Mock getUserDataSelect to return the defined structure
    mockGetUserDataSelect.mockReturnValue(mockUserDataSelectObject);
  });

  // Keep afterEach
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create request
  const createMockRequest = (
    cursor?: string,
    userParam?: string,
  ): NextRequest => {
    const url = new URL("http://localhost/api/users/followed-by");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }
    if (userParam) {
      url.searchParams.set("user", userParam);
    }
    return new NextRequest(url);
  };

  // --- Auth Tests ---
  it("should return 401 if no session cookie is found", async () => {
    // Arrange
    mockCookiesGet.mockReturnValue(undefined);
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null }); // Use correct mock name
    request = createMockRequest();

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(401);
    expect(mockLuciaValidateSession).not.toHaveBeenCalled(); // Use correct mock name
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockFollowFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    // Arrange
    mockCookiesGet.mockReturnValue({ value: "invalid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null }); // Use correct mock name
    request = createMockRequest();

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(401);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("invalid_session_id"); // Use correct mock name
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockBlankCookie.name,
      mockBlankCookie.value,
      mockBlankCookie.attributes,
    );
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockFollowFindMany).not.toHaveBeenCalled();
  });

  it("should set new cookie if session is fresh", async () => {
    // Arrange
    mockLuciaValidateSession.mockResolvedValue({
      // Use correct mock name
      user: mockLoggedInUser,
      session: mockFreshSessionData,
    });
    request = createMockRequest(); // No target user needed

    // Act
    await GET(request);

    // Assert
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid-session-id"); // Use correct mock name
    expect(mockCreateSessionCookie).toHaveBeenCalledWith(
      mockFreshSessionData.id,
    );
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockNewSessionCookie.name,
      mockNewSessionCookie.value,
      mockNewSessionCookie.attributes,
    );
    expect(mockFollowFindMany).toHaveBeenCalled(); // Check main logic ran
  });

  // --- Functionality Tests ---
  it("should return 404 if user query param is provided but user not found", async () => {
    // Arrange
    mockUserFindUnique.mockResolvedValue(null); // User not found
    request = createMockRequest(undefined, targetUsername);

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "User not found" });
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockFollowFindMany).not.toHaveBeenCalled();
  });

  it("should fetch users following logged-in user (no user param) without cursor", async () => {
    // Arrange
    // Mock routePageSize + 1 items
    const mockFollowers = Array.from({ length: routePageSize + 1 }, (_, i) => ({
      followerId: `follower_${i}`,
      follower: { id: `follower_${i}`, username: `f${i}` },
    }));
    mockFollowFindMany.mockResolvedValue(mockFollowers);
    request = createMockRequest(); // No cursor, no user param

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.users).toHaveLength(routePageSize); // Check correct page size
    expect(body.nextCursor).toBe(mockFollowers[routePageSize].followerId); // Check correct next cursor ID
    expect(mockUserFindUnique).not.toHaveBeenCalled(); // No target user lookup
    expect(mockGetUserDataSelect).toHaveBeenCalledWith(loggedInUserId);
    expect(mockFollowFindMany).toHaveBeenCalledWith({
      where: {
        followingId: loggedInUserId,
        follower: {
          deletedAt: null,
        },
      },
      select: {
        followerId: true,
        follower: { select: mockUserDataSelectObject },
      },
      orderBy: { createdAt: "desc" }, // Correct default order
      take: routePageSize + 1, // Use route page size
      cursor: undefined, // No cursor
    });
  });

  it("should fetch users following target user (with user param) with cursor", async () => {
    // Arrange
    const cursor = "follower_cursor_id";
    // Mock routePageSize + 1 items, including the cursor item at the start
    const mockFollowersPage = Array.from(
      { length: routePageSize + 1 },
      (_, i) => ({
        followerId: i === 0 ? cursor : `follower_next_${i}`,
        follower: {
          id: i === 0 ? cursor : `follower_next_${i}`,
          username: `f_next${i}`,
        },
      }),
    );

    mockFollowFindMany.mockResolvedValue(mockFollowersPage); // Resolves with 11 items
    mockUserFindUnique.mockResolvedValue({ id: targetUserId }); // Ensure target user is found
    request = createMockRequest(cursor, targetUsername);

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    // Route slices the array after removing the cursor item, should have routePageSize length
    expect(body.users).toHaveLength(routePageSize);
    // Check the users returned are the ones *after* the cursor item
    expect(body.users[0].id).toBe("follower_next_1");
    expect(body.users[routePageSize - 1].id).toBe(
      `follower_next_${routePageSize}`,
    ); // Check last item
    // nextCursor is derived from the originally fetched list (index routePageSize relative to start of original list)
    expect(body.nextCursor).toBe(mockFollowersPage[routePageSize].followerId);
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockGetUserDataSelect).toHaveBeenCalledWith(loggedInUserId);
    // Prisma query assertion
    expect(mockFollowFindMany).toHaveBeenCalledWith({
      where: {
        followingId: targetUserId,
        follower: {
          deletedAt: null,
        },
      },
      select: {
        followerId: true, // Ensure followerId is selected
        follower: { select: mockUserDataSelectObject }, // Use the correct mocked select object
      },
      take: routePageSize + 1, // Use route page size
      cursor: {
        followerId_followingId: {
          followerId: cursor,
          followingId: targetUserId,
        },
      },
      orderBy: { createdAt: "desc" }, // Correct orderBy clause
    });
  });

  // --- Error Handling Tests ---
  it("should return 500 if prisma user find fails", async () => {
    // Arrange
    const dbError = new Error("DB User Error");
    mockUserFindUnique.mockRejectedValue(dbError);
    request = createMockRequest(undefined, targetUsername); // Need user param to trigger findUnique

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });

  it("should return 500 if prisma follow find fails", async () => {
    // Arrange
    const dbError = new Error("DB Follow Error");
    mockFollowFindMany.mockRejectedValue(dbError);
    request = createMockRequest(); // Trigger findMany without user param

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
