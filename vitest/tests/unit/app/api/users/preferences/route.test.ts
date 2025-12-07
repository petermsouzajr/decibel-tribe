import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/users/preferences/route"; // Changed to alias path
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";
import prisma from "@/lib/prisma";
import { lucia } from "@/auth";

// Mock dependencies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    userPreferences: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  lucia: {
    validateSession: vi.fn(),
    createSessionCookie: vi.fn(() => ({
      name: "auth_session",
      value: "new_session_id",
      attributes: {},
    })),
    createBlankSessionCookie: vi.fn(() => ({
      name: "auth_session",
      value: "",
      attributes: { expires: new Date(0) },
    })),
    sessionCookieName: "auth_session",
  },
}));

// Helper to mock session validation
const mockSession = (user: any | null, session: any | null) => {
  (lucia.validateSession as Mock).mockResolvedValue({ user, session });
};

// Helper to mock cookie retrieval
const mockCookiesGet = (value: string | undefined) => {
  (cookies as Mock).mockReturnValue({
    get: vi.fn((name: string) =>
      name === "auth_session" ? { value } : undefined,
    ),
    set: vi.fn(), // Mock the set method as well
  });
};

describe("API Route: /api/users/preferences", () => {
  const mockUserId = "user_123";
  const mockUser = { id: mockUserId, username: "testuser" };
  const mockSessionData = {
    id: "session_abc",
    fresh: false,
    userId: mockUserId,
  };
  const mockFreshSessionData = { ...mockSessionData, fresh: true };
  const mockNewSessionCookie = {
    name: "auth_session",
    value: "new_session_id",
    attributes: {},
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default mocks for successful auth
    mockCookiesGet("valid_session_id");
    mockSession(mockUser, mockSessionData);
    ((cookies() as unknown as UnsafeUnwrappedCookies).set as Mock).mockClear(); // Clear set mock calls
  });

  // --- GET Handler Tests ---
  describe("GET /api/users/preferences", () => {
    it("should return 401 if no session cookie is found", async () => {
      mockCookiesGet(undefined);
      mockSession(null, null);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(lucia.validateSession).not.toHaveBeenCalled(); // Shouldn't even try to validate
    });

    it("should return 401 if session validation fails", async () => {
      mockCookiesGet("invalid_session_id");
      mockSession(null, null);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(lucia.validateSession).toHaveBeenCalledWith("invalid_session_id");
      expect(lucia.createBlankSessionCookie).toHaveBeenCalled();
      expect((await cookies()).set).toHaveBeenCalled(); // Check if blank cookie is set
    });

    it("should set a new session cookie if session is fresh", async () => {
      mockSession(mockUser, mockFreshSessionData);
      (lucia.createSessionCookie as Mock).mockReturnValue(mockNewSessionCookie);
      (prisma.userPreferences.findUnique as Mock).mockResolvedValue({
        userId: mockUserId,
        calendar: "google",
      });

      await GET();

      expect(lucia.createSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect((await cookies()).set).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should return 404 if user preferences are not found", async () => {
      (prisma.userPreferences.findUnique as Mock).mockResolvedValue(null);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("User preferences not found");
      expect(prisma.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it("should return user preferences successfully", async () => {
      const mockPreferences = { userId: mockUserId, calendar: "outlook" };
      (prisma.userPreferences.findUnique as Mock).mockResolvedValue(
        mockPreferences,
      );

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.calendarPreference).toBe("outlook");
      expect(prisma.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect((await cookies()).set).not.toHaveBeenCalled(); // Should not set cookie if session is not fresh
    });

    it("should return 500 if a database error occurs", async () => {
      (prisma.userPreferences.findUnique as Mock).mockRejectedValue(
        new Error("DB Error"),
      );

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });

  // --- PATCH Handler Tests ---
  describe("PATCH /api/users/preferences", () => {
    const mockPreferenceUpdate = { calendar: "apple" };

    // Helper to create a mock PATCH request
    const createMockPatchRequest = (body: any): NextRequest => {
      const request = new NextRequest(
        "http://localhost/api/users/preferences",
        {
          method: "PATCH",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        },
      );
      // Spy on json method because it's consumed by the route handler
      vi.spyOn(request, "json").mockResolvedValue(body);
      return request;
    };

    it("should return 401 if no session cookie is found", async () => {
      mockCookiesGet(undefined);
      mockSession(null, null);
      const request = createMockPatchRequest(mockPreferenceUpdate);

      const response = await PATCH(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(lucia.validateSession).not.toHaveBeenCalled();
    });

    it("should return 401 if session validation fails", async () => {
      mockCookiesGet("invalid_session_id");
      mockSession(null, null);
      const request = createMockPatchRequest(mockPreferenceUpdate);

      const response = await PATCH(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(lucia.validateSession).toHaveBeenCalledWith("invalid_session_id");
      expect(lucia.createBlankSessionCookie).toHaveBeenCalled();
      expect((await cookies()).set).toHaveBeenCalled();
    });

    it("should set a new session cookie if session is fresh", async () => {
      mockSession(mockUser, mockFreshSessionData);
      (lucia.createSessionCookie as Mock).mockReturnValue(mockNewSessionCookie);
      (prisma.userPreferences.upsert as Mock).mockResolvedValue({}); // Mock successful upsert
      const request = createMockPatchRequest(mockPreferenceUpdate);

      await PATCH(request);

      expect(lucia.createSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect((await cookies()).set).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should update user preferences successfully using upsert", async () => {
      (prisma.userPreferences.upsert as Mock).mockResolvedValue({}); // Mock successful upsert
      const request = createMockPatchRequest(mockPreferenceUpdate);

      const response = await PATCH(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.message).toBe("Preferences updated");
      expect(prisma.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        create: { userId: mockUserId, calendar: mockPreferenceUpdate.calendar },
        update: { calendar: mockPreferenceUpdate.calendar },
      });
      expect(request.json).toHaveBeenCalled();
      expect((await cookies()).set).not.toHaveBeenCalled(); // Should not set cookie if session is not fresh
    });

    it("should return 500 if reading request body fails", async () => {
      const request = new NextRequest(
        "http://localhost/api/users/preferences",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        },
      );
      // Make request.json() throw an error
      vi.spyOn(request, "json").mockRejectedValue(new Error("Invalid JSON"));

      const response = await PATCH(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(prisma.userPreferences.upsert).not.toHaveBeenCalled();
    });

    it("should return 500 if database upsert fails", async () => {
      (prisma.userPreferences.upsert as Mock).mockRejectedValue(
        new Error("DB Upsert Error"),
      );
      const request = createMockPatchRequest(mockPreferenceUpdate);

      const response = await PATCH(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(prisma.userPreferences.upsert).toHaveBeenCalled();
    });
  });
});
