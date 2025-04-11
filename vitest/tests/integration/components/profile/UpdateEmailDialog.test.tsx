// src/components/profile/UpdateEmailDialog.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpdateEmailDialog from "@/app/(main)/users/[username]/UpdateEmailDialog";
import { UpdateEmailValues } from "@/lib/validation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- Mocks ---

// Mock mutation hook
const mockMutate = vi.fn();
vi.mock("@/app/(main)/users/[username]/mutations", () => ({
  useUpdateEmailMutation: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

const mockOnOpenChange = vi.fn();

// Helper to render with QueryClientProvider
const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient();
  return {
    user: userEvent.setup(),
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
};

// --- Tests ---
describe("[Profile][Component] UpdateEmailDialog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default success for mutation
    mockMutate.mockImplementation((_variables: any, options: any) => {
      options?.onSuccess?.();
    });
  });

  // 1. Test Rendering
  it("should render form fields (current password, new email)", () => {
    renderWithClient(
      <UpdateEmailDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update email/i }),
    ).toBeInTheDocument();
  });

  // 2. Test Validation Errors
  it("should show validation errors", async () => {
    const { user } = renderWithClient(
      <UpdateEmailDialog open={true} onOpenChange={mockOnOpenChange} />,
    );
    const submitButton = screen.getByRole("button", { name: /update email/i });

    // Attempt submit with empty fields
    await act(async () => {
      await user.click(submitButton);
    });

    // Check required field messages
    await waitFor(() => {
      expect(
        screen.getByText("Current password is required"),
      ).toBeInTheDocument();
      // Email schema uses .email(), zod automatically provides message for empty
    });
    expect(mockMutate).not.toHaveBeenCalled(); // Should not submit

    // Fill password, enter invalid email
    await user.type(screen.getByLabelText(/current password/i), "password123");
    await user.type(screen.getByLabelText(/new email/i), "invalid-email");
    await act(async () => {
      await user.click(submitButton);
    });

    // Check invalid email message
    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled(); // Should not submit yet
  });

  // 3. Test Successful Submission
  it("should call update mutation on submit with valid data", async () => {
    const { user } = renderWithClient(
      <UpdateEmailDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    const passwordInput = screen.getByLabelText(/current password/i);
    const emailInput = screen.getByLabelText(/new email/i);
    const submitButton = screen.getByRole("button", { name: /update email/i });

    const validPassword = "currentPass123";
    const validEmail = "new.email@example.com";

    await user.type(passwordInput, validPassword);
    await user.type(emailInput, validEmail);
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    // Assert payload
    expect(mockMutate).toHaveBeenCalledWith(
      { currentPassword: validPassword, newEmail: validEmail },
      expect.anything(), // Options object
    );
  });

  // 4. Test Closing on Success
  it("should close dialog on successful submit", async () => {
    // Default beforeEach already sets up successful mutation
    const { user } = renderWithClient(
      <UpdateEmailDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    // Enter valid data
    await user.type(screen.getByLabelText(/current password/i), "password123");
    await user.type(screen.getByLabelText(/new email/i), "valid@email.com");

    const submitButton = screen.getByRole("button", { name: /update email/i });

    // Wrap click, waitFor, and assertions in a single act
    await act(async () => {
      await user.click(submitButton);

      // Wait for mutation mock (which calls onSuccess)
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });

      // Assert dialog close handler was called (inside the same act)
      expect(mockOnOpenChange).toHaveBeenCalledTimes(1);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
