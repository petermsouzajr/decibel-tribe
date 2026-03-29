import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import type { GET as GETType } from "@/app/api/send-verification/route";

// --- Mock Variable Declarations ---
let mockCookiesSet: Mock;
let mockEmailVerificationFindFirst: Mock;
let mockUserUpdate: Mock;
let mockEmailVerificationDelete: Mock;
let mockLuciaCreateSession: Mock;
let mockLuciaCreateSessionCookie: Mock;

// --- Helper Type ---
type ApiHandler = (request: NextRequest) => Promise<Response>;

// --- Test Suite ---
describe("API Route: GET /api/send-verification", () => {
  const validToken = "valid-verification-token";
  const invalidToken = "invalid-token";
  const expiredToken = "expired-token";
  const userId = "user-to-verify";
  const verificationRecordId = "verification-record-id";
  const baseUrl = "http://localhost:3000";
  const redirectUrl = new URL("/", baseUrl).toString();
  const sessionId = "new-session-id";
  const sessionCookie = {
    name: "auth_session",
    value: "mock-session-value",
    attributes: {},
  };

  // Define handler variable
  let GET: ApiHandler;

  beforeEach(async () => {
    // 1. Reset mocks and modules
    vi.resetAllMocks();
    vi.resetModules();

    // 2. Define mock implementations
    mockCookiesSet = vi.fn();
    mockEmailVerificationFindFirst = vi.fn();
    mockUserUpdate = vi.fn();
    mockEmailVerificationDelete = vi.fn();
    mockLuciaCreateSession = vi.fn();
    mockLuciaCreateSessionCookie = vi.fn();

    // 3. Apply mocks using vi.doMock
    vi.doMock("next/headers", () => ({
      cookies: vi.fn(() => ({ set: mockCookiesSet })),
    }));

    vi.doMock("@/lib/prisma", () => ({
      default: {
        emailVerification: {
          findFirst: mockEmailVerificationFindFirst,
          delete: mockEmailVerificationDelete,
        },
        user: {
          update: mockUserUpdate,
        },
      },
    }));

    vi.doMock("@/auth", () => ({
      lucia: {
        createSession: mockLuciaCreateSession,
        createSessionCookie: mockLuciaCreateSessionCookie,
      },
    }));

    // 4. Set default mock behaviors
    mockEmailVerificationFindFirst.mockResolvedValue({
      id: verificationRecordId,
      userId,
      token: validToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    mockUserUpdate.mockResolvedValue({ id: userId, isEmailVerified: true });
    mockEmailVerificationDelete.mockResolvedValue({});
    mockLuciaCreateSession.mockResolvedValue({ id: sessionId });
    mockLuciaCreateSessionCookie.mockReturnValue(sessionCookie);

    // 5. Dynamically import the module
    const mod = await import("@/app/api/send-verification/route");
    GET = mod.GET;
  });

  const createRequest = (token?: string) => {
    const url = new URL(baseUrl + "/api/send-verification");
    if (token) {
      url.searchParams.set("token", token);
    }
    return new NextRequest(url.toString());
  };

  it("should redirect to / if token is missing", async () => {
    const request = createRequest();
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(redirectUrl);
    expect(mockEmailVerificationFindFirst).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("should redirect to / if token is not found in DB", async () => {
    mockEmailVerificationFindFirst.mockResolvedValue(null);
    const request = createRequest(invalidToken);
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(redirectUrl);
    expect(mockEmailVerificationFindFirst).toHaveBeenCalledWith({
      where: {
        token: invalidToken,
        expiresAt: { gte: expect.any(Date) },
      },
    });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("should redirect to / if token is expired (DB check)", async () => {
    mockEmailVerificationFindFirst.mockResolvedValue(null);
    const request = createRequest(expiredToken);
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(redirectUrl);
    expect(mockEmailVerificationFindFirst).toHaveBeenCalledWith({
      where: {
        token: expiredToken,
        expiresAt: { gte: expect.any(Date) },
      },
    });
  });

  it("should update user, delete token, create session, set cookie, and redirect on valid token", async () => {
    const request = createRequest(validToken);
    const response = await GET(request);

    expect(mockEmailVerificationFindFirst).toHaveBeenCalledTimes(1);
    expect(mockEmailVerificationFindFirst).toHaveBeenCalledWith({
      where: { token: validToken, expiresAt: { gte: expect.any(Date) } },
    });
    expect(mockUserUpdate).toHaveBeenCalledTimes(1);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
    expect(mockEmailVerificationDelete).toHaveBeenCalledTimes(1);
    expect(mockEmailVerificationDelete).toHaveBeenCalledWith({
      where: { id: verificationRecordId },
    });

    expect(mockLuciaCreateSession).toHaveBeenCalledTimes(1);
    expect(mockLuciaCreateSession).toHaveBeenCalledWith(userId, {});
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledTimes(1);
    expect(mockLuciaCreateSessionCookie).toHaveBeenCalledWith(sessionId);

    expect(mockCookiesSet).toHaveBeenCalledTimes(1);
    expect(mockCookiesSet).toHaveBeenCalledWith(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(redirectUrl);
  });

  it("should redirect to / if prisma.emailVerification.findFirst throws", async () => {
    const dbError = new Error("DB Find Error");
    mockEmailVerificationFindFirst.mockRejectedValue(dbError);
    const request = createRequest(validToken);
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(redirectUrl);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("should redirect to / if prisma.user.update throws", async () => {
    const dbError = new Error("DB Update Error");
    mockUserUpdate.mockRejectedValue(dbError);
    const request = createRequest(validToken);
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(redirectUrl);
    expect(mockEmailVerificationDelete).not.toHaveBeenCalled();
  });

  it("should redirect to / if prisma.emailVerification.delete throws", async () => {
    const dbError = new Error("DB Delete Error");
    mockEmailVerificationDelete.mockRejectedValue(dbError);
    const request = createRequest(validToken);
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(redirectUrl);
    expect(mockLuciaCreateSession).not.toHaveBeenCalled();
  });

  it("should redirect to / if lucia.createSessionCookie throws", async () => {
    const cookieError = new Error("Cookie Creation Error");
    mockLuciaCreateSession.mockResolvedValue({ id: sessionId });
    mockLuciaCreateSessionCookie.mockImplementation(() => {
      throw cookieError;
    });
    const request = createRequest(validToken);
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(redirectUrl);
    expect(mockCookiesSet).not.toHaveBeenCalled();
  });
});
