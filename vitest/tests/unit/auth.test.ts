// src/auth.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Session, User } from "lucia";
import * as authModule from "@/auth"; // Import the actual module

// Mock Data (remains the same)
const mockSessionId = "valid-session-id";
const mockUserId = "user-123";
const mockUser: User = {
  id: mockUserId,
  username: "testuser",
  displayName: "Test User",
  avatarUrl: null,
  googleId: null,
  isDatingActive: false,
  isAdmin: false,
};
const mockSession: Session = {
  id: mockSessionId,
  userId: mockUserId,
  expiresAt: new Date(Date.now() + 3600 * 1000), // Expires in 1 hour
  fresh: false,
};

// --- Mock external dependencies ---

// Mock next/headers
const mockCookiesGet = vi.fn();
const mockCookiesSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: mockCookiesGet,
    set: mockCookiesSet,
  }),
}));

// --- Spy on lucia methods ---
// We spy on the methods of the actual lucia instance from the imported module
const luciaValidateSessionSpy = vi.spyOn(authModule.lucia, "validateSession");
const luciaCreateSessionCookieSpy = vi.spyOn(
  authModule.lucia,
  "createSessionCookie",
);
const luciaCreateBlankSessionCookieSpy = vi.spyOn(
  authModule.lucia,
  "createBlankSessionCookie",
);

// Import the function under test
const { validateRequest } = authModule;

