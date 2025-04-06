import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "@/lib/sendEmail";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import {
  generateAndSendVerification,
  resendVerificationEmail,
} from "@/app/(auth)/sendVerification";

// --- Mock Dependencies ---

// Mock Prisma
const mockPrismaUserFindFirst = vi.fn();
const mockPrismaVerificationDeleteMany = vi.fn();
const mockPrismaVerificationCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockPrismaUserFindFirst,
    },
    emailVerification: {
      deleteMany: mockPrismaVerificationDeleteMany,
      create: mockPrismaVerificationCreate,
    },
    // Mock $transaction if generateAndSendVerification were tested here
    // $transaction: vi.fn().mockImplementation(async (callback) => callback(prisma)),
  },
}));

// Mock Email Sending
const mockSendVerificationEmail = vi.fn();
vi.mock("@/lib/sendEmail", () => ({
  default: mockSendVerificationEmail,
}));

// Mock crypto (Optional - can usually rely on actual crypto.randomUUID)
// vi.mock('crypto', () => ({
//   randomUUID: vi.fn(() => 'mocked-uuid-12345'),
// }));

// --- Setup Environment Variables ---
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

// --- End Mocks & Setup ---

describe("[Auth] generateAndSendVerification action", async () => {
  it.todo("should generate and send verification email successfully");
  it.todo("should handle user not found error");
  it.todo("should handle token generation error");
  it.todo("should handle email sending error");
});

