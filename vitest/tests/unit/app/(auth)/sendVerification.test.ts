import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
// Import default exports
import generateVerificationToken from "@/lib/sendEmail";
import sendVerificationEmail from "@/lib/sendEmail"; // Assuming sendVerificationEmail is also default or needs separate import
// Remove named imports if they are default:
// import {
//   generateVerificationToken,
//   sendVerificationEmail,
// } from "@/lib/sendEmail";

import { lucia } from "@/auth";
import { cookies } from "next/headers";
// Remove direct import of functions under test here
// import {
//   generateAndSendVerification,
//   resendVerificationEmail,
// } from "@/app/(auth)/sendVerification";

// --- Mock Dependencies ---

// Define mock functions first
const mockPrismaUserCreate = vi.fn();
const mockPrismaUserPrefsCreate = vi.fn();
const mockPrismaUserFindFirst = vi.fn();
const mockPrismaVerificationDeleteMany = vi.fn();
const mockPrismaVerificationCreate = vi.fn();
const mockPrismaTransaction = vi.fn();
const mockSendVerificationEmail = vi.fn();
const mockStreamUpsertUser = vi.fn();

// Mock Prisma using vi.doMock (runs in place, not hoisted)
vi.doMock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockPrismaUserFindFirst,
      create: mockPrismaUserCreate,
    },
    userPreferences: {
      create: mockPrismaUserPrefsCreate,
    },
    emailVerification: {
      deleteMany: mockPrismaVerificationDeleteMany,
      create: mockPrismaVerificationCreate,
    },
    $transaction: mockPrismaTransaction,
  },
}));

// Mock Email Sending using vi.doMock
vi.doMock("@/lib/sendEmail", () => ({
  default: mockSendVerificationEmail,
}));

// Mock Stream Client using vi.doMock
vi.doMock("@/lib/stream", () => ({
  default: {
    upsertUser: mockStreamUpsertUser,
  },
}));

// Mock crypto (using actual implementation is usually fine for UUIDs)
// vi.mock('crypto', () => ({
//   randomUUID: vi.fn(() => 'mocked-uuid-12345'),
// }));

// --- Setup Environment Variables ---
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

// --- End Mocks & Setup ---

// Mock transaction object used *within* the test implementation
const mockTx = {
  user: { create: mockPrismaUserCreate },
  userPreferences: { create: mockPrismaUserPrefsCreate },
  emailVerification: { create: mockPrismaVerificationCreate },
};

