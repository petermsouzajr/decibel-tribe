import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/users/update-email/route";
import { updateUserEmail } from "@/app/(main)/users/[username]/actions";
import { cookies } from "next/headers";

// --- Mocks ---
vi.mock("@/app/(main)/users/[username]/actions", () => ({
  updateUserEmail: vi.fn(),
}));

// The route now validates the session itself and returns 401 when absent,
// instead of letting the action's "Unauthorized" throw become a 500.
vi.mock("@/auth", () => ({
  validateRequest: vi.fn(async () => ({
    user: { id: "user123" },
    session: { id: "session123" },
  })),
}));

describe("API Route: /api/users/update-email", () => {
  let request: NextRequest;
  const mockRequestBody = {
    currentPassword: "oldPassword123",
    newEmail: "new.email@example.com",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (updateUserEmail as Mock).mockClear();
  });

  // Helper to create a mock POST request
  const createMockPostRequest = (
    body: any,
    contentType = "application/json",
  ): NextRequest => {
    const request = new NextRequest("http://localhost/api/users/update-email", {
      method: "POST",
      body: contentType === "application/json" ? JSON.stringify(body) : body,
      headers: { "Content-Type": contentType },
    });
    // Spy on json method unless we expect it to fail
    if (contentType === "application/json") {
      vi.spyOn(request, "json").mockResolvedValue(body);
    }
    return request;
  };

  it("should call updateUserEmail action with correct data and return its result on success", async () => {
    // Arrange
    const mockActionResult = {
      success: true,
      message: "Email updated successfully",
    };
    (updateUserEmail as Mock).mockResolvedValue(mockActionResult);
    request = createMockPostRequest(mockRequestBody);

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockActionResult);
    expect(updateUserEmail).toHaveBeenCalledTimes(1);
    expect(updateUserEmail).toHaveBeenCalledWith({
      currentPassword: mockRequestBody.currentPassword,
      newEmail: mockRequestBody.newEmail,
    });
    expect(request.json).toHaveBeenCalledTimes(1);
  });

  it("should return the result from updateUserEmail even if it indicates failure", async () => {
    // Arrange
    const mockActionFailureResult = {
      success: false,
      error: "Incorrect password",
    };
    (updateUserEmail as Mock).mockResolvedValue(mockActionFailureResult);
    request = createMockPostRequest(mockRequestBody);

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200); // The API route itself succeeded
    expect(body).toEqual(mockActionFailureResult); // Return the action's specific error
    expect(updateUserEmail).toHaveBeenCalledTimes(1);
    expect(updateUserEmail).toHaveBeenCalledWith(mockRequestBody);
  });

  it("should return 500 if request body is not valid JSON", async () => {
    // Arrange
    const invalidRequestBody = "not json";
    // Create request but don't spy/mock json() to let it fail naturally (or mock reject)
    request = new NextRequest("http://localhost/api/users/update-email", {
      method: "POST",
      body: invalidRequestBody,
      headers: { "Content-Type": "application/json" },
    });
    // Mock request.json() to simulate a parsing error
    vi.spyOn(request, "json").mockRejectedValue(new Error("Invalid JSON"));

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
    expect(updateUserEmail).not.toHaveBeenCalled();
  });

  it("should return 500 if updateUserEmail action throws an unexpected error", async () => {
    // Arrange
    const actionError = new Error("Something went wrong in the action");
    (updateUserEmail as Mock).mockRejectedValue(actionError);
    request = createMockPostRequest(mockRequestBody);

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
    expect(updateUserEmail).toHaveBeenCalledTimes(1);
    expect(updateUserEmail).toHaveBeenCalledWith(mockRequestBody);
  });
});
