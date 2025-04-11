import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/clear-unverified-users/route";
import prisma from "@/lib/prisma";

// --- Mocks ---
vi.mock("@/lib/prisma", () => {
  const mockUserFindMany = vi.fn();
  const mockUserDeleteMany = vi.fn();
  const mockEmailVerificationFindMany = vi.fn();
  const mockEmailVerificationDeleteMany = vi.fn();
  return {
    __esModule: true,
    default: {
      user: {
        findMany: mockUserFindMany,
        deleteMany: mockUserDeleteMany,
      },
      emailVerification: {
        findMany: mockEmailVerificationFindMany,
        deleteMany: mockEmailVerificationDeleteMany,
      },
    },
    // Export mocks for use in tests
    _mockUserFindMany: mockUserFindMany,
    _mockUserDeleteMany: mockUserDeleteMany,
    _mockEmailVerificationFindMany: mockEmailVerificationFindMany,
    _mockEmailVerificationDeleteMany: mockEmailVerificationDeleteMany,
  };
});

// --- Test Suite ---
describe("API Route: GET /api/clear-unverified-users", () => {
  const cronSecret = "test-cron-secret";
  const correctAuthHeader = `Bearer ${cronSecret}`;
  const incorrectAuthHeader = "Bearer wrong-secret";
  const fourteenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);

  beforeEach(async () => {
    // Import mocks dynamically *after* vi.mock
    const {
      _mockUserFindMany,
      _mockUserDeleteMany,
      _mockEmailVerificationFindMany,
      _mockEmailVerificationDeleteMany,
    } = (await import("@/lib/prisma")) as any;

    vi.useFakeTimers(); // Use fake timers for consistent Date checks
    vi.setSystemTime(new Date()); // Set a consistent time

    vi.resetAllMocks();
    // Clear imported mocks explicitly
    _mockUserFindMany.mockClear();
    _mockUserDeleteMany.mockClear();
    _mockEmailVerificationFindMany.mockClear();
    _mockEmailVerificationDeleteMany.mockClear();

    process.env.CRON_SECRET = cronSecret;

    // Default mocks: No users or tokens to delete
    _mockUserFindMany.mockResolvedValue([]);
    _mockUserDeleteMany.mockResolvedValue({ count: 0 });
    _mockEmailVerificationFindMany.mockResolvedValue([]);
    _mockEmailVerificationDeleteMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.useRealTimers(); // Restore real timers
  });

  // Helper to create request
  const createRequest = (authHeader?: string) => {
    const headers = new Headers();
    if (authHeader) {
      headers.set("Authorization", authHeader);
    }
    return new NextRequest("http://localhost/api/clear-unverified-users", {
      headers,
    });
  };

  // Helper to parse JSON response from `new Response(JSON.stringify(...))`
  const parseBody = async (response: Response) => {
    try {
      return JSON.parse(await response.text());
    } catch (e) {
      console.error("Failed to parse JSON response body", e);
      return null; // Or throw, depending on how strict tests should be
    }
  };

  // --- Authentication Tests ---
  it("should return 401 if Authorization header is missing", async () => {
    const { _mockUserFindMany } = (await import("@/lib/prisma")) as any;
    const request = createRequest();
    const response = await GET(request);
    const body = await parseBody(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(_mockUserFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if Authorization header is incorrect", async () => {
    const { _mockUserFindMany } = (await import("@/lib/prisma")) as any;
    const request = createRequest(incorrectAuthHeader);
    const response = await GET(request);
    const body = await parseBody(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(_mockUserFindMany).not.toHaveBeenCalled();
  });

  // --- Functionality: User Deletion ---
  it("should call user.findMany with correct filters", async () => {
    const { _mockUserFindMany } = (await import("@/lib/prisma")) as any;
    const request = createRequest(correctAuthHeader);
    await GET(request);

    expect(_mockUserFindMany).toHaveBeenCalledTimes(1);
    expect(_mockUserFindMany).toHaveBeenCalledWith({
      where: {
        isVerified: false,
        googleId: null,
        createdAt: {
          lte: expect.any(Date), // Check that it uses a Date object
          // Optional: Check the date is close to 14 days ago if precision matters
          // lte: expect.closeToTime(fourteenDaysAgo)
        },
      },
      select: {
        id: true,
      },
    });
  });

  it("should not call user.deleteMany if no old unverified users are found", async () => {
    const { _mockUserFindMany, _mockUserDeleteMany } = (await import(
      "@/lib/prisma"
    )) as any;
    _mockUserFindMany.mockResolvedValue([]);
    const request = createRequest(correctAuthHeader);
    await GET(request);

    expect(_mockUserDeleteMany).not.toHaveBeenCalled();
  });

  it("should call user.deleteMany with correct IDs if old unverified users are found", async () => {
    const { _mockUserFindMany, _mockUserDeleteMany } = (await import(
      "@/lib/prisma"
    )) as any;
    const usersToDelete = [{ id: "user1" }, { id: "user2" }];
    _mockUserFindMany.mockResolvedValue(usersToDelete);
    const request = createRequest(correctAuthHeader);
    await GET(request);

    expect(_mockUserDeleteMany).toHaveBeenCalledTimes(1);
    expect(_mockUserDeleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: usersToDelete.map((u) => u.id),
        },
      },
    });
  });

  // --- Functionality: Token Deletion (Redundant Logic) ---
  it("should call emailVerification.findMany with correct date filter", async () => {
    const { _mockEmailVerificationFindMany } = (await import(
      "@/lib/prisma"
    )) as any;
    const request = createRequest(correctAuthHeader);
    await GET(request);

    expect(_mockEmailVerificationFindMany).toHaveBeenCalledTimes(1);
    expect(_mockEmailVerificationFindMany).toHaveBeenCalledWith({
      where: {
        expiresAt: {
          lte: expect.any(Date),
        },
      },
      select: {
        id: true,
      },
    });
  });

  it("should not call emailVerification.deleteMany if no expired tokens are found", async () => {
    const { _mockEmailVerificationFindMany, _mockEmailVerificationDeleteMany } =
      (await import("@/lib/prisma")) as any;
    _mockEmailVerificationFindMany.mockResolvedValue([]);
    const request = createRequest(correctAuthHeader);
    await GET(request);

    expect(_mockEmailVerificationDeleteMany).not.toHaveBeenCalled();
  });

  it("should call emailVerification.deleteMany with correct IDs if expired tokens are found", async () => {
    const { _mockEmailVerificationFindMany, _mockEmailVerificationDeleteMany } =
      (await import("@/lib/prisma")) as any;
    const tokensToDelete = [{ id: "token1" }];
    _mockEmailVerificationFindMany.mockResolvedValue(tokensToDelete);
    const request = createRequest(correctAuthHeader);
    await GET(request);

    expect(_mockEmailVerificationDeleteMany).toHaveBeenCalledTimes(1);
    expect(_mockEmailVerificationDeleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: tokensToDelete.map((t) => t.id),
        },
      },
    });
  });

  // --- Combined Success Response ---
  it("should return correct message when both users and tokens are deleted", async () => {
    const {
      _mockUserFindMany,
      _mockEmailVerificationFindMany,
      _mockUserDeleteMany,
      _mockEmailVerificationDeleteMany,
    } = (await import("@/lib/prisma")) as any;
    const usersToDelete = [{ id: "user1" }];
    const tokensToDelete = [{ id: "token1" }, { id: "token2" }];
    _mockUserFindMany.mockResolvedValue(usersToDelete);
    _mockEmailVerificationFindMany.mockResolvedValue(tokensToDelete);
    _mockUserDeleteMany.mockResolvedValue({ count: usersToDelete.length }); // Mock the count
    _mockEmailVerificationDeleteMany.mockResolvedValue({
      count: tokensToDelete.length,
    });

    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await parseBody(response);

    expect(response.status).toBe(200);
    expect(body.message).toBe(
      `${tokensToDelete.length} expired verification token(s) and ${usersToDelete.length} unverified user(s) deleted..`,
    );
  });

  // --- Error Handling ---
  it("should return 500 if user.findMany throws", async () => {
    const {
      _mockUserFindMany,
      _mockUserDeleteMany,
      _mockEmailVerificationFindMany,
    } = (await import("@/lib/prisma")) as any;
    const dbError = new Error("User FindMany Failed");
    _mockUserFindMany.mockRejectedValue(dbError);
    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await parseBody(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(_mockUserDeleteMany).not.toHaveBeenCalled();
    expect(_mockEmailVerificationFindMany).not.toHaveBeenCalled(); // Should stop before token logic
  });

  it("should return 500 if user.deleteMany throws", async () => {
    const {
      _mockUserFindMany,
      _mockUserDeleteMany,
      _mockEmailVerificationFindMany,
    } = (await import("@/lib/prisma")) as any;
    const usersToDelete = [{ id: "user1" }];
    _mockUserFindMany.mockResolvedValue(usersToDelete);
    const dbError = new Error("User DeleteMany Failed");
    _mockUserDeleteMany.mockRejectedValue(dbError);
    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await parseBody(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(_mockEmailVerificationFindMany).not.toHaveBeenCalled(); // Should stop before token logic
  });

  it("should return 500 if emailVerification.findMany throws", async () => {
    const { _mockEmailVerificationFindMany, _mockEmailVerificationDeleteMany } =
      (await import("@/lib/prisma")) as any;
    const dbError = new Error("Token FindMany Failed");
    _mockEmailVerificationFindMany.mockRejectedValue(dbError);
    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await parseBody(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(_mockEmailVerificationDeleteMany).not.toHaveBeenCalled();
  });

  it("should return 500 if emailVerification.deleteMany throws", async () => {
    const { _mockEmailVerificationFindMany, _mockEmailVerificationDeleteMany } =
      (await import("@/lib/prisma")) as any;
    const tokensToDelete = [{ id: "token1" }];
    _mockEmailVerificationFindMany.mockResolvedValue(tokensToDelete);
    const dbError = new Error("Token DeleteMany Failed");
    _mockEmailVerificationDeleteMany.mockRejectedValue(dbError);
    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await parseBody(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
