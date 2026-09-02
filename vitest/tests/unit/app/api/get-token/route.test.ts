import { describe, it, expect, vi, beforeEach, Mock, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
// Remove static import of the route handler
// import { GET } from "@/app/api/get-token/route";
// Keep static import for types if needed, but remove direct usage where possible
// import { cookies } from "next/headers";
// import { lucia } from "@/auth";
// import { StreamChat } from "stream-chat";

// --- Define Mock Types (if needed, otherwise remove) ---
// It's often better to infer types or use Mock from vitest

// --- Declare Hoisted Mock Function Variables FIRST ---
const { mockCookiesGet, mockCookiesSet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockCookiesSet: vi.fn(),
}));
const { mockCreateToken, mockGetInstance } = vi.hoisted(() => ({
  mockCreateToken: vi.fn(),
  // Mock getInstance to return an object with the createToken mock
  mockGetInstance: vi.fn(() => ({ createToken: mockCreateToken })),
}));
const {
  mockLuciaValidateSession,
  mockCreateBlankSessionCookie,
  mockCreateSessionCookie,
} = vi.hoisted(() => ({
  mockLuciaValidateSession: vi.fn(),
  mockCreateBlankSessionCookie: vi.fn(),
  mockCreateSessionCookie: vi.fn(),
}));
const luciaSessionCookieName = "auth_session";

// --- Top-Level Mocks using vi.mock ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
}));

vi.mock("@/auth", () => ({
  // Routes call this helper (src/auth.ts) instead of lucia directly;
  // delegate to the validateSession mock this file already configures.
  validateRequestWithCookieMutation: vi.fn(
    async () => (await mockLuciaValidateSession()) ?? { user: null, session: null },
  ),
  lucia: {
    sessionCookieName: "auth_session", // Hardcode string literal
    validateSession: mockLuciaValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

vi.mock("stream-chat", () => ({
  // Mock the StreamChat class and its static getInstance method
  StreamChat: {
    getInstance: mockGetInstance,
  },
}));

// --- Import Route Handler AFTER Top-Level Mocks ---
import { GET } from "@/app/api/get-token/route";

// Helper function - Can reference hoisted mocks
// Helper to mock lucia session validation
const mockSessionValidation = (
  user: { id: string } | null,
  session: { id: string; fresh: boolean } | null,
) => {
  // Ensure mockLuciaValidateSession is assigned before calling this
  mockLuciaValidateSession?.mockResolvedValue({ user, session });
};

// --- Test Suite ---
describe("API Route: GET /api/get-token", () => {
  const loggedInUserId = "stream_user_1";
  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "session_stream_token", fresh: false };
  const mockFreshSessionData = { ...mockSessionData, fresh: true };
  const mockBlankCookieData = {
    name: luciaSessionCookieName,
    value: "",
    attributes: { expires: expect.any(Date) },
  };
  const mockNewSessionCookieData = {
    name: luciaSessionCookieName,
    value: "new-session-id",
    attributes: {},
  };
  const mockStreamToken = "mocked.stream.chat.token";

  let request: NextRequest;

  beforeEach(() => {
    // 1. Reset Mocks
    vi.resetAllMocks(); // Use resetAllMocks for simplicity

    // 2. Set environment variables
    process.env.NEXT_PUBLIC_STREAM_KEY = "test_stream_key";
    process.env.STREAM_SECRET = "test_stream_secret";

    // 3. Set Default Mock Behaviors
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookieData);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookieData);
    // Default behavior for Stream mocks (success)
    // mockGetInstance is already set up via vi.hoisted to return { createToken: mockCreateToken }
    mockCreateToken.mockReturnValue(mockStreamToken);

    // 4. Create the request
    request = new NextRequest("http://localhost/api/get-token");
  });

  afterEach(() => {
    // Clean up env variables
    delete process.env.NEXT_PUBLIC_STREAM_KEY;
    delete process.env.STREAM_SECRET;
    // Restore any spies if needed, though clearAllMocks often covers vi.spyOn reset
    vi.restoreAllMocks(); // Good practice if spies were used (like Date.now)
  });

  // --- Authentication Tests ---
  it("should return 401 if no session cookie is found", async () => {
    // Arrange: override default mock behaviors
    mockCookiesGet.mockReturnValue(undefined); // No cookie
    // Set validation mock explicitly for clarity, though default is overridden by cookie check
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLuciaValidateSession).not.toHaveBeenCalled(); // Should not be called if cookie missing
    expect(mockGetInstance).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    // Arrange: override default mock behaviors
    mockCookiesGet.mockReturnValue({ value: "invalid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null }); // Simulate validation failure

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("invalid_session_id");
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockBlankCookieData.name,
      mockBlankCookieData.value,
      mockBlankCookieData.attributes,
    );
    expect(mockGetInstance).not.toHaveBeenCalled();
  });

  it("should return 401 if user is null after session validation", async () => {
    // Arrange: override default mock behaviors
    mockLuciaValidateSession.mockResolvedValue({
      user: null,
      session: mockSessionData,
    }); // Session valid, user null

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
    expect(mockGetInstance).not.toHaveBeenCalled();
  });

  it("should set a new session cookie if session is fresh", async () => {
    // Arrange: override default mock behaviors
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockFreshSessionData,
    }); // Fresh session

    // Act
    await GET(request);

    // Assert
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
    expect(mockCreateSessionCookie).toHaveBeenCalledWith(
      mockFreshSessionData.id,
    );
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockNewSessionCookieData.name,
      mockNewSessionCookieData.value,
      mockNewSessionCookieData.attributes,
    );
    expect(mockGetInstance).toHaveBeenCalled();
    expect(mockCreateToken).toHaveBeenCalled();
  });

  // --- Functionality Tests ---
  it("should get Stream instance and create token successfully", async () => {
    // Arrange: beforeEach setup is sufficient
    const mockDateNow = Date.now();
    // Use spyOn within the test if needed, and restore it
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(mockDateNow);

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.token).toBe(mockStreamToken);
    expect(mockGetInstance).toHaveBeenCalledTimes(1);
    expect(mockGetInstance).toHaveBeenCalledWith(
      "test_stream_key",
      "test_stream_secret",
    );
    const expectedExpiration = Math.floor(mockDateNow / 1000) + 3600;
    expect(mockCreateToken).toHaveBeenCalledTimes(1);
    expect(mockCreateToken).toHaveBeenCalledWith(
      loggedInUserId,
      expectedExpiration,
    );

    // Restore spy used in this test
    dateSpy.mockRestore();
  });

  // --- Error Handling ---
  it("should return 500 if StreamChat.getInstance fails", async () => {
    // Arrange
    const instanceError = new Error("Failed to get Stream instance");
    // Override getInstance mock to throw
    mockGetInstance.mockImplementation(() => {
      throw instanceError;
    });

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(mockGetInstance).toHaveBeenCalled(); // It was called before throwing
    expect(mockCreateToken).not.toHaveBeenCalled(); // createToken should not be reached
  });

  it("should return 500 if streamClient.createToken fails", async () => {
    // Arrange
    const tokenError = new Error("Failed to create Stream token");
    // Override createToken mock to throw
    mockCreateToken.mockImplementation(() => {
      throw tokenError;
    });

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(mockGetInstance).toHaveBeenCalled();
    expect(mockCreateToken).toHaveBeenCalled(); // It was called before throwing
  });
});
// Ensure no leftover code outside describe block if applicable
