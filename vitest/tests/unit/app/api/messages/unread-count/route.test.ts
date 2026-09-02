import { describe, it, expect, vi, beforeEach, Mock, afterEach } from "vitest";
import { NextRequest } from "next/server";
// Remove direct imports of mocked modules
// import { cookies } from "next/headers";
// import { lucia } from "@/auth";
// import streamServerClient from "@/lib/stream";

// --- Declare Hoisted Mock Function Variables FIRST ---
// Use vi.hoisted to ensure these are available within vi.mock factories
const { mockCookiesGet, mockCookiesSet } = vi.hoisted(() => {
  return { mockCookiesGet: vi.fn(), mockCookiesSet: vi.fn() };
});
const {
  mockValidateSession,
  mockCreateBlankSessionCookie,
  mockCreateSessionCookie,
} = vi.hoisted(() => {
  return {
    mockValidateSession: vi.fn(),
    mockCreateBlankSessionCookie: vi.fn(),
    mockCreateSessionCookie: vi.fn(),
  };
});
const { mockStreamGetUnreadCount } = vi.hoisted(() => {
  return { mockStreamGetUnreadCount: vi.fn() };
});

// --- Top-Level Mocks using vi.mock ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
}));

vi.mock("@/auth", () => ({
  // Routes call this helper (src/auth.ts) instead of lucia directly;
  // delegate to the validateSession mock this file already configures.
  validateRequestWithCookieMutation: vi.fn(
    async () => (await mockValidateSession()) ?? { user: null, session: null },
  ),
  lucia: {
    sessionCookieName: "auth_session",
    validateSession: mockValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

vi.mock("@/lib/stream", () => ({
  default: {
    getUnreadCount: mockStreamGetUnreadCount,
  },
}));

// --- Import Route Handler AFTER Top-Level Mocks ---
import { GET } from "@/app/api/messages/unread-count/route";

// --- Define Mock Types (Can be after mocks) ---
type LuciaMock = {
  sessionCookieName: string;
  validateSession: Mock;
  createBlankSessionCookie: Mock;
  createSessionCookie: Mock;
};

type StreamClientMock = {
  getUnreadCount: Mock;
};

// --- Test Suite ---
describe("API Route: GET /api/messages/unread-count", () => {
  const testUserId = "user_unread_test";
  const mockUser = { id: testUserId };
  const mockSession = { id: "session_unread", fresh: false };
  const mockFreshSession = { ...mockSession, fresh: true };
  const mockBlankCookie = {
    name: "auth_session",
    value: "",
    attributes: { expires: expect.any(Date) }, // Use expect.any for dynamic date
  };
  const mockNewSessionCookie = {
    name: "auth_session",
    value: "new-session-id",
    attributes: {},
  };

  let request: NextRequest;

  beforeEach(() => {
    // Reset mocks before each test to clear calls and specific overrides
    vi.resetAllMocks();

    // --- Set Default Mock Behaviors for Success Path ---
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" }); // Default: valid session ID exists
    mockValidateSession.mockResolvedValue({
      user: mockUser,
      session: mockSession, // Default: valid, non-fresh session
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);
    mockStreamGetUnreadCount.mockResolvedValue({ total_unread_count: 0 }); // Default: success, 0 unread

    // Create request object
    request = new NextRequest("http://localhost/api/messages/unread-count");
  });

  // --- Authentication Tests ---
  it("should return 401 if no session cookie is found", async () => {
    // Arrange
    mockCookiesGet.mockReturnValue(undefined); // Override: No cookie

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockCookiesGet).toHaveBeenCalledWith("auth_session");
    expect(mockValidateSession).not.toHaveBeenCalled();
    expect(mockStreamGetUnreadCount).not.toHaveBeenCalled();
  });

  it("should return 401 and set blank cookie if session validation fails (no session)", async () => {
    // Arrange
    mockCookiesGet.mockReturnValue({ value: "invalid_session_id" }); // Provide an invalid ID
    mockValidateSession.mockResolvedValue({ user: null, session: null }); // Override: Validation failure

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockValidateSession).toHaveBeenCalledWith("invalid_session_id"); // Check validation was called
    expect(mockCreateBlankSessionCookie).toHaveBeenCalledTimes(1);
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockBlankCookie.name,
      mockBlankCookie.value,
      mockBlankCookie.attributes,
    );
    expect(mockStreamGetUnreadCount).not.toHaveBeenCalled();
  });

  it("should return 401 if session is valid but user is null", async () => {
    // Arrange
    mockValidateSession.mockResolvedValue({ user: null, session: mockSession }); // Override: Valid session, null user

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockValidateSession).toHaveBeenCalledWith("valid_session_id"); // Check validation was called
    expect(mockStreamGetUnreadCount).not.toHaveBeenCalled();
  });

  it("should set a new session cookie if session is fresh and proceed", async () => {
    // Arrange
    mockValidateSession.mockResolvedValue({
      user: mockUser,
      session: mockFreshSession, // Override: Fresh session
    });
    mockStreamGetUnreadCount.mockResolvedValue({ total_unread_count: 5 }); // Ensure success mock

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(200); // Should proceed to main logic
    expect(mockValidateSession).toHaveBeenCalledWith("valid_session_id");
    expect(mockCreateSessionCookie).toHaveBeenCalledWith(mockFreshSession.id);
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockNewSessionCookie.name,
      mockNewSessionCookie.value,
      mockNewSessionCookie.attributes,
    );
    expect(mockStreamGetUnreadCount).toHaveBeenCalled(); // Ensure main logic ran
  });

  // --- Functionality Tests ---
  it("should call streamClient.getUnreadCount with the correct user ID", async () => {
    // Arrange
    // Default mocks should handle success path

    // Act
    await GET(request);

    // Assert
    expect(mockStreamGetUnreadCount).toHaveBeenCalledTimes(1);
    expect(mockStreamGetUnreadCount).toHaveBeenCalledWith(testUserId);
  });

  it("should return 200 with the unread count on success", async () => {
    // Arrange
    const expectedCount = 15;
    mockStreamGetUnreadCount.mockResolvedValue({
      total_unread_count: expectedCount, // Override success value
    });

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual({ unreadCount: expectedCount });
  });

  // --- Error Handling ---
  it("should return 500 if lucia.validateSession throws", async () => {
    // Arrange
    const authError = new Error("Lucia crashed");
    mockValidateSession.mockRejectedValue(authError); // Override: Lucia throws

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(mockStreamGetUnreadCount).not.toHaveBeenCalled();
  });

  it("should return 500 if streamClient.getUnreadCount throws", async () => {
    // Arrange
    const streamError = new Error("Stream API error");
    mockStreamGetUnreadCount.mockRejectedValue(streamError); // Override: Stream throws

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
