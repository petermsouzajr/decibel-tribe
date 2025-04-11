import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resendVerificationEmail } from "@/app/(auth)/sendVerification";
// Import the function under test normally
import { login } from "@/app/(auth)/login/actions";

// Wrap ALL necessary mock functions in vi.hoisted()
const {
  mockLuciaCreateSession,
  mockLuciaCreateSessionCookie,
  mockPrismaFindFirst,
  mockBcryptCompare,
  mockSetCookie,
  mockRedirect,
  mockResendVerification,
} = vi.hoisted(() => {
  return {
    mockLuciaCreateSession: vi.fn(),
    mockLuciaCreateSessionCookie: vi.fn(),
    mockPrismaFindFirst: vi.fn(),
    mockBcryptCompare: vi.fn(),
    mockSetCookie: vi.fn(),
    mockRedirect: vi.fn(),
    mockResendVerification: vi.fn(),
  };
});

// Now, the vi.mock calls (ensure they use the hoisted mocks correctly)
vi.mock("@/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/auth")>();
  return {
    ...actual,
    lucia: {
      createSession: mockLuciaCreateSession, // Uses hoisted mock
      createSessionCookie: mockLuciaCreateSessionCookie, // Uses hoisted mock
    },
    validateRequest: vi.fn().mockResolvedValue({ user: null, session: null }),
  };
});

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockPrismaFindFirst, // Uses hoisted mock
    },
  },
}));

// Mock bcrypt compare function directly (matching import * as bcrypt)
vi.mock("bcryptjs", () => ({
  compare: mockBcryptCompare, // Use hoisted mock directly
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: mockSetCookie, // Uses hoisted mock
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect, // Uses hoisted mock
}));

vi.mock("@/app/(auth)/sendVerification", () => ({
  resendVerificationEmail: mockResendVerification, // Uses hoisted mock
}));

describe("[API][Auth] login action", () => {
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
      isVerified: true,
    };
    const mockSession = {
      id: "session123",
      userId: "user123",
      expiresAt: new Date(),
      fresh: false,
    };
    const mockCookie = {
      name: "auth_session",
      value: "session123_value",
      attributes: { secure: true },
      serialize: vi.fn(),
    }; // Added serialize mock

    mockPrismaFindFirst.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockLuciaCreateSession.mockResolvedValue(mockSession);
    mockLuciaCreateSessionCookie.mockReturnValue(mockCookie);

    // Act
    const result = await login(credentials, true);

    // Assert
    // Check intermediate steps first
    expect(mockPrismaFindFirst).toHaveBeenCalled();
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

    // Then check final result
    expect(result.error).toBeUndefined();
    expect(result).toEqual({ sessionCookie: mockCookie });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  // Test invalid username
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

  // Test invalid password
  it("should return error on incorrect password", async () => {
    // Arrange
    const credentials = { username: "testuser", password: "wrongpassword" };
    const mockUser = {
      id: "user123",
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashedpassword",
      isVerified: true,
    };
    mockPrismaFindFirst.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false);

    // Act
    const result = await login(credentials, true);

    // Assert
    // Check intermediate steps
    expect(mockPrismaFindFirst).toHaveBeenCalled();
    expect(mockBcryptCompare).toHaveBeenCalledWith(
      credentials.password,
      mockUser.passwordHash,
    );

    // Check final result
    expect(result.error).toBe("Incorrect username or password");
    expect(result.sessionCookie).toBeUndefined();

    // Ensure subsequent steps were not reached
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
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

  // Test session creation failure
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
    mockBcryptCompare.mockResolvedValue(true); // Password is correct
    mockLuciaCreateSession.mockRejectedValue(new Error("Session DB error")); // Session creation fails

    // Act
    const result = await login(credentials, true);

    // Assert
    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(result.sessionCookie).toBeUndefined();

    // Verify calls up to the point of failure
    expect(mockPrismaFindFirst).toHaveBeenCalled();
    expect(mockBcryptCompare).toHaveBeenCalled(); // Expect compare to have been called
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(mockUser.id, {}); // Expect session creation to have been attempted

    // Ensure subsequent steps were not reached
    expect(mockLuciaCreateSessionCookie).not.toHaveBeenCalled();
    expect(mockSetCookie).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
