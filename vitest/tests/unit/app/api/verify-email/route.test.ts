import { describe, it, expect, vi, beforeEach } from "vitest";
// NOTE: Cannot import './route' here because vi.doMock must run first
// import { GET } from './route';
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers"; // Import to potentially mock its return value
import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { GET } from "@/app/api/verify-email/route"; // Updated import

// --- DEFINE Explicit Mocks FIRST ---
const mockPrismaVerificationFindFirst = vi.fn();
const mockPrismaUserUpdate = vi.fn();
const mockPrismaVerificationDelete = vi.fn();
const mockLuciaCreateSession = vi.fn();
const mockLuciaCreateSessionCookie = vi.fn();
const mockSetCookie = vi.fn();
const mockRedirect = vi.fn(); // Defined here too for consistency

// --- Mock Dependencies using vi.doMock (runs in place) ---

// Mock Prisma
vi.doMock("@/lib/prisma", () => ({
  default: {
    emailVerification: {
      findFirst: mockPrismaVerificationFindFirst,
      delete: mockPrismaVerificationDelete,
    },
    user: {
      update: mockPrismaUserUpdate,
    },
  },
}));

// Mock Lucia
vi.doMock("@/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/auth")>();
  return {
    ...actual,
    lucia: {
      createSession: mockLuciaCreateSession,
      createSessionCookie: mockLuciaCreateSessionCookie,
    },
  };
});

// Mock next/headers cookies
vi.doMock("next/headers", () => ({
  cookies: () => ({
    set: mockSetCookie,
  }),
}));

// Mock next/navigation
vi.doMock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// --- Helper to Create Mock Request ---
function createMockRequest(
  token: string | null,
  baseUrl = "http://localhost:3000",
): NextRequest {
  const url = new URL(baseUrl);
  if (token) {
    url.pathname = "/api/verify-email"; // Add path for clarity
    url.searchParams.set("token", token);
  }
  return new NextRequest(url.toString());
}

// --- End Mocks & Helpers ---

