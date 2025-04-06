// src/components/auth/ForgotPassForm.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPassForm from "@/app/(auth)/forgot-pass/forgotPassForm"; // Correct component path casing
import { resendVerification } from "@/app/(auth)/forgot-pass/actions"; // Action to mock
import { resetPasswordValues } from "@/lib/validation"; // Import the type

// Mock the server action
vi.mock("@/app/(auth)/forgot-pass/actions", () => ({
  resendVerification: vi.fn(),
}));

// Cast the mock using MockedFunction
const mockResendVerification = resendVerification as MockedFunction<
  (credentials: resetPasswordValues) => Promise<{ error: string }>
>;

describe("[Auth][Component] ForgotPasswordForm", () => {
  beforeEach(() => {
    // Use standard vi object for resetAllMocks
    vi.resetAllMocks();
    // Default mock implementation (success)
    mockResendVerification.mockResolvedValue({ error: "" });
  });

  it("should render email/username field", () => {
    render(<ForgotPassForm />);

    // Check for input using label
    expect(screen.getByLabelText(/username\/email/i)).toBeInTheDocument();

    // Check for submit button
    const submitButton = screen.getByRole("button", {
      name: /send verification email/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it("should show validation errors for credential too long", async () => {
    const user = userEvent.setup();
    render(<ForgotPassForm />);

    const credentialInput = screen.getByLabelText(/username\/email/i);
    const submitButton = screen.getByRole("button", {
      name: /send verification email/i,
    });

    // Enter value longer than 50 chars
    const longCredential = "a".repeat(51);
    await user.type(credentialInput, longCredential);

    // Submit
    await user.click(submitButton);

    // Assert validation message appears
    expect(
      await screen.findByText(/must be less than 50 characters/i),
    ).toBeInTheDocument();

    // Ensure action was NOT called
    expect(mockResendVerification).not.toHaveBeenCalled();
  });

  it("should call forgot password action on submit", async () => {
    const user = userEvent.setup();
    render(<ForgotPassForm />);

    const credentialInput = screen.getByLabelText(/username\/email/i);
    const submitButton = screen.getByRole("button", {
      name: /send verification email/i,
    });

    const testCredential = "user@example.com";

    // Fill form
    await user.type(credentialInput, testCredential);

    // Submit
    await user.click(submitButton);

    // Assert action was called
    await waitFor(() => {
      expect(mockResendVerification).toHaveBeenCalledTimes(1);
    });
    expect(mockResendVerification).toHaveBeenCalledWith({
      credential: testCredential,
    });
  });

  it("should display success message on submit", async () => {
    const user = userEvent.setup();
    // Ensure mock returns success
    mockResendVerification.mockResolvedValue({ error: "" });

    render(<ForgotPassForm />);

    const credentialInput = screen.getByLabelText(/username\/email/i);
    const submitButton = screen.getByRole("button", {
      name: /send verification email/i,
    });

    const testCredential = "user@example.com";

    // Fill form
    await user.type(credentialInput, testCredential);

    // Submit
    await user.click(submitButton);

    // Assert success message appears
    expect(
      await screen.findByText(
        `Verification email sent! Check your inbox at ${testCredential}.`,
      ),
    ).toBeInTheDocument();

    // Assert error message does NOT appear
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument(); // General check for any error text
  });

  // Add test for server error case
  it("should display server error on submit failure", async () => {
    const user = userEvent.setup();
    const errorMessage = "User not found";
    // Configure mock action to return an error
    mockResendVerification.mockResolvedValue({ error: errorMessage });

    render(<ForgotPassForm />);

    const credentialInput = screen.getByLabelText(/username\/email/i);
    const submitButton = screen.getByRole("button", {
      name: /send verification email/i,
    });

    const testCredential = "nonexistent@example.com";

    // Fill form
    await user.type(credentialInput, testCredential);

    // Submit
    await user.click(submitButton);

    // Assert server error message appears
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();

    // Assert success message does NOT appear
    expect(
      screen.queryByText(/Verification email sent/i),
    ).not.toBeInTheDocument();
  });
});
