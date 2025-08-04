import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteUserAccount, reactivateUserAccount, exportUserData } from "@/app/(auth)/deleteAccount";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import streamServerClient from "@/lib/stream";
import { validateRequest } from "@/auth";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/stream", () => ({
  default: {
    deleteUser: vi.fn(),
    upsertUser: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth module
vi.mock("@/auth", () => ({
  validateRequest: vi.fn(),
}));

describe("deleteUserAccount", () => {
  const mockUser = {
    id: "user123",
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    passwordHash: "hashedPassword",
    deletedAt: null,
    createdAt: new Date(),
    avatarUrl: null,
    googleId: null,
  };

  const mockFormData = {
    password: "correctPassword",
    confirmDeletion: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("with session validation", () => {
    it("should successfully delete user account", async () => {
      // Mock session validation
      vi.mocked(validateRequest).mockResolvedValue({
        user: mockUser,
        session: { id: "session123" } as any,
      });

      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      const result = await deleteUserAccount(mockFormData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Account deleted successfully");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it("should fail if password is incorrect", async () => {
      vi.mocked(validateRequest).mockResolvedValue({
        user: mockUser,
        session: { id: "session123" } as any,
      });

      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      const result = await deleteUserAccount(mockFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid password");
    });

    it("should fail if user is already deleted", async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      vi.mocked(validateRequest).mockResolvedValue({
        user: deletedUser,
        session: { id: "session123" } as any,
      });

      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const result = await deleteUserAccount(mockFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Account is already deleted");
    });

    it("should fail if confirmation is not checked", async () => {
      vi.mocked(validateRequest).mockResolvedValue({
        user: mockUser,
        session: { id: "session123" } as any,
      });

      const result = await deleteUserAccount({
        password: "correctPassword",
        confirmDeletion: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("You must confirm that you want to delete your account");
    });

    it("should fail if password is missing", async () => {
      vi.mocked(validateRequest).mockResolvedValue({
        user: mockUser,
        session: { id: "session123" } as any,
      });

      const result = await deleteUserAccount({
        password: "",
        confirmDeletion: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password is required to delete your account");
    });
  });

  describe("with userId parameter", () => {
    it("should successfully delete user account when userId is provided", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      const result = await deleteUserAccount(mockFormData, "user123");

      expect(result.success).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user123" },
        select: {
          id: true,
          passwordHash: true,
          deletedAt: true,
        },
      });
    });

    it("should fail if user not found when userId is provided", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await deleteUserAccount(mockFormData, "nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });
});

describe("reactivateUserAccount", () => {
  const mockUser = {
    id: "user123",
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    deletedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Deleted 1 day ago
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully reactivate user account within grace period", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    const result = await reactivateUserAccount("user123");

    expect(result.success).toBe(true);
    expect(result.message).toBe("Account reactivated successfully");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: { deletedAt: null },
    });
  });

  it("should fail if user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await reactivateUserAccount("nonexistent");

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not found");
  });

  it("should fail if account is not deleted", async () => {
    const activeUser = { ...mockUser, deletedAt: null };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as any);

    const result = await reactivateUserAccount("user123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Account is not deleted");
  });

  it("should fail if grace period has expired", async () => {
    const oldDeletedUser = { 
      ...mockUser, 
      deletedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // Deleted 100 days ago
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(oldDeletedUser as any);

    const result = await reactivateUserAccount("user123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Account reactivation period has expired");
  });

  it("should handle StreamChat errors gracefully", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
    vi.mocked(streamServerClient.upsertUser).mockRejectedValue(new Error("StreamChat error"));

    const result = await reactivateUserAccount("user123");

    expect(result.success).toBe(true);
    expect(result.message).toBe("Account reactivated successfully");
  });
});

describe("exportUserData", () => {
  const mockUser = {
    id: "user123",
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    passwordHash: "hashedPassword",
    deletedAt: null,
    createdAt: new Date(),
    avatarUrl: null,
    googleId: null,
    posts: [],
    events: [],
    groups: [],
    following: [],
    followers: [],
    userInstruments: [],
    userSkills: [],
    userPreferences: null,
    receivedNotifications: [],
    issuedNotifications: [],
    bookmarks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully export user data", async () => {
    vi.mocked(validateRequest).mockResolvedValue({
      user: mockUser,
      session: { id: "session123" } as any,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await exportUserData();

    expect(result.success).toBe(true);
    expect(result.message).toBe("Data exported successfully");
    expect(result.data).toBeDefined();
    expect(result.data?.passwordHash).toBeUndefined();
    expect(result.data?.sessions).toBeUndefined();
  });

  it("should fail if user is not authenticated", async () => {
    vi.mocked(validateRequest).mockResolvedValue({
      user: null,
      session: null,
    });

    const result = await exportUserData();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(validateRequest).mockResolvedValue({
      user: mockUser,
      session: { id: "session123" } as any,
    });

    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("Database error"));

    const result = await exportUserData();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Database error");
  });
}); 