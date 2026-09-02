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
// We don't need UserData import if not used directly in assertions
// import { UserData } from "@/lib/types";

// --- Mock Types ---
type PrismaUserMock = {
  findUnique: Mock;
};
type PrismaMock = {
  user: PrismaUserMock;
};

type LuciaMock = {
  sessionCookieName: string;
  validateSession: Mock;
  createBlankSessionCookie: Mock;
  createSessionCookie: Mock;
};

type LibTypesMock = {
  getUserDataSelect: Mock;
};

// --- Declare and Initialize Mock Variables TOP LEVEL ---
let mockCookiesGet: Mock = vi.fn();
let mockCookiesSet: Mock = vi.fn();
let mockUserFindUnique: Mock = vi.fn();
let mockGetUserDataSelect: Mock = vi.fn((_userId: string | null) => ({
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  followers: _userId ? { where: { followerId: _userId } } : false,
  _count: { select: { followers: true, following: true } },
}));
let mockLuciaValidateSession: Mock = vi.fn();
let mockCreateBlankSessionCookie: Mock = vi.fn(); // Implementation set in beforeEach based on constant
let mockCreateSessionCookie: Mock = vi.fn(); // Implementation set in beforeEach based on constant

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
    user: {
      findUnique: mockUserFindUnique,
    },
  },
}));

// Mock @/lib/types
vi.mock("@/lib/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/types")>();
  return {
    ...actual,
    getUserDataSelect: mockGetUserDataSelect,
  };
});

// Mock @/auth
vi.mock("@/auth", () => ({
  // Routes call this helper (src/auth.ts) instead of lucia directly;
  // delegate to the validateSession mock this file already configures.
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

// Define a top-level variable for the GET handler
let GET: typeof import("@/app/api/users/username/[username]/route").GET;

describe("API Route: /api/users/username/[username]", () => {
  const targetUsername = "testuser";
  const targetUserId = "user_abc";
  const loggedInUserId = "viewer_123";
  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "session_def", fresh: false };
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
  const mockTargetUserData = {
    id: targetUserId,
    username: targetUsername,
    displayName: "Test User",
    avatarUrl: null,
    bio: "A bio",
    _count: { followers: 10, following: 5 },
  };

  let request: NextRequest;

  beforeEach(() => {
    // Reset mocks state ONLY
    vi.resetAllMocks();

    // --- Set Default Mock Behaviors for this test run ---
    // Need to set return values for mocks returning objects/constants
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);
    // Default runtime behavior
    mockCookiesGet.mockReturnValue(undefined); // Default to unauthenticated
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    mockUserFindUnique.mockResolvedValue(mockTargetUserData);
    // Reset the implementation of getUserDataSelect if needed (though factory might handle it)
    // Re-setting it here ensures it uses the definition relevant to the tests
    mockGetUserDataSelect.mockImplementation((_userId: string | null) => ({
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      followers: _userId ? { where: { followerId: _userId } } : false,
      _count: { select: { followers: true, following: true } },
    }));

    // Generic request setup
    request = new NextRequest(
      `http://localhost/api/users/username/${targetUsername}`,
    );
  });

  // Import the handler ONCE using beforeAll
  beforeAll(async () => {
    GET = (await import("@/app/api/users/username/[username]/route")).GET;
  });

  afterEach(() => {
    // vi.clearAllMocks(); // Not needed if using vi.resetAllMocks() in beforeEach
  });

  // --- Unauthenticated Access Tests ---
  describe("Unauthenticated Access", () => {
    it("should fetch public user data successfully if no session cookie exists", async () => {
      // Arrange
      // REMOVED: const { GET } = await import("@/app/api/users/username/[username]/route");
      // Default beforeEach sets up unauthenticated state

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ username: targetUsername  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual(mockTargetUserData);
      expect(mockLuciaValidateSession).not.toHaveBeenCalled();
      expect(mockGetUserDataSelect).toHaveBeenCalledWith(null);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { username: targetUsername },
        select: mockGetUserDataSelect(null), // Use mock fn directly
      });
      expect(mockCookiesSet).not.toHaveBeenCalled();
    });

    it("should fetch public user data successfully if session validation fails", async () => {
      // Arrange
      // REMOVED: const { GET } = await import("@/app/api/users/username/[username]/route");
      mockCookiesGet.mockReturnValue({ value: "invalid_session_id" });
      // Validation already mocked to fail in beforeEach

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ username: targetUsername  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual(mockTargetUserData);
      expect(mockLuciaValidateSession).toHaveBeenCalledWith(
        "invalid_session_id",
      );
      expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockBlankCookie.name,
        mockBlankCookie.value,
        mockBlankCookie.attributes,
      );
      expect(mockGetUserDataSelect).toHaveBeenCalledWith(null);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { username: targetUsername },
        select: mockGetUserDataSelect(null), // Use mock fn directly
      });
    });

    it("should return 404 if user not found (unauthenticated)", async () => {
      // Arrange
      // REMOVED: const { GET } = await import("@/app/api/users/username/[username]/route");
      mockUserFindUnique.mockResolvedValue(null);

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ username: targetUsername  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body.error).toBe("User not found");
      expect(mockGetUserDataSelect).toHaveBeenCalledWith(null);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { username: targetUsername },
        select: mockGetUserDataSelect(null), // Use mock fn directly
      });
    });
  });

  // --- Authenticated Access Tests ---
  describe("Authenticated Access", () => {
    beforeEach(() => {
      // Set up authenticated state for this describe block
      mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockSessionData,
      });
    });

    it("should fetch user data with logged-in context successfully (non-fresh session)", async () => {
      // Arrange
      // REMOVED: const { GET } = await import("@/app/api/users/username/[username]/route");
      // User data mock already set in top beforeEach

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ username: targetUsername  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual(mockTargetUserData);
      expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
      expect(mockCreateBlankSessionCookie).not.toHaveBeenCalled();
      expect(mockCreateSessionCookie).not.toHaveBeenCalled();
      expect(mockCookiesSet).not.toHaveBeenCalled();
      expect(mockGetUserDataSelect).toHaveBeenCalledWith(loggedInUserId);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { username: targetUsername },
        select: mockGetUserDataSelect(loggedInUserId), // Use mock fn directly
      });
    });

    it("should fetch user data and set new cookie if session is fresh", async () => {
      // Arrange
      // REMOVED: const { GET } = await import("@/app/api/users/username/[username]/route");
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData, // Fresh session
      });

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ username: targetUsername  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual(mockTargetUserData);
      expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
      expect(mockCreateBlankSessionCookie).not.toHaveBeenCalled();
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
      expect(mockGetUserDataSelect).toHaveBeenCalledWith(loggedInUserId);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { username: targetUsername },
        select: mockGetUserDataSelect(loggedInUserId), // Use mock fn directly
      });
    });

    it("should return 404 if user not found (authenticated)", async () => {
      // Arrange
      // REMOVED: const { GET } = await import("@/app/api/users/username/[username]/route");
      mockUserFindUnique.mockResolvedValue(null);

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ username: targetUsername  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body.error).toBe("User not found");
      expect(mockGetUserDataSelect).toHaveBeenCalledWith(loggedInUserId);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { username: targetUsername },
        select: mockGetUserDataSelect(loggedInUserId), // Use mock fn directly
      });
    });

    it("should return 500 if prisma query fails (authenticated)", async () => {
      // Arrange
      // REMOVED: const { GET } = await import("@/app/api/users/username/[username]/route");
      mockUserFindUnique.mockRejectedValue(new Error("DB Error"));

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ username: targetUsername  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });
});
