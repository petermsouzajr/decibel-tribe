import { describe, it, expect, vi, beforeEach, Mock, afterEach } from "vitest";
import { NextRequest } from "next/server";
// Remove direct imports of mocked modules
// import { cookies } from "next/headers";
// import prisma from "@/lib/prisma";
// import { lucia } from "@/auth";
import { NotificationCountInfo } from "@/lib/types";

// --- Define Persistent Mock Functions for Cookies ---
let mockCookiesGet: Mock = vi.fn();
let mockCookiesSet: Mock = vi.fn();

// --- Top-Level Let Variables for Other Mock Functions ---
let mockLuciaValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockNotificationCount: Mock;

// --- Mock Dependencies BEFORE Imports ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    notification: {
      count: vi.fn(), // Return vi.fn() directly
    },
  },
}));

vi.mock("@/auth", () => ({
  lucia: {
    sessionCookieName: "auth_session",
    validateSession: vi.fn(), // Return vi.fn() directly
    createBlankSessionCookie: vi.fn(), // Return vi.fn() directly
    createSessionCookie: vi.fn(), // Return vi.fn() directly
  },
}));

// --- Import Mocked Modules to Access Mock Functions ---
import prisma from "@/lib/prisma";
import { lucia } from "@/auth";

// --- Import Route Handler AFTER Mocks ---
import { GET } from "@/app/api/notifications/unread-count/route";

// --- Test Suite ---
describe("GET /api/notifications/unread-count", () => {
  // --- Constants ---
  const loggedInUser = { id: "user-1", username: "testuser" };
  const sessionData = { id: "valid-session-id", fresh: false };
  const freshSessionData = { ...sessionData, fresh: true };
  const mockBlankCookie = {
    name: "auth_session",
    value: "",
    attributes: { expires: expect.any(Date) }, // Use expect.any for date
  };
  const newSessionCookie = {
    name: "auth_session",
    value: "new-session-id",
    attributes: {},
  };

  let request: NextRequest;

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    // Reset persistent cookie mocks specifically
    mockCookiesGet.mockReset();
    mockCookiesSet.mockReset();

    // Assign mocks to top-level variables
    mockLuciaValidateSession = lucia.validateSession as Mock;
    mockCreateBlankSessionCookie = lucia.createBlankSessionCookie as Mock;
    mockCreateSessionCookie = lucia.createSessionCookie as Mock;
    mockNotificationCount = prisma.notification.count as Mock;

    // --- Set Default Mock Behaviors ---
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: loggedInUser,
      session: sessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(newSessionCookie);
    mockNotificationCount.mockResolvedValue(0); // Default to 0 count
  });

  afterEach(() => {
    // vi.clearAllMocks(); // Can be removed if resetAllMocks is used in beforeEach
  });

  // Use a simple mock request as URL params aren't used
  const createMockRequest = (): NextRequest => {
    const url = new URL("http://localhost/api/notifications/unread-count");
    return new NextRequest(url);
  };

  // --- Test Cases ---
  it("should return 401 if no session cookie is found", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue(undefined);
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).not.toHaveBeenCalled();
    expect(mockNotificationCount).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "invalid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401); // Expect 401 now
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("invalid_session_id");
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockBlankCookie.name,
      mockBlankCookie.value,
      mockBlankCookie.attributes,
    );
    expect(mockNotificationCount).not.toHaveBeenCalled();
  });

  it("should return 401 if user is not found even with a valid session", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: null, // Simulate user not found despite valid session ID
      session: sessionData,
    });
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401); // Expect 401 now
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid-session-id");
    expect(mockNotificationCount).not.toHaveBeenCalled();
  });

  it("should set a new cookie if the session is fresh", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: loggedInUser,
      session: freshSessionData, // Fresh session
    });
    // mockNotificationCount defaults to 0 in beforeEach
    request = createMockRequest();

    // Act
    await GET(request);

    // Assert
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid-session-id");
    expect(mockCreateSessionCookie).toHaveBeenCalledWith(
      // Check session cookie created
      freshSessionData.id,
    );
    expect(mockCookiesSet).toHaveBeenCalledWith(
      // Check session cookie set
      newSessionCookie.name,
      newSessionCookie.value,
      newSessionCookie.attributes,
    );
    // Ensure the count was still attempted
    expect(mockNotificationCount).toHaveBeenCalled();
  });

  it("should return the unread notification count successfully", async () => {
    // Arrange
    // Removed await import
    const expectedCount = 5;
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    // mockLuciaValidateSession defaults to valid non-fresh session
    mockNotificationCount.mockResolvedValue(expectedCount);
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body: NotificationCountInfo = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid-session-id");
    expect(mockNotificationCount).toHaveBeenCalledWith({
      where: {
        recipientId: loggedInUser.id,
        read: false,
      },
    });
    expect(body.unreadCount).toBe(expectedCount);
  });

  it("should return 500 if prisma query fails", async () => {
    // Arrange
    // Removed await import
    const error = new Error("Database error");
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    // mockLuciaValidateSession defaults to valid session
    mockNotificationCount.mockRejectedValue(error);
    request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500); // Expect 500 now
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid-session-id");
    expect(body).toEqual({ error: "Internal server error" });
    expect(mockNotificationCount).toHaveBeenCalled(); // Ensure it was called
  });
});

// Removed redundant mockSessionValidation helper
