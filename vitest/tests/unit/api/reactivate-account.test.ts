import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";

// Mock dependencies
// Reactivation now verifies the account password, so bcrypt must be mocked.
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stream", () => ({
  default: {
    upsertUser: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("POST /api/users/reactivate-account", () => {
  const mockUser = {
    id: "user123",
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    passwordHash: "hashedPassword",
    deletedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Deleted 1 day ago
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // The route proves ownership with the password before reactivating.
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  it("should successfully reactivate user account", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
    vi.mocked(streamServerClient.upsertUser).mockResolvedValue({} as any);

    const { POST } = await import("@/app/api/users/reactivate-account/route");

    const request = new NextRequest(
      "http://localhost:3000/api/users/reactivate-account",
      {
        method: "POST",
        body: JSON.stringify({
          userId: "user123",
          password: "correct-password",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Account reactivated successfully");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: { deletedAt: null },
    });
  });

  it("should fail if userId is missing", async () => {
    const { POST } = await import("@/app/api/users/reactivate-account/route");

    const request = new NextRequest(
      "http://localhost:3000/api/users/reactivate-account",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("User ID and password are required");
  });

  it("should fail if user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/users/reactivate-account/route");

    const request = new NextRequest(
      "http://localhost:3000/api/users/reactivate-account",
      {
        method: "POST",
        body: JSON.stringify({
          userId: "nonexistent",
          password: "correct-password",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("User not found");
  });

  it("should fail if account is not deleted", async () => {
    const activeUser = { ...mockUser, deletedAt: null };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as any);

    const { POST } = await import("@/app/api/users/reactivate-account/route");

    const request = new NextRequest(
      "http://localhost:3000/api/users/reactivate-account",
      {
        method: "POST",
        body: JSON.stringify({
          userId: "user123",
          password: "correct-password",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Account is not deleted");
  });

  it("should fail if grace period has expired", async () => {
    const oldDeletedUser = {
      ...mockUser,
      deletedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // Deleted 100 days ago
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(oldDeletedUser as any);

    const { POST } = await import("@/app/api/users/reactivate-account/route");

    const request = new NextRequest(
      "http://localhost:3000/api/users/reactivate-account",
      {
        method: "POST",
        body: JSON.stringify({
          userId: "user123",
          password: "correct-password",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Account reactivation period has expired");
  });

  it("should handle StreamChat errors gracefully", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
    vi.mocked(streamServerClient.upsertUser).mockRejectedValue(
      new Error("StreamChat error"),
    );

    const { POST } = await import("@/app/api/users/reactivate-account/route");

    const request = new NextRequest(
      "http://localhost:3000/api/users/reactivate-account",
      {
        method: "POST",
        body: JSON.stringify({
          userId: "user123",
          password: "correct-password",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Account reactivated successfully");
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(
      new Error("Database error"),
    );

    const { POST } = await import("@/app/api/users/reactivate-account/route");

    const request = new NextRequest(
      "http://localhost:3000/api/users/reactivate-account",
      {
        method: "POST",
        body: JSON.stringify({
          userId: "user123",
          password: "correct-password",
        }),
      },
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Database error");
  });
});
