import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import { signUp } from "@/app/(auth)/signup/actions";
import { signUpSchema } from "@/lib/validation";
import { generateIdFromEntropySize } from "lucia";
import bcrypt from "bcryptjs";
import { generateAndSendVerification } from "@/app/(auth)/sendVerification";
import { isRedirectError } from "next/dist/client/components/redirect";

vi.mock("@/lib/prisma", () => {
  return {
    __esModule: true,
    default: {
      user: {
        findFirst: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/validation", () => ({
  signUpSchema: {
    parse: vi.fn(),
  },
}));

vi.mock("lucia", () => ({
  generateIdFromEntropySize: vi.fn(),
}));

vi.mock("@/app/(auth)/sendVerification", () => ({
  generateAndSendVerification: vi.fn(),
}));

vi.mock("next/dist/client/components/redirect", () => ({
  isRedirectError: vi.fn(),
}));

vi.mock("bcryptjs");

describe("signUp", () => {
  const mockCredentials = {
    username: "testuser",
    email: "testuser@example.com",
    password: "password123",
  };
  const mockCredentialst = {
    username: "testuser2",
    email: "testuser@example.com",
    password: "password123",
  };
  const mockUserId = "user-id";
  const mockPasswordHash = "hashedpassword";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate the input credentials", async () => {
    // @ts-ignore
    signUpSchema.parse.mockReturnValue(mockCredentials);

    await signUp(mockCredentials);

    expect(signUpSchema.parse).toBeCalledWith(mockCredentials);
  });

  it("should return an error if the username is already taken", async () => {
    // @ts-ignore
    signUpSchema.parse.mockReturnValue(mockCredentials);
    // @ts-ignore
    prisma.user.findFirst.mockResolvedValueOnce({
      id: "existing-user-id",
    });

    const result = await signUp(mockCredentials);

    expect(result).toEqual({ error: "Username already taken" });
  });

  it("should return an error if the email is already registered", async () => {
    // @ts-ignore
    signUpSchema.parse.mockReturnValue(mockCredentialst);
    // @ts-ignore
    prisma.user.findFirst
      //@ts-ignore
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "existing-user-id",
      });

    const result = await signUp(mockCredentialst);

    expect(result).toEqual({ error: "Email already registered" });
  });

  it("should hash the password and generate a user ID", async () => {
    // @ts-ignore
    signUpSchema.parse.mockReturnValue(mockCredentials);
    // @ts-ignore
    generateIdFromEntropySize.mockReturnValue(mockUserId);

    await signUp(mockCredentials);

    expect(generateIdFromEntropySize).toBeCalledWith(10);
  });

  it("should generate and send a verification email", async () => {
    // @ts-ignore
    signUpSchema.parse.mockReturnValue(mockCredentials);
    // @ts-ignore
    generateIdFromEntropySize.mockReturnValue(mockUserId);
    // Mock bcrypt.hash to return a predictable value
    const mockedHash = "mockedBcryptHash";
    vi.mocked(bcrypt.hash).mockResolvedValue(mockedHash);

    await signUp(mockCredentials);

    // Expect generateAndSendVerification to be called with the mocked hash
    expect(generateAndSendVerification).toBeCalledWith(
      mockUserId,
      mockCredentials.username,
      mockCredentials.email,
      mockedHash,
    );
  });

  it("should handle unexpected errors", async () => {
    // @ts-ignore
    signUpSchema.parse.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const result = await signUp(mockCredentials);

    expect(result).toEqual({
      error: "Something went wrong. Please try again.",
    });
  });

  it("should rethrow redirect errors", async () => {
    const redirectError = new Error("Redirect error");
    // @ts-ignore
    signUpSchema.parse.mockImplementation(() => {
      throw redirectError;
    });
    // @ts-ignore
    isRedirectError.mockReturnValue(true);

    await expect(signUp(mockCredentials)).rejects.toThrowError(redirectError);
  });
});
