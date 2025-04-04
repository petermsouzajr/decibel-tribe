import prisma from "@/lib/prisma";
// import { verify } from "@node-rs/argon2"; // Remove this line
import { lucia } from "@/auth";
import { resendVerificationEmail } from "@/app/(auth)/sendVerification";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validation";
import { login } from "@/app/(auth)/login/actions";
import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import type { Mock, MockInstance } from "vitest"; // Import Mock and MockInstance
// import { AuthError } from "next-auth"; // Remove this - not used in original tests

vi.mock("@/lib/prisma", () => {
  const prismaMock = {
    user: {
      findFirst: vi.fn(),
    },
  };
  return { default: prismaMock };
});

vi.mock("@/auth", () => ({
  lucia: {
    createSession: vi.fn(),
    createSessionCookie: vi.fn(),
  },
}));

vi.mock("@/app/(auth)/sendVerification", () => ({
  resendVerificationEmail: vi.fn(),
}));

vi.mock("next/headers", () => {
  const set = vi.fn();
  return {
    cookies: vi.fn(() => ({
      set,
    })),
  };
});

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("bcryptjs");

describe("login", () => {
  const mockCredentials = { username: "testuser", password: "password123" };
  const mockUser = {
    id: "1",
    email: "testuser@example.com",
    username: "testuser",
    passwordHash: "hashedpassword",
    isVerified: true,
  };

  let setSpy: MockInstance; // Use MockInstance type

  beforeEach(() => {
    vi.clearAllMocks();
    const cookieInstance = cookies();
    setSpy = vi.spyOn(cookieInstance, "set");
  });

  it("should validate the input credentials", async () => {
    const parseSpy = vi.spyOn(loginSchema, "parse");
    await login(mockCredentials);
    expect(parseSpy).toBeCalledWith(mockCredentials);
  });

  it("should return an error if the user is not found", async () => {
    //@ts-ignore
    prisma.user.findFirst.mockResolvedValue(null);

    const result = await login(mockCredentials);

    expect(result).toEqual({ error: "Incorrect username or password" });
  });

  it("should return an error if the password is incorrect", async () => {
    //@ts-ignore
    prisma.user.findFirst.mockResolvedValue(mockUser);
    // Mock bcrypt.compare correctly (plain password, hash)
    vi.mocked(bcrypt.compare).mockResolvedValue(false);

    const result = await login(mockCredentials);

    expect(result).toEqual({ error: "Incorrect username or password" });
    expect(bcrypt.compare).toBeCalledWith(
      mockCredentials.password,
      mockUser.passwordHash,
    );
  });

  it("should return an error if the account is not verified", async () => {
    const unverifiedUser = { ...mockUser, isVerified: false };
    //@ts-ignore
    prisma.user.findFirst.mockResolvedValue(unverifiedUser);

    const result = await login(mockCredentials);

    expect(resendVerificationEmail).toBeCalledWith(unverifiedUser.email);
    expect(result).toEqual({
      error: `Your account is not verified. Please check your email at ${mockCredentials.username} for a new verification link.`,
    });
  });

  it("should create a session and set a session cookie for valid credentials", async () => {
    // @ts-ignore
    prisma.user.findFirst.mockResolvedValue(mockUser);

    // Mock bcrypt.compare correctly (plain password, hash)
    vi.mocked(bcrypt.compare).mockResolvedValue(true);

    const mockSession = { id: "session-id" };
    const mockSessionCookie = {
      name: "session",
      value: "cookie-value",
      attributes: {},
    };

    // @ts-ignore
    lucia.createSession.mockResolvedValue(mockSession);
    // @ts-ignore
    lucia.createSessionCookie.mockReturnValue(mockSessionCookie);

    await login(mockCredentials);

    expect(lucia.createSession).toBeCalledWith(mockUser.id, {});
    expect(redirect).toBeCalledWith("/");
  });

  it("should handle unexpected errors", async () => {
    //@ts-ignore
    prisma.user.findFirst.mockRejectedValue(new Error("Unexpected error"));

    const result = await login(mockCredentials);

    expect(result).toEqual({
      error: "Something went wrong. Please try again.",
    });
  });
});
