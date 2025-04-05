// /// <reference types="vitest/globals" /> // Removed
// src/components/auth/SignUpForm.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signUp } from "@/app/(auth)/signup/actions";
import { useRouter } from "next/navigation";
import SignUpForm from "@/app/(auth)/signup/SignUpForm";

vi.mock("@/app/(auth)/signup/actions", () => ({
  signUp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("SignUpForm", () => {
  const mockSignUp = signUp;
  const mockRouterPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    render(<SignUpForm />);
    vi.mocked(useRouter).mockReturnValue({
      push: mockRouterPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it("should render the form correctly", () => {
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create account/i }),
    ).toBeInTheDocument();
  });

  it("should display validation errors for empty fields", async () => {
    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Required/i)).toHaveLength(3);
      expect(screen.getByText(/Username/i)).toBeInTheDocument();
      expect(screen.getByText(/Email/i)).toBeInTheDocument();
      expect(screen.getByText(/Password/i)).toBeInTheDocument();
    });
  });

  it("should handle successful sign-up", async () => {
    vi.mocked(mockSignUp).mockResolvedValue({ error: null as any });

    fireEvent.input(screen.getByLabelText(/Username/i), {
      target: { value: "testuser" },
    });
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: "testuser@example.com" },
    });
    fireEvent.input(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        username: "testuser",
        email: "testuser@example.com",
        password: "password123",
      });
      expect(
        screen.getByText(
          /Signup complete! Please check your email for the account verification link./i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("should handle failed sign-up", async () => {
    vi.mocked(mockSignUp).mockResolvedValue({ error: "Sign-up failed" });

    fireEvent.input(screen.getByLabelText(/Username/i), {
      target: { value: "testuser" },
    });
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: "testuser@example.com" },
    });
    fireEvent.input(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        username: "testuser",
        email: "testuser@example.com",
        password: "password123",
      });
      expect(screen.getByText(/Sign-up failed/i)).toBeInTheDocument();
    });
  });

  it("should close the modal and redirect on modal close", async () => {
    vi.mocked(mockSignUp).mockResolvedValue({ error: null as any });

    fireEvent.input(screen.getByLabelText(/Username/i), {
      target: { value: "testuser" },
    });
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: "testuser@example.com" },
    });
    fireEvent.input(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Signup complete! Please check your email for the account verification link./i,
        ),
      ).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByRole("button", { name: /Close/i });

    const closeModalButton = closeButtons.find((button) =>
      button.closest('[role="dialog"]'),
    );
    fireEvent.click(closeModalButton!);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/");
    });
  });
});