describe("[Auth] generateAndSendVerification action", () => {
  // Dynamically import the function *after* mocks are set up
  let generateAndSendVerification: typeof import("@/app/(auth)/sendVerification").generateAndSendVerification;

  beforeAll(async () => {
    const sendVerificationModule = await import("@/app/(auth)/sendVerification");
    generateAndSendVerification = sendVerificationModule.generateAndSendVerification;
  });

  const userId = "new-user-id-123";
  const username = "newuser";
  const email = "newuser@example.com";
  const passwordHash = "hashedpassword123";
  const expectedToken = expect.any(String);
  const expectedExpiry = expect.any(Date);

  beforeEach(() => {
    vi.resetAllMocks();
    mockPrismaTransaction.mockImplementation(async (callback) => {
      await callback(mockTx);
    });
    mockSendVerificationEmail.mockResolvedValue(undefined);
    mockStreamUpsertUser.mockResolvedValue({});
  });

  it("should create user, prefs, token, upsert stream, and send email on success", async () => {
    // Arrange (Defaults are set up in beforeEach)

    // Act
    const result = await generateAndSendVerification(
      userId,
      username,
      email,
      passwordHash,
    );

    // Assert
    expect(result).toEqual({ success: true });
    expect(result.error).toBeUndefined();

    // Verify transaction was called
    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);

    // Verify DB creations within transaction
    expect(mockPrismaUserCreate).toHaveBeenCalledWith({
      data: {
        id: userId,
        username,
        displayName: username,
        email,
        passwordHash,
      },
    });
    expect(mockPrismaUserPrefsCreate).toHaveBeenCalledWith({
      data: { userId: userId },
    });
    expect(mockPrismaVerificationCreate).toHaveBeenCalledWith({
      data: { userId, token: expectedToken, expiresAt: expectedExpiry },
    });

    // Verify Stream upsert
    expect(mockStreamUpsertUser).toHaveBeenCalledWith({
      id: userId,
      username,
      name: username,
    });

    // Verify email sending (capture generated token)
    const createdTokenData = mockPrismaVerificationCreate.mock.calls[0][0].data;
    const actualVerificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${createdTokenData.token}`;
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      email,
      actualVerificationUrl,
    );
  });

  it("should return error if database transaction fails", async () => {
    // Arrange
    const dbError = new Error("Transaction failed: Constraint violation");
    mockPrismaTransaction.mockRejectedValue(dbError); // Simulate transaction failure

    // Act
    const result = await generateAndSendVerification(
      userId,
      username,
      email,
      passwordHash,
    );

    // Assert
    expect(result).toEqual({
      error: "Something went wrong during the signup process.",
    });
    expect(result.success).toBeUndefined();

    // Verify transaction was attempted
    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);

    // Ensure email was NOT sent
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    // Ensure Stream was NOT updated
    expect(mockStreamUpsertUser).not.toHaveBeenCalled();
  });

  it("should return error if email sending fails after successful transaction", async () => {
    // Arrange
    const emailError = new Error("Email provider unavailable");
    mockSendVerificationEmail.mockRejectedValue(emailError); // Simulate email failure

    // Act
    const result = await generateAndSendVerification(
      userId,
      username,
      email,
      passwordHash,
    );

    // Assert
    expect(result).toEqual({
      error: "Something went wrong during the signup process.",
    });
    expect(result.success).toBeUndefined();

    // Verify transaction was successful
    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
    expect(mockPrismaUserCreate).toHaveBeenCalled();
    expect(mockPrismaUserPrefsCreate).toHaveBeenCalled();
    expect(mockPrismaVerificationCreate).toHaveBeenCalled();
    expect(mockStreamUpsertUser).toHaveBeenCalled(); // Stream update happens within transaction

    // Verify email sending was attempted
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});

describe("[Auth] resendVerificationEmail action", () => {
  // Dynamically import the function *after* mocks are set up
  let resendVerificationEmail: typeof import("@/app/(auth)/sendVerification").resendVerificationEmail;

  beforeAll(async () => {
    const sendVerificationModule = await import("@/app/(auth)/sendVerification");
    resendVerificationEmail = sendVerificationModule.resendVerificationEmail;
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Test successful resend (primary email)
  it("should resend verification email successfully for primary email", async () => {
    // Arrange
    const userEmail = "unverified@example.com";
    const mockUser = {
      id: "user456",
      username: "unverifiedUser",
      email: userEmail, // Primary email exists
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isEmailVerified: false, // User is NOT verified
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

  // Test user not found
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

  // Test user with no email (e.g., Google Sign-in)
  it("should return error if user has no email (e.g., Google)", async () => {
    // Arrange
    const identifier = "googleUser";
    const mockUser = {
      id: "user789",
      username: identifier,
      email: null, // No primary email
      pendingEmail: null, // No pending email
      passwordHash: null, // No password hash
      isEmailVerified: true, // Doesn't matter for this check
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

  // Test failure during prisma deleteMany
  it("should return error if deleting old tokens fails", async () => {
    // Arrange
    const userEmail = "unverified@example.com";
    const mockUser = {
      id: "user456",
      username: "unverifiedUser",
      email: userEmail,
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isEmailVerified: false,
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

  // Test failure during prisma create
  it("should return error if creating new token fails", async () => {
    // Arrange
    const userEmail = "unverified@example.com";
    const mockUser = {
      id: "user456",
      username: "unverifiedUser",
      email: userEmail,
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isEmailVerified: false,
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

  // Test failure during email sending
  it("should return error if sending email fails", async () => {
    // Arrange
    const userEmail = "unverified@example.com";
    const mockUser = {
      id: "user456",
      username: "unverifiedUser",
      email: userEmail,
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isEmailVerified: false,
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
