// /// <reference types="vitest/globals" /> // Removed
// src/components/auth/LoginForm.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "@/app/(auth)/login/LoginForm";
import { login } from "@/app/(auth)/login/actions";

vi.mock("@/app/(auth)/login/actions", () => ({
  login: vi.fn(),
}));

describe("LoginForm", () => {
  const mockLogin = login;

  beforeEach(() => {
    vi.clearAllMocks();
    render(<LoginForm />);
  });

  it("should render the form correctly", () => {
    expect(screen.getByLabelText(/Username\/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log in/i })).toBeInTheDocument();
  });

  it("should display validation errors for empty fields", async () => {
    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Required/i)).toBeInTheDocument();
    });
  });

  it("should handle successful login", async () => {
    vi.mocked(mockLogin).mockResolvedValue({ error: "Username and password are required" });

    fireEvent.input(screen.getByLabelText(/Username\/Email/i), {
      target: { value: "testuser" },
    });
    fireEvent.input(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
      });
      expect(
        screen.queryByText(/Incorrect username or password/i),
      ).not.toBeInTheDocument();
    });
  });

  it("should handle failed login", async () => {
    vi.mocked(mockLogin).mockResolvedValue({
      error: "Incorrect username or password",
    });

    fireEvent.input(screen.getByLabelText(/Username\/Email/i), {
      target: { value: "testuser" },
    });
    fireEvent.input(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
      });
      expect(
        screen.getByText(/Incorrect username or password/i),
      ).toBeInTheDocument();
    });
  });
});
