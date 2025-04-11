import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  Mock,
  afterEach,
  MockInstance,
} from "vitest";
import { NextRequest } from "next/server";
import { OAuth2RequestError } from "arctic"; // Keep needed classes

// --- Define Mock Types ---
type LuciaMock = {
  generateIdFromEntropySize?: Mock;
  createSession: Mock;
  createSessionCookie: Mock;
  sessionCookieName?: string;
  // Add other lucia properties if used directly ( unlikely here)
};

type GoogleAuthMock = {
  validateAuthorizationCode: Mock;
};

type AuthModuleMock = {
  google: GoogleAuthMock;
  lucia: LuciaMock; // Represent the lucia instance exported from @/auth
};

type KyMock = {
  get: Mock;
};

type PrismaUserMock = {
  findFirst: Mock;
  findUnique: Mock;
  update: Mock;
  create: Mock;
};

type PrismaMock = {
  user: PrismaUserMock;
  $transaction: Mock;
};

type StreamClientMock = {
  upsertUser: Mock;
};

type LibUtilsMock = {
  slugify: Mock;
  // Include other exports if needed
};

// --- Declare Mock Variables ---
let mockCookies: Mock;
let mockLucia: LuciaMock; // For the lucia library mock
let mockAuthModule: AuthModuleMock; // For the @/auth module mock
let mockKyInstance: KyMock;
let mockPrismaClient: PrismaMock;
let mockStreamClient: StreamClientMock;
let mockLibUtils: LibUtilsMock;

// Specific function mocks
let mockGenerateIdFromEntropySize: Mock;
let mockLuciaCreateSession: Mock;
let mockLuciaCreateSessionCookie: Mock;
let mockGoogleValidateAuthorizationCode: Mock;
let mockKyGet: Mock;
let mockKyGetJson: Mock;
let mockPrismaUserFindFirst: Mock;
let mockPrismaUserFindUnique: Mock;
let mockPrismaUserUpdate: Mock;
let mockPrismaUserCreate: Mock;
let mockPrismaTransaction: Mock;
let mockStreamUpsertUser: Mock;
let mockSlugify: Mock;
let mockCryptoRandomInt: Mock;
let mockCookiesGet: Mock;
let mockCookiesSet: Mock;