describe("[Auth][Lib] Auth Helpers", () => {
  beforeEach(() => {
    // Reset mocks/spies before each test
    vi.clearAllMocks();

    // Default mock implementations for spies
    mockCookiesGet.mockReturnValue(undefined); // Default: no cookie
    luciaValidateSessionSpy.mockResolvedValue({ user: null, session: null });
    luciaCreateSessionCookieSpy.mockReturnValue({
      name: authModule.lucia.sessionCookieName, // Use actual name
      value: "new-session-cookie-value",
      attributes: { path: "/", secure: false, httpOnly: true, sameSite: "lax" },
      serialize: () => "",
    });
    luciaCreateBlankSessionCookieSpy.mockReturnValue({
      name: authModule.lucia.sessionCookieName, // Use actual name
      value: "",
      attributes: { path: "/", expires: new Date(0) }, // Expired cookie
      serialize: () => "",
    });
  });

  // No afterEach needed usually, beforeEach covers reset

  describe("validateRequest", () => {
    it("should return session and user if valid session exists (not fresh)", async () => {
      // Arrange: Mock a valid, non-fresh session
      mockCookiesGet.mockReturnValue({
        name: authModule.lucia.sessionCookieName,
        value: mockSessionId,
      });
      luciaValidateSessionSpy.mockResolvedValue({
        user: mockUser,
        session: { ...mockSession, fresh: false },
      });

      // Act
      const result = await validateRequest();

      // Assert
      expect(mockCookiesGet).toHaveBeenCalledWith(
        authModule.lucia.sessionCookieName,
      );
      expect(luciaValidateSessionSpy).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual({
        user: mockUser,
        session: { ...mockSession, fresh: false },
      });
      expect(luciaCreateSessionCookieSpy).not.toHaveBeenCalled(); // Not called if not fresh
      expect(luciaCreateBlankSessionCookieSpy).not.toHaveBeenCalled();
      expect(mockCookiesSet).not.toHaveBeenCalled(); // Not called if not fresh
    });

    it("should set new cookie if valid session exists and is fresh", async () => {
      // Arrange: Mock a valid, FRESH session
      mockCookiesGet.mockReturnValue({
        name: authModule.lucia.sessionCookieName,
        value: mockSessionId,
      });
      luciaValidateSessionSpy.mockResolvedValue({
        user: mockUser,
        session: { ...mockSession, fresh: true },
      });
      const newCookie = {
        name: authModule.lucia.sessionCookieName,
        value: "new-fresh-session-value",
        attributes: {
          path: "/",
          secure: true,
          httpOnly: true,
          sameSite: "lax",
        } as const,
        serialize: () => "",
      };
      luciaCreateSessionCookieSpy.mockReturnValue(newCookie);

      // Act
      const result = await validateRequest();

      // Assert
      expect(mockCookiesGet).toHaveBeenCalledWith(
        authModule.lucia.sessionCookieName,
      );
      expect(luciaValidateSessionSpy).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual({
        user: mockUser,
        session: { ...mockSession, fresh: true },
      });
      expect(luciaCreateSessionCookieSpy).toHaveBeenCalledWith(mockSession.id);
      expect(luciaCreateBlankSessionCookieSpy).not.toHaveBeenCalled();
      expect(mockCookiesSet).toHaveBeenCalledWith(
        newCookie.name,
        newCookie.value,
        newCookie.attributes,
      );
    });

    it("should return null session/user if no session cookie exists", async () => {
      // Arrange: No session cookie
      mockCookiesGet.mockReturnValue(undefined);
      // No need to mock blank cookie creation here as it won't be called

      // Act
      const result = await validateRequest();

      // Assert: Corrected expectations for early return
      expect(mockCookiesGet).toHaveBeenCalledWith(
        authModule.lucia.sessionCookieName,
      );
      expect(luciaValidateSessionSpy).not.toHaveBeenCalled(); // Should not be called
      expect(result).toEqual({ user: null, session: null });
      expect(luciaCreateBlankSessionCookieSpy).not.toHaveBeenCalled(); // Should not be called
      expect(luciaCreateSessionCookieSpy).not.toHaveBeenCalled();
      expect(mockCookiesSet).not.toHaveBeenCalled(); // Should not be called
    });

    it("should return null session/user and set blank cookie if session validation fails", async () => {
      // Arrange: Session cookie exists but validation returns null
      mockCookiesGet.mockReturnValue({
        name: authModule.lucia.sessionCookieName,
        value: "invalid-session-id",
      });
      luciaValidateSessionSpy.mockResolvedValue({ user: null, session: null }); // Lucia validation failed
      const blankCookie = {
        name: authModule.lucia.sessionCookieName,
        value: "",
        attributes: { path: "/", expires: new Date(0) },
        serialize: () => "",
      };
      luciaCreateBlankSessionCookieSpy.mockReturnValue(blankCookie);

      // Act
      const result = await validateRequest();

      // Assert
      expect(mockCookiesGet).toHaveBeenCalledWith(
        authModule.lucia.sessionCookieName,
      );
      expect(luciaValidateSessionSpy).toHaveBeenCalledWith(
        "invalid-session-id",
      );
      expect(result).toEqual({ user: null, session: null });
      expect(luciaCreateBlankSessionCookieSpy).toHaveBeenCalled(); // Called because !result.session
      expect(luciaCreateSessionCookieSpy).not.toHaveBeenCalled();
      expect(mockCookiesSet).toHaveBeenCalledWith(
        blankCookie.name,
        blankCookie.value,
        blankCookie.attributes,
      );
    });

    // Unskip and implement error handling test
    it("should handle errors during session validation and return null", async () => {
      // Arrange: Mock validateSession to throw an error
      mockCookiesGet.mockReturnValue({
        name: authModule.lucia.sessionCookieName,
        value: mockSessionId,
      });
      const validationError = new Error("Database connection failed");
      luciaValidateSessionSpy.mockRejectedValue(validationError);
      // Also need to mock the return value for the blank cookie creation call
      const blankCookie = {
        name: authModule.lucia.sessionCookieName,
        value: "",
        attributes: { path: "/", expires: new Date(0) },
        serialize: () => "",
      };
      luciaCreateBlankSessionCookieSpy.mockReturnValue(blankCookie);
      // Mock console.error to suppress expected error message during test
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const result = await validateRequest();

      // Assert
      expect(mockCookiesGet).toHaveBeenCalledWith(
        authModule.lucia.sessionCookieName,
      );
      expect(luciaValidateSessionSpy).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual({ user: null, session: null }); // Should return null on error
      expect(luciaCreateSessionCookieSpy).not.toHaveBeenCalled();
      // Update: Expect blank cookie to be created and set in the new catch block
      expect(luciaCreateBlankSessionCookieSpy).toHaveBeenCalled();
      expect(mockCookiesSet).toHaveBeenCalledWith(
        blankCookie.name,
        blankCookie.value,
        blankCookie.attributes,
      );
      // Check that the validation error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error validating session:",
        validationError,
      );
      // Check that the cookie setting error was *not* logged
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        "Error setting session cookie in validateRequest:",
        expect.anything(),
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it("should handle errors during cookie setting and return null", async () => {
      // Arrange: Valid session returned, but cookie setting throws an error
      mockCookiesGet.mockReturnValue({
        name: authModule.lucia.sessionCookieName,
        value: mockSessionId,
      });
      luciaValidateSessionSpy.mockResolvedValue({
        user: mockUser,
        session: { ...mockSession, fresh: true },
      }); // Fresh session to trigger cookie set
      const cookieSetError = new Error("Failed to set cookie");
      mockCookiesSet.mockImplementation(() => {
        throw cookieSetError;
      });
      // Mock console.error to suppress expected error message during test
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const result = await validateRequest();

      // Assert
      expect(mockCookiesGet).toHaveBeenCalledWith(
        authModule.lucia.sessionCookieName,
      );
      expect(luciaValidateSessionSpy).toHaveBeenCalledWith(mockSessionId);
      expect(luciaCreateSessionCookieSpy).toHaveBeenCalledWith(mockSession.id);
      expect(mockCookiesSet).toHaveBeenCalled(); // It was attempted
      expect(result).toEqual({ user: null, session: null }); // Should return null on error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error setting session cookie in validateRequest:",
        cookieSetError,
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  // describe('otherAuthHelperFunction', () => { ... });
});
