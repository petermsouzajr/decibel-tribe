// src/components/auth/LoginForm.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/app/(auth)/login/LoginForm"; // Correct component path
import { login } from "@/app/(auth)/login/actions"; // Action to mock
import { LoginValues } from "@/lib/validation"; // Import the type

// Mock the server action
vi.mock("@/app/(auth)/login/actions", () => ({
  login: vi.fn(),
}));

// Cast the mock using MockedFunction
const mockLogin = login as MockedFunction<
  (credentials: LoginValues) => Promise<{ error?: string }>
>;

describe("[Auth][Component] LoginForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock implementation (optional, can be set per test)
    mockLogin.mockResolvedValue({}); // Default to success with no error
  });

  it("should render email/username and password fields", () => {
    render(<LoginForm />);

    // Check for inputs using their labels
    expect(screen.getByLabelText(/username\/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for submit button
    const submitButton = screen.getByRole("button", { name: /log in/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled(); // Initially enabled
  });

  it("should show validation errors", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /log in/i });

    // Click submit without filling fields
    await user.click(submitButton);

    // Assert validation messages appear (using findByText for async validation)
    // Only password field is required
    const validationMessage = await screen.findByText("Required");
    expect(validationMessage).toBeInTheDocument();

    // Ensure only one such message exists
    const allMessages = screen.queryAllByText("Required");
    expect(allMessages).toHaveLength(1);

    // Ensure login action was NOT called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("should call login action on submit with valid data", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username\/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /log in/i });

    const testUsername = "testuser";
    const testPassword = "password123";

    // Fill form
    await user.type(usernameInput, testUsername);
    await user.type(passwordInput, testPassword);

    // Submit
    await user.click(submitButton);

    // Assert action was called with correct values
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
    expect(mockLogin).toHaveBeenCalledWith({
      username: testUsername,
      password: testPassword,
      // email: undefined, // react-hook-form might exclude undefined fields
    });
  });

  it("should display server errors on failed login", async () => {
    const user = userEvent.setup();
    const errorMessage = "Invalid username or password";
    // Configure mock action to return an error
    mockLogin.mockResolvedValue({ error: errorMessage });

    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username\/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /log in/i });

    // Fill form
    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "wrongpassword");

    // Submit
    await user.click(submitButton);

    // Assert server error message appears
    const errorElement = await screen.findByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
  });
});
