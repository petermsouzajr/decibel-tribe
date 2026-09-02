import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest } from "next/server";

// Import types, but not the actual implementations of mocked modules yet
import type { UserData, UserWithFollowerStatus } from "@/lib/types"; // Keep type imports
import type { GET as GETType } from "@/app/api/users/following/route";

// --- Mock Variables Declaration ---
// Declare variables to hold mock functions/objects
let mockCookiesGet: Mock;
let mockCookiesSet: Mock;
let mockLuciaValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockFollowFindMany: Mock;
let mockUserFindUnique: Mock;
let mockGetUserDataSelect: Mock;

// Helper function for creating mock requests remains useful
const createMockRequest = (
  cursor?: string,
  userParam?: string,
): NextRequest => {
  const url = new URL("http://localhost/api/users/following");
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  if (userParam) {
    url.searchParams.set("user", userParam);
  }
  return new NextRequest(url);
};

// --- Test Suite ---
describe("GET /api/users/following", () => {
  // Define test constants
  const loggedInUserId = "user-abc";
  const targetUsername = "targetuser";
  const targetUserId = "user-xyz";
  const mockSessionData = { id: "valid-session-id", fresh: false };
  const mockFreshSessionData = { ...mockSessionData, fresh: true };
  const mockNewSessionCookie = {
    name: "auth_session",
    value: "new-session-id",
    attributes: {},
  };
  const mockBlankCookie = {
    name: "auth_session",
    value: "",
    attributes: { expires: new Date(0) },
  };

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
    mockFollowFindMany = vi.fn();
    mockUserFindUnique = vi.fn();
    mockGetUserDataSelect = vi.fn(() => ({
      // Keep this as it's from a non-hoisting-problematic mock
      id: true,
      username: true,
      displayName: true,
      // Add other fields expected by getUserDataSelect if needed
      avatarUrl: true,
      followers: true,
      _count: { select: { followers: true } },
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
        follow: { findMany: mockFollowFindMany },
        user: { findUnique: mockUserFindUnique },
      },
    }));

    vi.doMock("@/auth", () => ({
      // Routes call this helper (src/auth.ts) instead of lucia directly.
      validateRequestWithCookieMutation: vi.fn(
        async () => (await mockLuciaValidateSession()) ?? { user: null, session: null },
      ),
      lucia: {
        sessionCookieName: "auth_session",
        validateSession: mockLuciaValidateSession,
        createBlankSessionCookie: mockCreateBlankSessionCookie,
        createSessionCookie: mockCreateSessionCookie,
      },
    }));

    // Mock @/lib/types using doMock as well for consistency, if needed
    // We still need the *real* function from the original module if it's complex,
    // otherwise, mock it fully here. Assuming we only mock getUserDataSelect:
    const originalTypes =
      await vi.importActual<typeof import("@/lib/types")>("@/lib/types");
    vi.doMock("@/lib/types", () => ({
      ...originalTypes, // Keep other exports real
      getUserDataSelect: mockGetUserDataSelect,
    }));

    // 4. Set default mock behaviors *after* mocks are applied
    mockCookiesGet.mockImplementation((name: string) =>
      name === "auth_session" ? { value: "valid_session_id" } : undefined,
    );
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId },
      session: mockSessionData,
    });
    mockFollowFindMany.mockResolvedValue([]); // Default to empty array

    // 5. Dynamically import the module under test *after* mocks are set up
    const mod = await import("@/app/api/users/following/route");
    GET = mod.GET;
  });

  // --- Auth Tests ---
  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet.mockImplementation(() => undefined); // No cookie
    const request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(mockFollowFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    const request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(mockFollowFindMany).not.toHaveBeenCalled();
    // Check that validateSession was called with the cookie value from mockCookiesGet
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
  });

  // --- Functionality Tests ---
  it("should return 404 if user query param is provided but user not found", async () => {
    mockUserFindUnique.mockResolvedValue(null); // User not found
    const request = createMockRequest(undefined, targetUsername);
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "User not found" });
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockFollowFindMany).not.toHaveBeenCalled();
  });

  it("should fetch users followed by logged-in user (no user param) without cursor", async () => {
    const mockUsersData: UserWithFollowerStatus[] = [
      // Use correct type
      {
        id: "user-1",
        username: "a",
        displayName: "A",
        avatarUrl: null,
        followers: [],
        _count: { followers: 0 },
      },
      {
        id: "user-2",
        username: "b",
        displayName: "B",
        avatarUrl: null,
        followers: [],
        _count: { followers: 0 },
      },
    ] as any; // Use 'as any' if full UserWithFollowerStatus is complex to mock
    const mockFollowingData = mockUsersData.map((user) => ({
      following: user,
    }));
    mockFollowFindMany.mockResolvedValue(mockFollowingData);
    const request = createMockRequest();

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockGetUserDataSelect).toHaveBeenCalledWith(loggedInUserId);
    const expectedSelect = mockGetUserDataSelect(loggedInUserId); // Get expected select object
    expect(mockFollowFindMany).toHaveBeenCalledWith({
      where: {
        followerId: loggedInUserId,
        following: {
          deletedAt: null,
        },
      },
      select: { following: { select: expectedSelect } }, // Use the select object
      take: 11,
      orderBy: { createdAt: "desc" },
    });
    expect(body.users).toHaveLength(2);
    expect(body.users[0].id).toBe("user-1");
    expect(body.nextCursor).toBeNull();
  });

  it("should fetch users followed by target user (with user param) with cursor", async () => {
    const pageSize = 10;
    const mockUsersData: UserWithFollowerStatus[] = Array.from(
      { length: pageSize + 1 },
      (_, i) => ({
        id: `following-${i}`,
        username: `user-${i}`,
        displayName: `User ${i}`,
        avatarUrl: null,
        followers: [],
        _count: { followers: 0 },
      }),
    ) as any; // Use 'as any' if full UserWithFollowerStatus is complex to mock
    const mockFollowingData = mockUsersData.map((user) => ({
      following: user,
    }));

    // Revert: Return the full 11 items so the route handler can calculate nextCursor
    mockFollowFindMany.mockResolvedValue(mockFollowingData);
    mockUserFindUnique.mockResolvedValue({ id: targetUserId });
    const cursor = "following-0"; // Correct cursor based on mock data ID
    const request = createMockRequest(cursor, targetUsername);

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockGetUserDataSelect).toHaveBeenCalledWith(loggedInUserId);
    const expectedSelect = mockGetUserDataSelect(loggedInUserId);
    expect(mockFollowFindMany).toHaveBeenCalledWith({
      where: {
        followerId: targetUserId,
        following: {
          deletedAt: null,
        },
      },
      select: { following: { select: expectedSelect } },
      take: pageSize + 1,
      cursor: {
        // Use compound cursor for Prisma
        followerId_followingId: {
          followerId: targetUserId,
          followingId: cursor,
        },
      },
      orderBy: { createdAt: "desc" },
      // Removed expectation of skip: 1
    });
    // The API route should slice the extra one off
    expect(body.users).toHaveLength(pageSize);
    expect(body.users[0].id).toBe("following-1"); // Starts from 1 after skipping cursor 0
    expect(body.nextCursor).toBe(`following-${pageSize}`); // ID of the last item fetched (which was sliced off)
  });

  it("should return 500 if prisma user find fails", async () => {
    mockUserFindUnique.mockRejectedValue(new Error("DB Error"));
    const request = createMockRequest(undefined, targetUsername);
    const response = await GET(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("should return 500 if prisma follow find fails", async () => {
    mockFollowFindMany.mockRejectedValue(new Error("DB Error"));
    const request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("should set cookies when session is fresh", async () => {
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId },
      session: mockFreshSessionData,
    });
    const request = createMockRequest();

    await GET(request);

    expect(mockCreateSessionCookie).toHaveBeenCalledWith(
      mockFreshSessionData.id,
    );
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockNewSessionCookie.name,
      mockNewSessionCookie.value,
      mockNewSessionCookie.attributes,
    );
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
  });

  it("should not set cookies when session is not fresh", async () => {
    // Default setup uses non-fresh session
    const request = createMockRequest();
    await GET(request);

    expect(mockCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockCookiesSet).not.toHaveBeenCalled();
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
  });

  // Add test for when user param is self - should use loggedInUserId
  it("should fetch users followed by logged-in user when user param is self", async () => {
    mockUserFindUnique.mockResolvedValue({ id: loggedInUserId }); // Mock findUnique for self
    const request = createMockRequest(undefined, "myOwnUsername"); // Use a placeholder username for self

    await GET(request);

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      // Check findUnique was called for the param
      where: { username: "myOwnUsername" },
      select: { id: true },
    });
    expect(mockFollowFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          followerId: loggedInUserId,
          following: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      }),
    );
  });
});