// --- Test Suite ---
describe("API Route: GET /api/auth/callback/google", () => {
  const testCode = "test_code";
  const testState = "test_state";
  const testCodeVerifier = "test_code_verifier";
  const testAccessToken = "test_access_token";
  const testSessionId = "test_session_id";
  const testSessionCookie = {
    name: "auth_session", // Name should likely come from mocked lucia
    value: "test-cookie-value",
    attributes: {},
  };
  const testUserId = "new_user_id";
  const existingUserId = "existing_user_id";
  const googleUser = {
    id: "google_id_123",
    name: "Test User",
    email: "test@example.com",
  };
  const baseUsername = "test-user";
  const uniqueUsername = baseUsername; // Default, can be changed in tests

  // Helper to create request URL (Re-added)
  const createUrl = (params: Record<string, string | null>) => {
    const url = new URL("http://localhost/api/auth/callback/google");
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  };

  // Use async beforeEach to apply mocks
  beforeEach(async () => {
    // Reset module cache to ensure fresh import with mocks
    vi.resetModules();

    // --- Define Mock Implementations ---
    mockGenerateIdFromEntropySize = vi.fn(() => testUserId);
    mockLuciaCreateSession = vi.fn(); // Define other mocks first
    mockLuciaCreateSessionCookie = vi.fn();
    mockGoogleValidateAuthorizationCode = vi.fn();
    mockKyGetJson = vi.fn();
    mockKyGet = vi.fn(() => ({ json: mockKyGetJson }));
    mockPrismaUserFindFirst = vi.fn();
    mockPrismaUserFindUnique = vi.fn();
    mockPrismaUserUpdate = vi.fn();
    mockPrismaUserCreate = vi.fn();
    mockPrismaTransaction = vi.fn(
      async (callback: (prisma: typeof mockPrismaClient) => Promise<any>) =>
        await callback(mockPrismaClient),
    );
    mockStreamUpsertUser = vi.fn();
    mockSlugify = vi.fn(
      (name: string) =>
        name
          ?.toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") || "",
    );
    mockCookiesGet = vi.fn();
    mockCookiesSet = vi.fn();
    mockCryptoRandomInt = vi.fn(); // Define crypto mock *before* it's used in doMock

    // Clear spy history but don't recreate
    // cryptoRandomIntSpy?.mockClear();
    // Reset the implementation if it might change between tests (unlikely here)
    // cryptoRandomIntSpy?.mockImplementation(mockCryptoRandomInt);

    // --- Apply Mocks using vi.doMock ---
    mockCookies = vi.fn(() => ({
      get: mockCookiesGet,
      set: mockCookiesSet,
    }));
    vi.doMock("next/headers", () => ({
      cookies: mockCookies,
    }));

    // Mock the crypto module
    const actualCrypto = await import("node:crypto");
    vi.doMock("node:crypto", () => ({
      ...actualCrypto, // Spread original exports
      randomInt: mockCryptoRandomInt, // Override randomInt
    }));

    // Mock the base lucia library primarily for generateId
    const actualLucia = await import("lucia");
    vi.doMock("lucia", () => ({
      ...actualLucia,
      generateIdFromEntropySize: mockGenerateIdFromEntropySize,
      // Note: We don't mock createSession/createSessionCookie here
      // because they are methods on the lucia *instance* from @/auth
    }));

    // Mock the @/auth module (contains google and lucia instances)
    mockAuthModule = {
      google: {
        validateAuthorizationCode: mockGoogleValidateAuthorizationCode,
      },
      lucia: {
        sessionCookieName: "auth_session", // Provide the cookie name
        createSession: mockLuciaCreateSession,
        createSessionCookie: mockLuciaCreateSessionCookie,
        // generateIdFromEntropySize is not needed on the instance mock
        // Add other lucia instance properties/methods if needed by the route
      } as LuciaMock,
    };
    vi.doMock("@/auth", () => mockAuthModule);

    // Mock Ky instance
    mockKyInstance = {
      get: mockKyGet,
    };
    vi.doMock("@/lib/ky", () => ({
      default: mockKyInstance,
    }));

    // Mock Prisma Client
    mockPrismaClient = {
      user: {
        findFirst: mockPrismaUserFindFirst,
        findUnique: mockPrismaUserFindUnique,
        update: mockPrismaUserUpdate,
        create: mockPrismaUserCreate,
      },
      $transaction: mockPrismaTransaction,
    };
    vi.doMock("@/lib/prisma", () => ({
      default: mockPrismaClient,
    }));

    // Mock Stream Client
    mockStreamClient = {
      upsertUser: mockStreamUpsertUser,
    };
    vi.doMock("@/lib/stream", () => ({
      default: mockStreamClient,
    }));

    // Mock @/lib/utils
    const actualLibUtils = await import("@/lib/utils");
    mockLibUtils = {
      ...actualLibUtils,
      slugify: mockSlugify,
    };
    vi.doMock("@/lib/utils", () => mockLibUtils);

    // --- Import Route Handler AFTER mocks are applied ---
    await import("@/app/api/auth/callback/google/route"); // Keep import here

    // --- Set Default Mock Behaviors ---
    mockCookiesGet.mockImplementation((name: string) => {
      if (name === "state") return { value: testState };
      if (name === "code_verifier") return { value: testCodeVerifier };
      return undefined;
    });
    mockGoogleValidateAuthorizationCode.mockResolvedValue({
      accessToken: testAccessToken,
    });
    mockKyGetJson.mockResolvedValue(googleUser);
    mockPrismaUserFindFirst.mockResolvedValue(null); // Default: New user
    mockPrismaUserFindUnique.mockResolvedValue(null); // Default: Username is unique
    mockLuciaCreateSession.mockResolvedValue({ id: testSessionId });
    mockLuciaCreateSessionCookie.mockReturnValue(testSessionCookie);
    mockCryptoRandomInt.mockReturnValue(1234);
    mockSlugify.mockReturnValue(baseUsername);
    mockPrismaUserCreate.mockResolvedValue({ id: testUserId }); // Ensure create returns an object with id
    mockPrismaUserUpdate.mockResolvedValue({});
    mockStreamUpsertUser.mockResolvedValue({});
  });

  // Update afterEach
  afterEach(() => {
    // Clear mocks instead of resetting
    vi.clearAllMocks();
    // No need to restore the spy here as it's defined once outside
    // cryptoRandomIntSpy?.mockRestore();
    // cryptoRandomIntSpy = undefined;
  });

  // --- Invalid Request Tests ---
  it.each([
    {
      params: { code: null, state: testState },
      cookies: { state: testState, code_verifier: testCodeVerifier },
      desc: "missing code",
    },
    {
      params: { code: testCode, state: null },
      cookies: { state: testState, code_verifier: testCodeVerifier },
      desc: "missing state",
    },
    {
      params: { code: testCode, state: testState },
      cookies: { state: null, code_verifier: testCodeVerifier },
      desc: "missing state cookie",
    },
    {
      params: { code: testCode, state: testState },
      cookies: { state: testState, code_verifier: null },
      desc: "missing code_verifier cookie",
    },
    {
      params: { code: testCode, state: "wrong_state" },
      cookies: { state: testState, code_verifier: testCodeVerifier },
      desc: "state mismatch",
    },
  ])(
    "should return 400 for $desc",
    async ({ params, cookies: cookieValues }) => {
      // Arrange
      const { GET } = await import("@/app/api/auth/callback/google/route");
      mockCookiesGet.mockImplementation((name: string) => {
        const value = cookieValues[name as keyof typeof cookieValues];
        return value !== null ? { value } : undefined;
      });
      const request = new NextRequest(createUrl(params));

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(400);
      expect(mockGoogleValidateAuthorizationCode).not.toHaveBeenCalled();
    },
  );

  // --- OAuth / Google API Error Tests ---
  it("should return 400 if validateAuthorizationCode throws OAuth2RequestError", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    const mockErrorRequest = new Request("http://localhost/mock-error-request");
    mockGoogleValidateAuthorizationCode.mockRejectedValue(
      new OAuth2RequestError(mockErrorRequest, { error: "invalid_grant" }),
    );
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(400);
    expect(mockKyGetJson).not.toHaveBeenCalled();
  });

  it("should return 500 if validateAuthorizationCode throws other error", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    mockGoogleValidateAuthorizationCode.mockRejectedValue(
      new Error("Other API error"),
    );
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(500);
    expect(mockKyGetJson).not.toHaveBeenCalled();
  });

  it("should return 500 if fetching Google user info fails", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    mockKyGetJson.mockRejectedValue(new Error("Failed to fetch user"));
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(500);
    expect(mockPrismaUserFindFirst).not.toHaveBeenCalled();
  });

  // --- User Handling Tests (New User) ---
  it("should create a new user if no existing user or Google account is found", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    mockPrismaUserFindFirst.mockResolvedValue(null); // No existing user by email/googleId
    mockPrismaUserFindUnique.mockResolvedValue(null); // Username is unique
    mockPrismaUserCreate.mockResolvedValue({ id: testUserId });
    mockStreamUpsertUser.mockResolvedValue({});
    mockPrismaTransaction.mockImplementation(
      async (callback: (prisma: typeof mockPrismaClient) => Promise<any>) => {
        await callback(mockPrismaClient);
      },
    );
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    const response = await GET(request);

    // Assert
    expect(mockPrismaUserFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ googleId: googleUser.id }, { email: googleUser.email }],
      },
      // We don't need select here if the actual call doesn't use it
      // select: { id: true },
    });
    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
    expect(mockPrismaUserCreate).toHaveBeenCalledWith({
      data: {
        id: testUserId,
        username: uniqueUsername,
        displayName: googleUser.name,
        googleId: googleUser.id,
        email: googleUser.email,
        isVerified: true,
      },
    });
    expect(mockStreamUpsertUser).toHaveBeenCalledWith({
      id: testUserId,
      username: uniqueUsername,
      name: uniqueUsername,
    });
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(testUserId, {});
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledWith(testSessionId);
    expect(mockCookiesSet).toHaveBeenCalledWith(
      testSessionCookie.name,
      testSessionCookie.value,
      testSessionCookie.attributes,
    );
    expect(response.status).toBe(302); // Success redirect
    expect(response.headers.get("Location")).toBe("/");
  });

  it("should generate a unique username if the initial slugified username exists", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    mockPrismaUserFindFirst.mockResolvedValue(null);
    // First check for slugified name fails, second succeeds
    mockPrismaUserFindUnique
      .mockResolvedValueOnce({ id: "existing_slug_user" }) // First call finds existing
      .mockResolvedValueOnce(null); // Second call with suffix finds unique
    // Rely on the beforeEach mock setup for crypto.randomInt
    const generatedUsername = `${baseUsername}1234`; // Use the specific expected value
    mockPrismaUserCreate.mockResolvedValue({ id: testUserId });
    mockPrismaTransaction.mockImplementation(
      async (callback: (prisma: typeof mockPrismaClient) => Promise<any>) => {
        await callback(mockPrismaClient);
      },
    );
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    await GET(request);

    // Assert
    expect(mockSlugify).toHaveBeenCalledWith(googleUser.name);
    expect(mockPrismaUserFindUnique).toHaveBeenCalledTimes(2);
    expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { username: baseUsername }, // First call
    });
    expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { username: expect.stringMatching(/^test-user\d+$/) }, // Second call - check pattern
    });
    expect(mockPrismaUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          username: expect.stringMatching(/^test-user\d+$/),
        }),
      }),
    );
    expect(mockStreamUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: expect.stringMatching(/^test-user\d+$/),
        name: expect.stringMatching(/^test-user\d+$/),
      }),
    );
  });

  // --- Valid Request Tests (Existing User) ---
  it("should link Google ID and create session for existing user found by email", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    const existingUser = {
      id: existingUserId,
      googleId: null,
      email: googleUser.email,
    };
    mockPrismaUserFindFirst.mockResolvedValue(existingUser);
    mockPrismaUserUpdate.mockResolvedValue({}); // Mock update success
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    const response = await GET(request);

    // Assert
    expect(mockPrismaUserFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ googleId: googleUser.id }, { email: googleUser.email }],
      },
      // We don't need select here if the actual call doesn't use it
      // select: { id: true },
    });
    expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
      where: { id: existingUserId },
      data: { googleId: googleUser.id },
    });
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(existingUserId, {});
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledWith(testSessionId);
    expect(mockCookiesSet).toHaveBeenCalledWith(
      testSessionCookie.name,
      testSessionCookie.value,
      testSessionCookie.attributes,
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  // --- Error Handling Tests ---
  it("should return 500 if prisma transaction fails during new user creation", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    mockPrismaUserFindFirst.mockResolvedValue(null); // New user flow
    mockPrismaTransaction.mockRejectedValue(new Error("Transaction failed"));
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(500);
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
  });

  it("should return 500 if prisma update fails for existing user", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    const existingUser = {
      id: existingUserId,
      googleId: null,
      email: googleUser.email,
    };
    mockPrismaUserFindFirst.mockResolvedValue(existingUser);
    mockPrismaUserUpdate.mockRejectedValue(new Error("Update failed"));
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(500);
    expect(mockLuciaCreateSession).not.toHaveBeenCalled(); // Should fail before session creation
  });

  it("should return 500 if Stream upsert fails", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    mockPrismaUserFindFirst.mockResolvedValue(null); // New user flow
    mockPrismaUserCreate.mockResolvedValue({ id: testUserId }); // DB create succeeds
    mockStreamUpsertUser.mockRejectedValue(new Error("Stream failed")); // Stream fails
    // Adjust transaction mock to simulate the sequence
    mockPrismaTransaction.mockImplementation(
      async (callback: (prisma: typeof mockPrismaClient) => Promise<any>) => {
        await callback(mockPrismaClient);
      },
    );
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    const response = await GET(request);

    // Assert
    // Depending on implementation, it might still create a session or fail entirely.
    // Assuming it fails the whole process if stream fails:
    expect(response.status).toBe(500);
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
  });

  it("should return 500 if session creation fails", async () => {
    // Arrange
    const { GET } = await import("@/app/api/auth/callback/google/route");
    const existingUser = {
      id: existingUserId,
      googleId: googleUser.id,
      email: googleUser.email,
    };
    mockPrismaUserFindFirst.mockResolvedValue(existingUser); // Existing user, already linked
    mockLuciaCreateSession.mockRejectedValue(
      new Error("Session creation failed"),
    );
    const request = new NextRequest(
      createUrl({ code: testCode, state: testState }),
    );

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(500);
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
  });
});
