// /// <reference types="vitest/globals" />
import {
  generateAndSendVerification,
  resendVerificationEmail,
} from "@/app/(auth)/sendVerification";
import prisma from "@/lib/prisma";
import sendVerificationEmail from "@/lib/sendEmail";
import crypto from "crypto";
import { vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    $transaction: vi.fn(),
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    userPreferences: {
      create: vi.fn(),
    },
    emailVerification: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/sendEmail", () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock("crypto", () => ({
  __esModule: true,
  default: {
    randomUUID: vi.fn(),
  },
}));

describe("generateAndSendVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully generate and send verification email", async () => {
    //@ts-ignore
    prisma.$transaction.mockResolvedValueOnce();
    //@ts-ignore
    crypto.randomUUID.mockReturnValue("test-token");
    //@ts-ignore
    sendVerificationEmail.mockResolvedValueOnce();

    const result = await generateAndSendVerification(
      "user-id",
      "username",
      "email@example.com",
      "password-hash",
    );

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "email@example.com",
      expect.stringContaining("test-token"),
    );
    expect(result).toEqual({ success: true });
  });

  it("should handle errors during the process", async () => {
    //@ts-ignore
    prisma.$transaction.mockRejectedValueOnce(new Error("Test Error"));

    const result = await generateAndSendVerification(
      "user-id",
      "username",
      "email@example.com",
      "password-hash",
    );

    expect(result).toEqual({
      error: "Something went wrong during the signup process.",
    });
  });
});

describe("resendVerificationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully resend verification email", async () => {
    //@ts-ignore
    prisma.user.findFirst.mockResolvedValueOnce({
      id: "user-id",
      email: "email@example.com",
      isVerified: false,
      pendingEmail: null,
      googleId: null,
    });
    //@ts-ignore
    prisma.emailVerification.deleteMany.mockResolvedValueOnce();
    //@ts-ignore
    prisma.emailVerification.create.mockResolvedValueOnce();
    //@ts-ignore
    crypto.randomUUID.mockReturnValue("test-token");
    //@ts-ignore
    sendVerificationEmail.mockResolvedValueOnce();

    const result = await resendVerificationEmail("email@example.com");

    expect(prisma.user.findFirst).toHaveBeenCalled();
    expect(prisma.emailVerification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-id",
        token: "test-token",
        expiresAt: expect.any(Date),
      },
    });
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "email@example.com",
      expect.stringContaining("test-token"),
    );
    expect(result).toEqual({ success: true });
  });

  it("should handle user not found", async () => {
    //@ts-ignore
    prisma.user.findFirst.mockResolvedValueOnce(null);

    const result = await resendVerificationEmail("nonexistent@example.com");

    expect(result).toEqual({ error: "User not found." });
  });

  it("should handle errors during the process", async () => {
    //@ts-ignore
    prisma.user.findFirst.mockRejectedValueOnce(new Error("Test Error"));

    const result = await resendVerificationEmail("email@example.com");

    expect(result).toEqual({ error: "Failed to resend verification email." });
  });
});
