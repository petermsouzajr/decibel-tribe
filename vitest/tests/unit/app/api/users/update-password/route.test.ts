import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/users/update-password/route";
import { updateUserPassword } from "@/app/(main)/users/[username]/actions";

// --- Mocks ---
vi.mock("@/app/(main)/users/[username]/actions", () => ({
  updateUserPassword: vi.fn(),
}));

describe("API Route: /api/users/update-password", () => {
  let request: NextRequest;
  const mockCurrentPassword = "oldPassword123";
  const mockNewPassword = "newSecurePassword456";

  beforeEach(() => {
    vi.resetAllMocks();
    (updateUserPassword as Mock).mockClear();
  });

  // Helper to create a mock POST request
  const createMockPostRequest = (
    body: any,
    contentType = "application/json",
  ): NextRequest => {
    const request = new NextRequest(
      "http://localhost/api/users/update-password",
      {
        method: "POST",
        body: contentType === "application/json" ? JSON.stringify(body) : body,
        headers: { "Content-Type": contentType },
      },
    );
    if (contentType === "application/json") {
      vi.spyOn(request, "json").mockResolvedValue(body);
    }
    return request;
  };

  it("should call updateUserPassword with current and new password when isSettingPassword is false or missing", async () => {
    // Arrange
    const mockRequestBody = {
      currentPassword: mockCurrentPassword,
      newPassword: mockNewPassword,
    }; // isSettingPassword defaults to false/undefined
    const mockActionResult = { success: true, message: "Password updated" };
    (updateUserPassword as Mock).mockResolvedValue(mockActionResult);
    request = createMockPostRequest(mockRequestBody);

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockActionResult);
    expect(updateUserPassword).toHaveBeenCalledTimes(1);
    expect(updateUserPassword).toHaveBeenCalledWith({
      currentPassword: mockCurrentPassword,
      newPassword: mockNewPassword,
    });
    expect(request.json).toHaveBeenCalledTimes(1);
  });

  it("should call updateUserPassword with only new password when isSettingPassword is true", async () => {
    // Arrange
    const mockRequestBody = {
      newPassword: mockNewPassword,
      isSettingPassword: true,
    };
    const mockActionResult = { success: true, message: "Password set" };
    (updateUserPassword as Mock).mockResolvedValue(mockActionResult);
    request = createMockPostRequest(mockRequestBody);

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockActionResult);
    expect(updateUserPassword).toHaveBeenCalledTimes(1);
    expect(updateUserPassword).toHaveBeenCalledWith({
      newPassword: mockNewPassword,
      // currentPassword should not be included
    });
    expect(updateUserPassword).not.toHaveBeenCalledWith(
      expect.objectContaining({ currentPassword: expect.anything() }),
    );
    expect(request.json).toHaveBeenCalledTimes(1);
  });

  it("should return the result from updateUserPassword even if it indicates failure", async () => {
    // Arrange
    const mockRequestBody = {
      currentPassword: mockCurrentPassword,
      newPassword: mockNewPassword,
    };
    const mockActionFailureResult = {
      success: false,
      error: "Incorrect current password",
    };
    (updateUserPassword as Mock).mockResolvedValue(mockActionFailureResult);
    request = createMockPostRequest(mockRequestBody);

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200); // API route succeeded
    expect(body).toEqual(mockActionFailureResult);
    expect(updateUserPassword).toHaveBeenCalledTimes(1);
    expect(updateUserPassword).toHaveBeenCalledWith(mockRequestBody);
  });

  it("should return 500 if request body is not valid JSON", async () => {
    // Arrange
    request = new NextRequest("http://localhost/api/users/update-password", {
      method: "POST",
      body: "invalid json string",
      headers: { "Content-Type": "application/json" },
    });
    vi.spyOn(request, "json").mockRejectedValue(new Error("Invalid JSON"));

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("should return 500 if updateUserPassword action throws an unexpected error", async () => {
    // Arrange
    const mockRequestBody = {
      currentPassword: mockCurrentPassword,
      newPassword: mockNewPassword,
    };
    const actionError = new Error("Action failed unexpectedly");
    (updateUserPassword as Mock).mockRejectedValue(actionError);
    request = createMockPostRequest(mockRequestBody);

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
    expect(updateUserPassword).toHaveBeenCalledTimes(1);
    expect(updateUserPassword).toHaveBeenCalledWith(mockRequestBody);
  });
});
