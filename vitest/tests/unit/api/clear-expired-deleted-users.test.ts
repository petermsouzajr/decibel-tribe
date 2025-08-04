import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stream", () => ({
  default: {
    deleteUser: vi.fn(),
  },
}));

describe("POST /api/clear-expired-deleted-users", () => {
  const mockExpiredUsers = [
    {
      id: "user1",
      username: "expired1",
      deletedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
    },
    {
      id: "user2", 
      username: "expired2",
      deletedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), // 95 days ago
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully delete expired users from database and StreamChat", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockExpiredUsers as any);
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any);
    vi.mocked(streamServerClient.deleteUser).mockResolvedValue({} as any);

    // Import the route handler
    const { POST } = await import("@/app/api/clear-expired-deleted-users/route");
    
    const request = new NextRequest("http://localhost:3000/api/clear-expired-deleted-users", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deletedCount).toBe(2);
    expect(data.streamChatDeletedCount).toBe(2);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: {
          lt: expect.any(Date), // Should be 90 days ago
        },
      },
      select: {
        id: true,
        username: true,
        deletedAt: true,
      },
    });
  });

  it("should handle no expired users gracefully", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const { POST } = await import("@/app/api/clear-expired-deleted-users/route");
    
    const request = new NextRequest("http://localhost:3000/api/clear-expired-deleted-users", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deletedCount).toBe(0);
    expect(data.streamChatDeletedCount).toBe(0);
  });

  it("should handle StreamChat errors gracefully", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockExpiredUsers as any);
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any);
    vi.mocked(streamServerClient.deleteUser)
      .mockResolvedValueOnce({} as any) // First user succeeds
      .mockRejectedValueOnce(new Error("StreamChat error")); // Second user fails

    const { POST } = await import("@/app/api/clear-expired-deleted-users/route");
    
    const request = new NextRequest("http://localhost:3000/api/clear-expired-deleted-users", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deletedCount).toBe(2); // Both users deleted from database
    expect(data.streamChatDeletedCount).toBe(1); // Only one deleted from StreamChat
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("Database error"));

    const { POST } = await import("@/app/api/clear-expired-deleted-users/route");
    
    const request = new NextRequest("http://localhost:3000/api/clear-expired-deleted-users", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("should handle individual user deletion errors", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockExpiredUsers as any);
    vi.mocked(prisma.user.delete)
      .mockResolvedValueOnce({} as any) // First user succeeds
      .mockRejectedValueOnce(new Error("Database error")); // Second user fails
    vi.mocked(streamServerClient.deleteUser).mockResolvedValue({} as any);

    const { POST } = await import("@/app/api/clear-expired-deleted-users/route");
    
    const request = new NextRequest("http://localhost:3000/api/clear-expired-deleted-users", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deletedCount).toBe(1); // Only one user deleted successfully from database
    expect(data.streamChatDeletedCount).toBe(2); // Both users deleted from StreamChat (before DB error)
  });
}); 