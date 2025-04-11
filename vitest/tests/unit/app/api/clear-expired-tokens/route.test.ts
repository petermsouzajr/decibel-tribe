import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// --- Mocks ---
let _mockEmailVerificationFindMany: Mock;
let _mockEmailVerificationDeleteMany: Mock;

vi.mock("@/lib/prisma", async () => {
  _mockEmailVerificationFindMany = vi.fn();
  _mockEmailVerificationDeleteMany = vi.fn();
  return {
    default: {
      emailVerification: {
        findMany: _mockEmailVerificationFindMany,
        deleteMany: _mockEmailVerificationDeleteMany,
      },
    },
  };
});

// --- Test Suite ---
describe("API Route: GET /api/clear-expired-tokens", async () => {
  const { GET } = await import("@/app/api/clear-expired-tokens/route");

  const cronSecret = "test-cron-secret";
  const correctAuthHeader = `Bearer ${cronSecret}`;
  const incorrectAuthHeader = "Bearer wrong-secret";

  beforeEach(() => {
    vi.resetAllMocks();
    // Mock environment variable
    process.env.CRON_SECRET = cronSecret;

    // Default mock implementations (can be overridden in tests)
    _mockEmailVerificationFindMany.mockResolvedValue([]);
    _mockEmailVerificationDeleteMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  // Helper to create request with headers
  const createRequest = (authHeader?: string) => {
    const headers = new Headers();
    if (authHeader) {
      headers.set("Authorization", authHeader);
    }
    return new NextRequest("http://localhost/api/clear-expired-tokens", {
      headers,
    });
  };

  // --- Authentication Tests ---
  it("should return 401 if Authorization header is missing", async () => {
    const request = createRequest(); // No auth header
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(_mockEmailVerificationFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if Authorization header is incorrect", async () => {
    const request = createRequest(incorrectAuthHeader);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(_mockEmailVerificationFindMany).not.toHaveBeenCalled();
  });

  it("should proceed if Authorization header is correct", async () => {
    const request = createRequest(correctAuthHeader);
    await GET(request); // We only care that it doesn't throw 401 here

    expect(_mockEmailVerificationFindMany).toHaveBeenCalled(); // Indicates it passed auth
  });

  // --- Functionality Tests ---
  it("should call findMany with correct date filter", async () => {
    const request = createRequest(correctAuthHeader);
    await GET(request);

    expect(_mockEmailVerificationFindMany).toHaveBeenCalledTimes(1);
    expect(_mockEmailVerificationFindMany).toHaveBeenCalledWith({
      where: {
        expiresAt: {
          lte: expect.any(Date), // Check that it uses a Date object
        },
      },
      select: {
        id: true,
      },
    });
  });

  it("should not call deleteMany and return 0 count if no expired tokens are found", async () => {
    _mockEmailVerificationFindMany.mockResolvedValue([]); // Simulate no results
    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("0 expired verification token(s) deleted.");
    expect(_mockEmailVerificationDeleteMany).not.toHaveBeenCalled();
  });

  it("should call deleteMany with correct IDs and return count if expired tokens are found", async () => {
    const expiredTokens = [{ id: "expired1" }, { id: "expired2" }];
    const expectedDeletedCount = expiredTokens.length;
    _mockEmailVerificationFindMany.mockResolvedValue(expiredTokens);
    _mockEmailVerificationDeleteMany.mockResolvedValue({
      count: expectedDeletedCount,
    });

    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(
      `${expectedDeletedCount} expired verification token(s) deleted.`,
    );
    expect(_mockEmailVerificationDeleteMany).toHaveBeenCalledTimes(1);
    expect(_mockEmailVerificationDeleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: expiredTokens.map((t) => t.id),
        },
      },
    });
  });

  // --- Error Handling ---
  it("should return 500 if findMany throws an error", async () => {
    const dbError = new Error("FindMany Failed");
    _mockEmailVerificationFindMany.mockRejectedValue(dbError);
    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await response.json();

    // The original route stringifies the error message, so we expect a stringified JSON
    expect(response.status).toBe(500);
    expect(JSON.parse(body)).toEqual({ error: "Internal server error" });
    expect(_mockEmailVerificationDeleteMany).not.toHaveBeenCalled();
  });

  it("should return 500 if deleteMany throws an error", async () => {
    const expiredTokens = [{ id: "expired1" }];
    _mockEmailVerificationFindMany.mockResolvedValue(expiredTokens);
    const dbError = new Error("DeleteMany Failed");
    _mockEmailVerificationDeleteMany.mockRejectedValue(dbError);

    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.parse(body)).toEqual({ error: "Internal server error" });
  });
});
