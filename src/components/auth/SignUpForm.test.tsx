// src/components/auth/SignUpForm.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpForm from "@/app/(auth)/signup/SignUpForm"; // Correct component path
import { signUp } from "@/app/(auth)/signup/actions"; // Action to mock
import { SignUpValues } from "@/lib/validation"; // Import the type

// Mock the server action
vi.mock("@/app/(auth)/signup/actions", () => ({
  signUp: vi.fn(),
}));

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Cast the mock using MockedFunction
const mockSignUp = signUp as MockedFunction<
  (credentials: SignUpValues) => Promise<{ error?: string; success?: boolean }>
>;

describe("[Auth][Component] SignUpForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock implementation (success)
    mockSignUp.mockResolvedValue({});
  });

  it("should render email, username, and password fields", () => {
    render(<SignUpForm />);

    // Check for inputs using their labels
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for submit button
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it("should show validation errors", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    // Click submit without filling fields
    await user.click(submitButton);

    // Assert validation messages appear (all fields required)
    const validationMessages = await screen.findAllByText("Required");
    expect(validationMessages).toHaveLength(3); // Expect three "Required" messages

    // Ensure signup action was NOT called
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should call signup action on submit with valid data", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    const testUsername = "newuser";
    const testEmail = "newuser@example.com";
    const testPassword = "password123";

    // Fill form
    await user.type(usernameInput, testUsername);
    await user.type(emailInput, testEmail);
    await user.type(passwordInput, testPassword);

    // Submit
    await user.click(submitButton);

    // Assert action was called with correct values
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
    });
    expect(mockSignUp).toHaveBeenCalledWith({
      username: testUsername,
      email: testEmail,
      password: testPassword,
    });

    // Assert confirmation modal appears
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(await screen.findByText(/sign up complete/i)).toBeInTheDocument();
  });

  it("should display server errors on failed signup", async () => {
    const user = userEvent.setup();
    const errorMessage = "Username already taken";
    // Configure mock action to return an error
    mockSignUp.mockResolvedValue({ error: errorMessage });

    render(<SignUpForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    // Fill form with valid data (to pass client-side validation)
    await user.type(usernameInput, "testuser");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // Submit
    await user.click(submitButton);

    // Assert server error message appears
    const errorElement = await screen.findByText(errorMessage);
    expect(errorElement).toBeInTheDocument();

    // Assert confirmation modal does NOT appear
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should show modal on success and redirect on modal close", async () => {
    const user = userEvent.setup();
    // Mock successful signup
    mockSignUp.mockResolvedValue({});

    render(<SignUpForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    // Fill form & Submit
    await user.type(usernameInput, "newuser2");
    await user.type(emailInput, "newuser2@example.com");
    await user.type(passwordInput, "password456");
    await user.click(submitButton);

    // Assert modal appears after successful submission
    const modal = await screen.findByRole("dialog");
    expect(modal).toBeInTheDocument();
    expect(
      await within(modal).findByText(/sign up complete/i),
    ).toBeInTheDocument();

    // Find and click the Close button within the modal
    // Use a more specific selector: text content within the footer context
    const closeButton = within(modal).getByText(/^Close$/, {
      selector: "button", // Ensure it's a button
    });
    expect(closeButton).toBeInTheDocument();
    await user.click(closeButton);

    // Assert router was called to redirect
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1);
    });
    expect(mockRouterPush).toHaveBeenCalledWith("/");

    // Optional: Assert modal disappears (though onOpenChange might handle this)
    // await waitFor(() => {
    //   expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // });
  });
});
