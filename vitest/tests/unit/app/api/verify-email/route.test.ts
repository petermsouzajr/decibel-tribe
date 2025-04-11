import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// --- Declare Hoisted Mock Function Variables FIRST ---
const { mockCookiesSet } = vi.hoisted(() => ({ mockCookiesSet: vi.fn() }));
const {
  mockEmailVerificationFindFirst,
  mockEmailVerificationDelete,
  mockUserUpdate,
} = vi.hoisted(() => ({
  mockEmailVerificationFindFirst: vi.fn(),
  mockEmailVerificationDelete: vi.fn(),
  mockUserUpdate: vi.fn(),
}));
const { mockLuciaCreateSession, mockLuciaCreateSessionCookie } = vi.hoisted(
  () => ({
    mockLuciaCreateSession: vi.fn(),
    mockLuciaCreateSessionCookie: vi.fn(),
  }),
);
const luciaSessionCookieName = "auth_session"; // Keep const for cookie name

// --- Top-Level Mocks using vi.mock ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: mockCookiesSet })), // Keep get simple
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    emailVerification: {
      findFirst: mockEmailVerificationFindFirst,
      delete: mockEmailVerificationDelete,
    },
    user: { update: mockUserUpdate },
  },
}));

vi.mock("@/auth", () => ({
  lucia: {
    sessionCookieName: "auth_session",
    createSession: mockLuciaCreateSession,
    createSessionCookie: mockLuciaCreateSessionCookie,
  },
}));

// --- Import Route Handler AFTER Top-Level Mocks ---
import { GET } from "@/app/api/verify-email/route";

