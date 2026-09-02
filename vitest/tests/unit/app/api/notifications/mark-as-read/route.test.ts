import { describe, it, expect, vi, beforeEach, Mock, afterEach } from "vitest";
import { NextRequest } from "next/server";
// Removed imports handled below
// import { cookies } from "next/headers";
// import prisma from "@/lib/prisma";
// import { lucia } from "@/auth";

// --- Define Persistent Mock Functions for Cookies ---
let mockCookiesGet: Mock = vi.fn();
let mockCookiesSet: Mock = vi.fn();

// --- Top-Level Let Variables for Other Mock Functions ---
let mockLuciaValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockNotificationUpdateMany: Mock;

// --- Mock Dependencies BEFORE Imports ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    notification: {
      updateMany: vi.fn(), // Return vi.fn() directly
    },
  },
}));

vi.mock("@/auth", () => {
  // Hoisted so the helper below and lucia.validateSession share one mock.
  const validateSessionMock = vi.fn();
  return {
    // Routes call this helper (src/auth.ts) instead of lucia directly.
    validateRequestWithCookieMutation: vi.fn(
      async () => (await validateSessionMock()) ?? { user: null, session: null },
    ),
    lucia: {
      sessionCookieName: "auth_session",
      validateSession: validateSessionMock,
      createBlankSessionCookie: vi.fn(), // Return vi.fn() directly
      createSessionCookie: vi.fn(), // Return vi.fn() directly
    },
  };
});

// --- Import Mocked Modules to Access Mock Functions ---
import prisma from "@/lib/prisma";
import { lucia } from "@/auth";

// --- Import Route Handler AFTER Mocks ---
import { PATCH } from "@/app/api/notifications/mark-as-read/route";

// --- Test Suite ---
describe("PATCH /api/notifications/mark-as-read", () => {
  // --- Constants ---
  const loggedInUser = { id: "user-1", username: "testuser" };
  const sessionData = { id: "valid-session-id", fresh: false };
  const freshSessionData = { ...sessionData, fresh: true };
  const mockBlankCookie = {
    name: "auth_session",
    value: "",
    attributes: { expires: expect.any(Date) },
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
    mockNotificationUpdateMany = prisma.notification.updateMany as Mock;

    // --- Set Default Mock Behaviors ---
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: loggedInUser,
      session: sessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(newSessionCookie);
    mockNotificationUpdateMany.mockResolvedValue({ count: 3 }); // Default success
  });

  // Use a simple mock request as URL params/body aren't used
  const createMockRequest = (): NextRequest => {
    const url = new URL("http://localhost/api/notifications/mark-as-read");
    return new NextRequest(url, { method: "PATCH" });
  };

  // --- Test Cases ---
  it("should return 401 if no session cookie is found", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue(undefined);
    request = createMockRequest();

    // Act
    const response = await PATCH(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).not.toHaveBeenCalled();
    expect(mockNotificationUpdateMany).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "invalid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    request = createMockRequest();

    // Act
    const response = await PATCH(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("invalid_session_id");
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockBlankCookie.name,
      mockBlankCookie.value,
      mockBlankCookie.attributes,
    );
    expect(mockNotificationUpdateMany).not.toHaveBeenCalled();
  });

  it("should return 401 if user is not found even with a valid session", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: null, // Simulate user not found
      session: sessionData,
    });
    request = createMockRequest();

    // Act
    const response = await PATCH(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid-session-id");
    expect(mockNotificationUpdateMany).not.toHaveBeenCalled();
  });

  it("should set a new cookie if the session is fresh", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: loggedInUser,
      session: freshSessionData, // Use fresh session data
    });
    request = createMockRequest();

    // Act
    await PATCH(request);

    // Assert
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid-session-id");
    expect(mockCreateSessionCookie).toHaveBeenCalledWith(freshSessionData.id);
    expect(mockCookiesSet).toHaveBeenCalledWith(
      newSessionCookie.name,
      newSessionCookie.value,
      newSessionCookie.attributes,
    );
    // Check that the update was still attempted
    expect(mockNotificationUpdateMany).toHaveBeenCalled();
  });

  it("should mark notifications as read successfully", async () => {
    // Arrange
    // Removed await import
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    // Default mock behavior (valid non-fresh session) is already set in beforeEach
    request = createMockRequest();

    // Act
    const response = await PATCH(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid-session-id");
    expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
      where: {
        recipientId: loggedInUser.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    expect(body).toEqual({ message: "Notifications marked as read" });
  });

  it("should return 500 if prisma query fails", async () => {
    // Arrange
    // Removed await import
    const error = new Error("Database error");
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    // Default session is valid
    mockNotificationUpdateMany.mockRejectedValue(error);
    request = createMockRequest();

    // Act
    const response = await PATCH(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(mockCookiesGet).toHaveBeenCalledWith(lucia.sessionCookieName);
    expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid-session-id");
    expect(body).toEqual({ error: "Internal server error" });
    expect(mockNotificationUpdateMany).toHaveBeenCalled(); // Ensure it was called
  });
});
