import { resendVerification } from "@/app/(auth)/forgot-pass/actions";
import { resendVerificationEmail } from "@/app/(auth)/sendVerification";
import prisma from "@/lib/prisma";
import { resetPasswordValues } from "@/lib/validation";

vi.mock("@/lib/prisma", () => {
  return {
    default: {
      user: {
        findFirst: vi.fn(),
      },
    },
  };
});

vi.mock("@/app/(auth)/sendVerification", () => ({
  resendVerificationEmail: vi.fn(),
}));

describe.skip("Password Reset Actions", () => {
  const mockCredentials: resetPasswordValues = {
    credential: "test@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resend verification email when user is found", async () => {
    //@ts-ignore
    prisma.user.findFirst.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      isVerified: false,
      googleId: null,
    });

    //@ts-ignore
    resendVerificationEmail.mockResolvedValue(undefined);

    const result = await resendVerification(mockCredentials);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: { equals: "test@example.com", mode: "insensitive" } },
          { pendingEmail: { equals: "test@example.com", mode: "insensitive" } },
          { username: { equals: "test@example.com", mode: "insensitive" } },
        ],
      },
    });
    expect(resendVerificationEmail).toHaveBeenCalledWith("test@example.com");
    expect(result).toEqual({ error: "" });
  });

  it("should return error when user is not found", async () => {
    //@ts-ignore
    prisma.user.findFirst.mockResolvedValue(null);

    const result = await resendVerification(mockCredentials);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: { equals: "test@example.com", mode: "insensitive" } },
          { pendingEmail: { equals: "test@example.com", mode: "insensitive" } },
          { username: { equals: "test@example.com", mode: "insensitive" } },
        ],
      },
    });
    expect(resendVerificationEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "User not found." });
  });

  it("should return error when an exception occurs", async () => {
    //@ts-ignore
    prisma.user.findFirst.mockRejectedValue(new Error("Database error"));

    const result = await resendVerification(mockCredentials);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: { equals: "test@example.com", mode: "insensitive" } },
          { pendingEmail: { equals: "test@example.com", mode: "insensitive" } },
          { username: { equals: "test@example.com", mode: "insensitive" } },
        ],
      },
    });
    expect(resendVerificationEmail).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: "Something went wrong. Please try again. [object Object]",
    });
  });
});