// ---
describe("API Route: GET /api/verify-email", () => {
  const validToken = "valid-verification-token";
  const userId = "user-to-verify-123";
  const userEmail = "original@example.com";
  const pendingEmail = "new@example.com";
  const mockSessionId = "newly-created-session-id";
  const mockSessionCookie = {
    name: luciaSessionCookieName,
    value: "session-value",
    attributes: {},
  }; // Provide full cookie mock
  const baseUrl = "http://localhost";

  beforeEach(() => {
    // 1. Reset Mocks
    vi.resetAllMocks();

    // 2. Set Default Mock Behaviors for Success Path (Initial Verification)
    mockEmailVerificationFindFirst.mockResolvedValue({
      id: "verif-rec-id", // Need the ID for the delete call
      userId: userId,
      token: validToken,
      expiresAt: new Date(Date.now() + 3600000),
      // user: { id: userId, email: userEmail, pendingEmail: null } // Don't include user here
    });
    // Mock the first user update for the simple verification case
    mockUserUpdate.mockResolvedValue({
      id: userId,
      isVerified: true,
      email: userEmail,
      pendingEmail: null,
    });
    mockEmailVerificationDelete.mockResolvedValue({});
    mockLuciaCreateSession.mockResolvedValue({ id: mockSessionId });
    mockLuciaCreateSessionCookie.mockReturnValue(mockSessionCookie);
  });

  // Helper to create request
  const createMockRequest = (token?: string): NextRequest => {
    const url = new URL(`${baseUrl}/api/verify-email`);
    if (token) {
      url.searchParams.set("token", token);
    }
    return new NextRequest(url);
  };

  // --- Input Validation Tests ---
  it("should redirect to / if no token is provided", async () => {
    const request = createMockRequest();
    const response = await GET(request); // Use imported GET
    // Assert redirect response directly if NextResponse.redirect mock is removed
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(
      new URL("/", baseUrl).toString(),
    );
    expect(mockEmailVerificationFindFirst).not.toHaveBeenCalled();
  });

  it("should redirect to / if token is not found in DB", async () => {
    // Arrange
    mockEmailVerificationFindFirst.mockResolvedValue(null); // Override: Token not found
    const request = createMockRequest(validToken);

    // Act
    const response = await GET(request);

    // Assert
    expect(mockEmailVerificationFindFirst).toHaveBeenCalledTimes(1);
    // Correct assertion for findFirst arguments
    expect(mockEmailVerificationFindFirst).toHaveBeenCalledWith({
      where: { token: validToken, expiresAt: { gte: expect.any(Date) } },
      // include: { user: true }, // Route does not include user here
    });
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(response.status).toBe(307); // Correct redirect status
    expect(response.headers.get("Location")).toBe(
      new URL("/", baseUrl).toString(),
    );
  });

  it("should redirect to / if token is expired (findFirst returns null)", async () => {
    // Arrange
    mockEmailVerificationFindFirst.mockResolvedValue(null); // Override: findFirst includes expiry check
    const request = createMockRequest(validToken);

    // Act
    const response = await GET(request);

    // Assert
    expect(mockEmailVerificationFindFirst).toHaveBeenCalledTimes(1);
    // Correct assertion for findFirst arguments
    expect(mockEmailVerificationFindFirst).toHaveBeenCalledWith({
      where: { token: validToken, expiresAt: { gte: expect.any(Date) } },
      // include: { user: true }, // Route does not include user here
    });
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(response.status).toBe(307); // Correct redirect status
    expect(response.headers.get("Location")).toBe(
      new URL("/", baseUrl).toString(),
    );
  });

  // --- Success Path Tests ---
  it("should verify user, delete token, create session, set cookie, and redirect on initial verification", async () => {
    // Arrange: Default mocks handle this case (findFirst returns record, first update succeeds)
    const request = createMockRequest(validToken);

    // Act
    const response = await GET(request);

    // Assert Prisma calls
    expect(mockEmailVerificationFindFirst).toHaveBeenCalledTimes(1);
    expect(mockUserUpdate).toHaveBeenCalledTimes(1); // Only verify
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: { isVerified: true },
    });
    expect(mockEmailVerificationDelete).toHaveBeenCalledTimes(1);
    expect(mockEmailVerificationDelete).toHaveBeenCalledWith({
      where: { id: "verif-rec-id" },
    }); // Use ID from mocked record
    // Assert Lucia calls
    expect(mockLuciaCreateSession).toHaveBeenCalledTimes(1);
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(userId, {});
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledTimes(1);
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledWith(mockSessionId);
    // Assert Cookie set
    expect(mockCookiesSet).toHaveBeenCalledTimes(1);
    // Correct assertion for cookie arguments
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockSessionCookie.name,
      mockSessionCookie.value,
      mockSessionCookie.attributes,
    );
    // Assert Redirect
    expect(response.status).toBe(307); // Correct redirect status
    expect(response.headers.get("Location")).toBe(
      new URL("/", baseUrl).toString(),
    );
  });

  it("should verify user, update email from pending, delete token, create session, set cookie, and redirect", async () => {
    // Arrange
    const pendingVerificationRecordId = "verif-rec-id-pending";
    mockEmailVerificationFindFirst.mockResolvedValue({
      id: pendingVerificationRecordId,
      userId: userId,
      token: validToken,
      expiresAt: new Date(Date.now() + 3600000),
      // Don't include user here
    });
    // Mock the sequence of user updates based on API logic
    mockUserUpdate
      // 1. Verify user -> returns user *with* pendingEmail
      .mockResolvedValueOnce({
        id: userId,
        isVerified: true,
        email: userEmail,
        pendingEmail: pendingEmail,
      })
      // 2. Set email from pending -> returns user with updated email
      .mockResolvedValueOnce({ id: userId, email: pendingEmail })
      // 3. Clear pending email -> returns user with pendingEmail cleared
      .mockResolvedValueOnce({ id: userId, pendingEmail: null });

    const request = createMockRequest(validToken);

    // Act
    const response = await GET(request);

    // Assert Prisma calls
    expect(mockEmailVerificationFindFirst).toHaveBeenCalledTimes(1);
    expect(mockUserUpdate).toHaveBeenCalledTimes(3); // Verify, Set Email, Clear Pending
    expect(mockUserUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: userId },
      data: { isVerified: true }, // First call: Verify
    });
    expect(mockUserUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: userId },
      data: { email: pendingEmail }, // Second call: Update email
    });
    expect(mockUserUpdate).toHaveBeenNthCalledWith(3, {
      where: { id: userId },
      data: { pendingEmail: null }, // Third call: Clear pending email
    });
    expect(mockEmailVerificationDelete).toHaveBeenCalledTimes(1);
    expect(mockEmailVerificationDelete).toHaveBeenCalledWith({
      where: { id: pendingVerificationRecordId },
    }); // Use correct ID
    // Assert Lucia & Cookie
    expect(mockLuciaCreateSession).toHaveBeenCalledTimes(1);
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledTimes(1);
    expect(mockCookiesSet).toHaveBeenCalledTimes(1);
    // Assert Redirect
    expect(response.status).toBe(307); // Correct redirect status
    expect(response.headers.get("Location")).toBe(
      new URL("/", baseUrl).toString(),
    );
  });

  // ... Error Handling Tests ...
});
