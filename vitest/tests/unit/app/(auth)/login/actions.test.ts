import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resendVerificationEmail } from "@/app/(auth)/sendVerification";

// Define ALL explicit mock functions FIRST
const mockLuciaCreateSession = vi.fn();
const mockLuciaCreateSessionCookie = vi.fn();
const mockPrismaFindFirst = vi.fn();
const mockBcryptCompare = vi.fn();
const mockSetCookie = vi.fn();
const mockRedirect = vi.fn();
const mockResendVerification = vi.fn();

// Now, the vi.mock calls
vi.mock("@/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/auth")>();
  return {
    ...actual, // Keep other exports if any
    lucia: {
      createSession: mockLuciaCreateSession,
      createSessionCookie: mockLuciaCreateSessionCookie,
    },
    validateRequest: vi.fn().mockResolvedValue({ user: null, session: null }),
  };
});

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockPrismaFindFirst,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mockBcryptCompare,
  },
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: mockSetCookie,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// NOTE: This path might still be wrong due to the move
vi.mock("@/app/(auth)/sendVerification", () => ({
  resendVerificationEmail: mockResendVerification,
}));

describe("[API][Auth] login action", async () => {
  // Dynamically import AFTER mocks are set up
  const { login } = await import("@/app/(auth)/login/actions");

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset the specific mock functions too
    mockLuciaCreateSession.mockClear();
    mockLuciaCreateSessionCookie.mockClear();
    mockPrismaFindFirst.mockClear();
    mockBcryptCompare.mockClear();
    mockSetCookie.mockClear();
    mockRedirect.mockClear();
    mockResendVerification.mockClear();
  });

  it("should return session cookie on successful login", async () => {
    // Arrange
    const credentials = { username: "testuser", password: "password123" };
    const mockUser = {
      id: "user123",
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashedpassword",
      isVerified: true, // Important: user is verified
    };
    const mockSession = {
      id: "session123",
      userId: "user123",
      expiresAt: new Date(Date.now() + 3600 * 1000),
      fresh: false,
    };
    const mockCookie = {
      name: "auth_session",
      value: "session123_value",
      attributes: { secure: true },
      serialize: vi.fn(() => "auth_session=session123_value; Secure"),
    };

    // Mock Prisma response
    mockPrismaFindFirst.mockResolvedValue(mockUser);

    // Mock bcrypt response
    mockBcryptCompare.mockResolvedValue(true);

    // Mock Lucia responses using the specific mock functions
    mockLuciaCreateSession.mockResolvedValue(mockSession);
    mockLuciaCreateSessionCookie.mockReturnValue(mockCookie);

    // Act
    const result = await login(credentials, true);

    // Assert
    expect(result).toEqual({ sessionCookie: mockCookie });
    expect(result.error).toBeUndefined();

    // Check mocks were called correctly using the specific mock functions
    expect(mockPrismaFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: { equals: credentials.username, mode: "insensitive" } },
          { username: { equals: credentials.username, mode: "insensitive" } },
        ],
      },
    });
    expect(mockBcryptCompare).toHaveBeenCalledWith(
      credentials.password,
      mockUser.passwordHash,
    );
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(mockUser.id, {});
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledWith(mockSession.id);
    expect(mockSetCookie).toHaveBeenCalledWith(
      mockCookie.name,
      mockCookie.value,
      mockCookie.attributes,
    );

    // Check mocks were NOT called
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockResendVerification).not.toHaveBeenCalled();
  });

  // - User not found
  // - Incorrect password
  // - Unverified user
  // - Session creation error

  // TODO: Test invalid username
  it("should return error if user not found", async () => {
    // Arrange
    const credentials = { username: "nosuchuser", password: "password123" };
    mockPrismaFindFirst.mockResolvedValue(null); // User does not exist

    // Act
    const result = await login(credentials, true);

    // Assert
    expect(result.error).toBe("Incorrect username or password");
    expect(result.sessionCookie).toBeUndefined();
    expect(mockPrismaFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: { equals: credentials.username, mode: "insensitive" } },
          { username: { equals: credentials.username, mode: "insensitive" } },
        ],
      },
    });
    // Ensure other steps were not reached
    expect(mockBcryptCompare).not.toHaveBeenCalled();
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockResendVerification).not.toHaveBeenCalled();
  });

  // TODO: Test invalid password
  it("should return error on incorrect password", async () => {
    // Arrange
    const credentials = { username: "testuser", password: "wrongpassword" };
    const mockUser = {
      id: "user123",
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashedpassword",
      isVerified: true, // User exists and is verified
    };
    mockPrismaFindFirst.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false); // Password compare fails

    // Act
    const result = await login(credentials, true);

    // Assert
    expect(result.error).toBe("Incorrect username or password");
    expect(result.sessionCookie).toBeUndefined();
    expect(mockPrismaFindFirst).toHaveBeenCalledWith({
      where: { OR: expect.any(Array) }, // Simplified check for findFirst args
    });
    expect(mockBcryptCompare).toHaveBeenCalledWith(
      credentials.password,
      mockUser.passwordHash,
    );
    // Ensure subsequent steps were not reached
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockResendVerification).not.toHaveBeenCalled();
  });

  it("should return error and resend verification if user is not verified", async () => {
    // Arrange
    const credentials = {
      username: "unverified@example.com",
      password: "password123",
    };
    const mockUser = {
      id: "user456",
      username: "unverifiedUser",
      email: "unverified@example.com",
      passwordHash: "hashedpassword",
      isVerified: false, // User exists but is NOT verified
    };
    mockPrismaFindFirst.mockResolvedValue(mockUser);
    mockResendVerification.mockResolvedValue(undefined); // Mock the resend action

    // Act
    const result = await login(credentials, true);

    // Assert
    expect(result.error).toContain("Your account is not verified."); // Check for specific message
    expect(result.error).toContain(credentials.username); // Check if email is mentioned
    expect(result.sessionCookie).toBeUndefined();

    expect(mockPrismaFindFirst).toHaveBeenCalledWith({
      where: { OR: expect.any(Array) },
    });
    expect(mockResendVerification).toHaveBeenCalledWith(mockUser.email); // Verify email resend was called

    // Ensure password check and session creation were skipped
    expect(mockBcryptCompare).not.toHaveBeenCalled();
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  // TODO: Test session creation failure
  it("should return generic error if session creation fails", async () => {
    // Arrange
    const credentials = { username: "testuser", password: "password123" };
    const mockUser = {
      id: "user123",
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashedpassword",
      isVerified: true,
    };
    mockPrismaFindFirst.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    const sessionError = new Error("Database unavailable");
    mockLuciaCreateSession.mockRejectedValue(sessionError); // Simulate error during session creation

    // Act
    const result = await login(credentials, true);

    // Assert
    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(result.sessionCookie).toBeUndefined();

    // Verify calls up to the point of failure
    expect(mockPrismaFindFirst).toHaveBeenCalled();
    expect(mockBcryptCompare).toHaveBeenCalled();
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(mockUser.id, {});

    // Ensure steps after session creation were not reached
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockResendVerification).not.toHaveBeenCalled();
  });

  // TODO: Add tests for edge cases (e.g., input validation handled by Zod?)

  // Remove placeholder test
  // it('placeholder test', () => {
  //   expect(true).toBe(true);
  // });
});