describe("[Auth] resendVerificationEmail action", async () => {
  const { resendVerificationEmail } = await import(
    "@/app/(auth)/sendVerification"
  );
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrismaUserFindFirst.mockClear();
    mockPrismaVerificationDeleteMany.mockClear();
    mockPrismaVerificationCreate.mockClear();
    mockSendVerificationEmail.mockClear();
    // If mocking crypto:
    // vi.mocked(crypto.randomUUID).mockClear();
  });

  // TODO: Test successful resend (primary email)
  it("should resend verification email successfully for primary email", async () => {
    // Arrange
    const userEmail = "unverified@example.com";
    const mockUser = {
      id: "user456",
      username: "unverifiedUser",
      email: userEmail, // Primary email exists
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isVerified: false, // User is NOT verified
      googleId: null,
    };
    const expectedToken = expect.any(String); // We don't need to mock UUID generation
    const expectedExpiry = expect.any(Date);

    mockPrismaUserFindFirst.mockResolvedValue(mockUser);
    mockPrismaVerificationDeleteMany.mockResolvedValue({ count: 1 }); // Simulate deleting some tokens
    mockPrismaVerificationCreate.mockResolvedValue({
      /* mock created token object */
    });
    mockSendVerificationEmail.mockResolvedValue(undefined); // Simulate successful email send

    // Act
    const result = await resendVerificationEmail(userEmail);

    // Assert
    expect(result).toEqual({ success: true });
    expect(result.error).toBeUndefined();

    // Check mocks
    expect(mockPrismaUserFindFirst).toHaveBeenCalledWith({
      where: {
        OR: expect.arrayContaining([
          expect.objectContaining({
            email: { equals: userEmail, mode: "insensitive" },
          }),
        ]),
      },
    });
    expect(mockPrismaVerificationDeleteMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
    });
    expect(mockPrismaVerificationCreate).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        token: expectedToken,
        expiresAt: expectedExpiry,
      },
    });
    // We need to capture the token created to assert the URL correctly
    const createdTokenData = mockPrismaVerificationCreate.mock.calls[0][0].data;
    const actualVerificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${createdTokenData.token}`;

    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      userEmail,
      actualVerificationUrl,
    );
  });

  // TODO: Test user not found
  it("should return error if user not found", async () => {
    // Arrange
    const identifier = "nosuchuser@example.com";
    mockPrismaUserFindFirst.mockResolvedValue(null); // User not found

    // Act
    const result = await resendVerificationEmail(identifier);

    // Assert
    expect(result).toEqual({ error: "User not found." });
    expect(result.success).toBeUndefined();

    expect(mockPrismaUserFindFirst).toHaveBeenCalledWith({
      where: {
        OR: expect.arrayContaining([
          expect.objectContaining({
            email: { equals: identifier, mode: "insensitive" },
          }),
        ]),
      },
    });
    // Ensure other DB/email operations didn't happen
    expect(mockPrismaVerificationDeleteMany).not.toHaveBeenCalled();
    expect(mockPrismaVerificationCreate).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  // TODO: Test user with no email (e.g., Google Sign-in)
  it("should return error if user has no email (e.g., Google)", async () => {
    // Arrange
    const identifier = "googleUser";
    const mockUser = {
      id: "user789",
      username: identifier,
      email: null, // No primary email
      pendingEmail: null, // No pending email
      passwordHash: null, // No password hash
      isVerified: true, // Doesn't matter for this check
      googleId: "google12345", // User signed up with Google
    };
    mockPrismaUserFindFirst.mockResolvedValue(mockUser);

    // Act
    const result = await resendVerificationEmail(identifier);

    // Assert
    expect(result).toEqual({
      error: "You didn't sign up with email and password.",
    });
    expect(result.success).toBeUndefined();

    expect(mockPrismaUserFindFirst).toHaveBeenCalledWith({
      where: {
        OR: expect.arrayContaining([
          expect.objectContaining({
            username: { equals: identifier, mode: "insensitive" },
          }),
        ]),
      },
    });
    // Ensure DB/email operations didn't happen
    expect(mockPrismaVerificationDeleteMany).not.toHaveBeenCalled();
    expect(mockPrismaVerificationCreate).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  // TODO: Test failure during prisma deleteMany
  it("should return error if deleting old tokens fails", async () => {
    // Arrange
    const userEmail = "unverified@example.com";
    const mockUser = {
      id: "user456",
      username: "unverifiedUser",
      email: userEmail,
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isVerified: false,
      googleId: null,
    };
    mockPrismaUserFindFirst.mockResolvedValue(mockUser);
    const dbError = new Error("DB connection lost");
    mockPrismaVerificationDeleteMany.mockRejectedValue(dbError); // Simulate DB error

    // Act
    const result = await resendVerificationEmail(userEmail);

    // Assert
    expect(result).toEqual({ error: "Failed to resend verification email." });
    expect(result.success).toBeUndefined();

    expect(mockPrismaUserFindFirst).toHaveBeenCalled();
    expect(mockPrismaVerificationDeleteMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
    });
    // Ensure steps after deleteMany were not reached
    expect(mockPrismaVerificationCreate).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  // TODO: Test failure during prisma create
  it("should return error if creating new token fails", async () => {
    // Arrange
    const userEmail = "unverified@example.com";
    const mockUser = {
      id: "user456",
      username: "unverifiedUser",
      email: userEmail,
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isVerified: false,
      googleId: null,
    };
    mockPrismaUserFindFirst.mockResolvedValue(mockUser);
    mockPrismaVerificationDeleteMany.mockResolvedValue({ count: 1 });
    const dbError = new Error("DB connection lost during create");
    mockPrismaVerificationCreate.mockRejectedValue(dbError); // Simulate DB error

    // Act
    const result = await resendVerificationEmail(userEmail);

    // Assert
    expect(result).toEqual({ error: "Failed to resend verification email." });
    expect(result.success).toBeUndefined();

    expect(mockPrismaUserFindFirst).toHaveBeenCalled();
    expect(mockPrismaVerificationDeleteMany).toHaveBeenCalled();
    expect(mockPrismaVerificationCreate).toHaveBeenCalled(); // Should have been attempted
    // Ensure email was not sent
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  // TODO: Test failure during email sending
  it("should return error if sending email fails", async () => {
    // Arrange
    const userEmail = "unverified@example.com";
    const mockUser = {
      id: "user456",
      username: "unverifiedUser",
      email: userEmail,
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isVerified: false,
      googleId: null,
    };
    mockPrismaUserFindFirst.mockResolvedValue(mockUser);
    mockPrismaVerificationDeleteMany.mockResolvedValue({ count: 1 });
    mockPrismaVerificationCreate.mockResolvedValue({
      /* ... */
    });
    const emailError = new Error("SMTP server down");
    mockSendVerificationEmail.mockRejectedValue(emailError); // Simulate email error

    // Act
    const result = await resendVerificationEmail(userEmail);

    // Assert
    expect(result).toEqual({ error: "Failed to resend verification email." });
    expect(result.success).toBeUndefined();

    // Verify all steps up to email sending were called
    expect(mockPrismaUserFindFirst).toHaveBeenCalled();
    expect(mockPrismaVerificationDeleteMany).toHaveBeenCalled();
    expect(mockPrismaVerificationCreate).toHaveBeenCalled();
    expect(mockSendVerificationEmail).toHaveBeenCalled(); // Should have been attempted
  });
});
