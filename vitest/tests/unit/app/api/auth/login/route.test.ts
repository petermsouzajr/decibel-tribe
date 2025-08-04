import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import { login } from "@/app/(auth)/login/actions"; // The server action being called

// --- Mocks ---
vi.mock("@/app/(auth)/login/actions", () => ({
  login: vi.fn(),
}));

// --- Test Suite ---
describe("API Route: POST /api/auth/login", () => {
  const mockUsername = "testuser";
  const mockPassword = "password123";
  const mockSessionCookie = {
    name: "auth_session",
    value: "mock-session-id",
    attributes: {},
  };
  const mockLoginError = "Invalid username or password";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Helper to create request with JSON body
  const createRequest = async (body: object) => {
    return new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  // --- Success Path ---
  it("should call the login action and return 200 with session cookie on success", async () => {
    // Arrange: Mock successful login action
    const mockLoginSuccessResult = { sessionCookie: mockSessionCookie };
    (login as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockLoginSuccessResult,
    );

    const request = await createRequest({
      username: mockUsername,
      password: mockPassword,
    });

    // Act
    const response = await POST(request);
    const responseBody = await response.json();

    // Assert
    expect(login).toHaveBeenCalledTimes(1);
    // Verify the action was called with credentials and the `true` flag
    expect(login).toHaveBeenCalledWith(
      { username: mockUsername, password: mockPassword },
      true,
    );
    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ sessionCookie: mockSessionCookie });
  });

  // --- Failure Path (Action Returns Error) ---
  it("should call the login action and return 401 with error on failure", async () => {
    // Arrange: Mock failed login action
    const mockLoginFailureResult = { error: mockLoginError };
    (login as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockLoginFailureResult,
    );

    const request = await createRequest({
      username: mockUsername,
      password: mockPassword,
    });

    // Act
    const response = await POST(request);
    const responseBody = await response.json();

    // Assert
    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith(
      { username: mockUsername, password: mockPassword },
      true,
    );
    expect(response.status).toBe(401);
    expect(responseBody).toEqual({ error: mockLoginError });
  });

  // --- Error Handling (Action Throws) ---
  it("should propagate error if the login action throws unexpectedly", async () => {
    // Arrange: Mock login action throwing an error
    const unexpectedError = new Error("Something went wrong in the action");
    (login as ReturnType<typeof vi.fn>).mockRejectedValue(unexpectedError);

    const request = await createRequest({
      username: mockUsername,
      password: mockPassword,
    });

    // Act & Assert
    // Expect the POST function itself to throw, which Next.js would typically catch and turn into a 500
    await expect(POST(request)).rejects.toThrow(unexpectedError);
    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith(
      { username: mockUsername, password: mockPassword },
      true,
    );
  });

  // --- Input Validation (Implied) ---
  // It assumes the request body is valid JSON. If req.json() fails, Next.js handles it (likely 400 or 500).
  // Testing that specific edge case for this simple wrapper might be overkill.
});