describe("[API] /api/verify-email GET Handler", async () => {
  const { GET } = await import("@/app/api/verify-email/route"); // Updated import

  beforeEach(() => {
    vi.resetAllMocks();
    mockPrismaVerificationFindFirst.mockClear();
    mockPrismaUserUpdate.mockClear();
    mockPrismaVerificationDelete.mockClear();
    mockLuciaCreateSession.mockClear();
    mockLuciaCreateSessionCookie.mockClear();
    mockSetCookie.mockClear();
    mockRedirect.mockClear();
  });

  // TODO: Test successful verification (no pending email)
  it("should verify user, set session, delete token, and redirect on valid token (no pending email)", async () => {
    // Arrange
    const token = "valid-token-123";
    const mockRequest = createMockRequest(token);
    const verificationRecord = {
      id: "verifyRec1",
      userId: "user123",
      token: token,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
    const mockUser = {
      id: "user123",
      email: "test@example.com",
      isVerified: false,
      pendingEmail: null,
    }; // No pending email
    const updatedUser = { ...mockUser, isVerified: true }; // User after update
    const mockSession = { id: "session456" };
    const mockCookie = {
      name: "auth_session",
      value: "session456_value",
      attributes: { path: "/", secure: true },
      serialize: vi.fn(),
    };

    mockPrismaVerificationFindFirst.mockResolvedValue(verificationRecord);
    mockPrismaUserUpdate.mockResolvedValue(updatedUser); // First update returns user
    mockPrismaVerificationDelete.mockResolvedValue({
      /* ... */
    });
    mockLuciaCreateSession.mockResolvedValue(mockSession);
    mockLuciaCreateSessionCookie.mockReturnValue(mockCookie);

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(307); // Or 302/303 depending on Next.js version/config
    expect(response.headers.get("Location")).toBe("http://localhost:3000/"); // Base URL

    // Verify mock calls
    expect(mockPrismaVerificationFindFirst).toHaveBeenCalledWith({
      where: { token: token, expiresAt: { gte: expect.any(Date) } },
    });
    // Check the first update call
    expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
      where: { id: verificationRecord.userId },
      data: { isVerified: true },
    });
    // Ensure the pending email updates were NOT called (because pendingEmail was null)
    expect(mockPrismaUserUpdate).toHaveBeenCalledTimes(1); // Only called once

    expect(mockPrismaVerificationDelete).toHaveBeenCalledWith({
      where: { id: verificationRecord.id },
    });
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(updatedUser.id, {});
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledWith(mockSession.id);
    expect(mockSetCookie).toHaveBeenCalledWith(
      mockCookie.name,
      mockCookie.value,
      mockCookie.attributes,
    );
  });

  // TODO: Test successful verification (with pending email)
  it("should update user email if pendingEmail exists during verification", async () => {
    // Arrange
    const token = "valid-token-pending-456";
    const mockRequest = createMockRequest(token);
    const verificationRecord = {
      id: "verifyRec2",
      userId: "user456",
      token: token,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
    const pendingEmail = "new@example.com";
    const mockUserWithPending = {
      id: "user456",
      email: "old@example.com",
      isVerified: false,
      pendingEmail: pendingEmail,
    };
    const updatedUserVerified = { ...mockUserWithPending, isVerified: true };
    // Mock the subsequent updates - they don't necessarily need to return the user object
    const updatedUserEmail = { ...updatedUserVerified, email: pendingEmail };
    const updatedUserCleared = { ...updatedUserEmail, pendingEmail: null };

    const mockSession = { id: "session789" };
    const mockCookie = {
      name: "auth_session",
      value: "session789_value",
      attributes: { path: "/", secure: true },
      serialize: vi.fn(),
    };

    mockPrismaVerificationFindFirst.mockResolvedValue(verificationRecord);
    // Chain the mockResolvedValue for the three update calls
    mockPrismaUserUpdate
      .mockResolvedValueOnce(updatedUserVerified) // First call (isVerified) returns user with pending
      .mockResolvedValueOnce(updatedUserEmail) // Second call (update email)
      .mockResolvedValueOnce(updatedUserCleared); // Third call (clear pending)

    mockPrismaVerificationDelete.mockResolvedValue({
      /* ... */
    });
    mockLuciaCreateSession.mockResolvedValue(mockSession);
    mockLuciaCreateSessionCookie.mockReturnValue(mockCookie);

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost:3000/");

    // Verify calls
    expect(mockPrismaVerificationFindFirst).toHaveBeenCalledWith({
      where: { token: token, expiresAt: { gte: expect.any(Date) } },
    });

    // Check the three update calls in order
    expect(mockPrismaUserUpdate).toHaveBeenCalledTimes(3);
    expect(mockPrismaUserUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: verificationRecord.userId },
      data: { isVerified: true },
    });
    expect(mockPrismaUserUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: verificationRecord.userId },
      data: { email: pendingEmail }, // Updates email from pending
    });
    expect(mockPrismaUserUpdate).toHaveBeenNthCalledWith(3, {
      where: { id: verificationRecord.userId },
      data: { pendingEmail: null }, // Clears pending email
    });

    expect(mockPrismaVerificationDelete).toHaveBeenCalledWith({
      where: { id: verificationRecord.id },
    });
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(
      verificationRecord.userId,
      {},
    ); // Use userId directly here
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledWith(mockSession.id);
    expect(mockSetCookie).toHaveBeenCalledWith(
      mockCookie.name,
      mockCookie.value,
      mockCookie.attributes,
    );
  });

  // TODO: Test missing token
  it("should redirect home if token is missing", async () => {
    // Arrange
    const mockRequest = createMockRequest(null); // No token

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost:3000/");

    // Verify no DB or auth operations happened
    expect(mockPrismaVerificationFindFirst).not.toHaveBeenCalled();
    expect(mockPrismaUserUpdate).not.toHaveBeenCalled();
    expect(mockPrismaVerificationDelete).not.toHaveBeenCalled();
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  // TODO: Test token not found / expired
  it("should redirect home if token is not found or expired", async () => {
    // Arrange
    const token = "invalid-or-expired-token";
    const mockRequest = createMockRequest(token);
    mockPrismaVerificationFindFirst.mockResolvedValue(null); // Token not found

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost:3000/");

    // Verify findFirst was called, but nothing after
    expect(mockPrismaVerificationFindFirst).toHaveBeenCalledWith({
      where: { token: token, expiresAt: { gte: expect.any(Date) } },
    });
    expect(mockPrismaUserUpdate).not.toHaveBeenCalled();
    expect(mockPrismaVerificationDelete).not.toHaveBeenCalled();
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  // TODO: Test user update failure
  it("should redirect home if updating user fails", async () => {
    // Arrange
    const token = "valid-token-fail-update";
    const mockRequest = createMockRequest(token);
    const verificationRecord = {
      id: "verifyRec3",
      userId: "user789",
      token: token,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
    const dbError = new Error("DB connection lost during user update");

    mockPrismaVerificationFindFirst.mockResolvedValue(verificationRecord);
    mockPrismaUserUpdate.mockRejectedValue(dbError); // Simulate error on first update call

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost:3000/");

    // Verify calls up to the point of failure
    expect(mockPrismaVerificationFindFirst).toHaveBeenCalledWith({
      where: { token: token, expiresAt: { gte: expect.any(Date) } },
    });
    expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
      // The failing call
      where: { id: verificationRecord.userId },
      data: { isVerified: true },
    });

    // Verify subsequent operations were skipped
    expect(mockPrismaVerificationDelete).not.toHaveBeenCalled();
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  // TODO: Test token deletion failure (should still succeed? TBC based on code)
  it("should redirect home if deleting token fails", async () => {
    // Arrange
    const token = "valid-token-fail-delete";
    const mockRequest = createMockRequest(token);
    const verificationRecord = {
      id: "verifyRec4",
      userId: "user123",
      token: token,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
    const mockUser = {
      id: "user123",
      email: "test@example.com",
      isVerified: false,
      pendingEmail: null,
    };
    const updatedUser = { ...mockUser, isVerified: true };
    const dbError = new Error("DB connection lost during token delete");

    mockPrismaVerificationFindFirst.mockResolvedValue(verificationRecord);
    mockPrismaUserUpdate.mockResolvedValue(updatedUser);
    mockPrismaVerificationDelete.mockRejectedValue(dbError); // Simulate error

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost:3000/");

    // Verify calls up to the point of failure
    expect(mockPrismaVerificationFindFirst).toHaveBeenCalled();
    expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
      where: { id: verificationRecord.userId },
      data: { isVerified: true },
    });
    expect(mockPrismaVerificationDelete).toHaveBeenCalledWith({
      where: { id: verificationRecord.id },
    });

    // Verify session creation was skipped due to the error
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  // TODO: Test session creation failure
  it("should redirect home if session creation fails", async () => {
    // Arrange
    const token = "valid-token-fail-session";
    const mockRequest = createMockRequest(token);
    const verificationRecord = {
      id: "verifyRec5",
      userId: "user123",
      token: token,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
    const mockUser = {
      id: "user123",
      email: "test@example.com",
      isVerified: false,
      pendingEmail: null,
    };
    const updatedUser = { ...mockUser, isVerified: true };
    const sessionError = new Error("Lucia unavailable");

    mockPrismaVerificationFindFirst.mockResolvedValue(verificationRecord);
    mockPrismaUserUpdate.mockResolvedValue(updatedUser);
    mockPrismaVerificationDelete.mockResolvedValue({
      /* ... */
    });
    mockLuciaCreateSession.mockRejectedValue(sessionError); // Simulate error

    // Act
    const response = await GET(mockRequest);

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost:3000/");

    // Verify calls up to the point of failure
    expect(mockPrismaVerificationFindFirst).toHaveBeenCalled();
    expect(mockPrismaUserUpdate).toHaveBeenCalled();
    expect(mockPrismaVerificationDelete).toHaveBeenCalled();
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(updatedUser.id, {});

    // Verify subsequent operations were skipped
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
  });
});
