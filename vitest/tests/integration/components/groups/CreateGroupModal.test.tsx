// src/components/groups/CreateGroupModal.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

// Mock dependencies BEFORE component import
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

// Re-mock use-toast entirely within the factory
vi.mock("@/components/ui/use-toast", () => {
  // Define implementation locally
  const localMockToast = vi.fn();
  return {
    useToast: vi.fn(() => ({
      toast: localMockToast, // Use local fn
      dismiss: vi.fn(),
      toasts: [],
    })),
    toast: localMockToast, // Export local fn
  };
});

// Mock Shadcn Dialog components to simplify testing
vi.mock("@/components/ui/dialog", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/ui/dialog")>();
  return {
    ...actual,
    Dialog: ({ children, open, onOpenChange }: any) =>
      open ? (
        <div data-testid="dialog-mock" data-state="open">
          {children}
        </div>
      ) : null,
    DialogContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-content-mock">{children}</div>
    ),
    DialogHeader: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DialogTitle: ({ children }: { children: React.ReactNode }) => (
      <h2>{children}</h2>
    ),
    DialogDescription: ({ children }: { children: React.ReactNode }) => (
      <p>{children}</p>
    ),
    DialogFooter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

// Import component AFTER mocks
import CreateGroupModal from "@/app/(main)/groups/CreateGroupModal";
import { CreateGroupModalProps } from "@/app/(main)/groups/CreateGroupModal";

// Typed mocks
const mockUseMutationHook = vi.mocked(useMutation);
const mockUseQueryClientHook = vi.mocked(useQueryClient);

describe("[Groups][Component] CreateGroupModal", () => {
  const mockDismiss = vi.fn();
  const mockInvalidateQueries = vi.fn();
  const mockMutate = vi.fn();
  let mockOnClose: () => void;
  let capturedOptions: any = {}; // To store options passed to useMutation

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose = vi.fn();

    // Mock useMutation to capture options and return mockMutate
    mockUseMutationHook.mockImplementation((options: any) => {
      capturedOptions = options; // Capture component's onSuccess/onError
      return {
        mutate: mockMutate,
        mutateAsync: vi.fn().mockResolvedValue(undefined),
        data: undefined,
        error: null,
        isError: false,
        isIdle: true,
        isPaused: false,
        isSuccess: false,
        status: "idle",
        isPending: false,
        reset: vi.fn(),
        context: undefined,
        failureCount: 0,
        failureReason: null,
        submittedAt: 0,
        variables: undefined,
      };
    });

    mockUseQueryClientHook.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
      getQueryData: vi.fn(),
      setQueryData: vi.fn(),
      cancelQueries: vi.fn(),
    } as any);

    // Default mockMutate: Simulate success, then call captured onSuccess
    mockMutate.mockImplementation(async (variables) => {
      // Simulate API call delay/success
      await Promise.resolve(); // Minimal delay simulation
      const mockData = { id: "new-group-id" };
      // Manually call component's onSuccess if captured
      capturedOptions.onSuccess?.(mockData, variables, undefined);
    });
  });

  const renderModal = () => {
    // Explicitly define props to help TS
    const props: CreateGroupModalProps = {
      open: true,
      onClose: mockOnClose,
    };
    render(<CreateGroupModal {...props} />);
  };

  it("should render the modal with form fields", () => {
    renderModal();
    expect(screen.getByTestId("dialog-content-mock")).toBeInTheDocument();
    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/description \(optional\)/i),
    ).toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: /create group/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should show validation errors on submit with empty fields", async () => {
    const user = userEvent.setup();
    renderModal();
    const submitButton = screen.getByRole("button", { name: /create group/i });
    await user.click(submitButton);
    const validationMessage = await screen.findByText(
      /group name is required/i,
    );
    expect(validationMessage).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should call createGroup mutation with form data on valid submit", async () => {
    const user = userEvent.setup();
    renderModal();
    const nameInput = screen.getByLabelText(/group name/i);
    const descriptionInput = screen.getByLabelText(/description \(optional\)/i);
    const submitButton = screen.getByRole("button", { name: /create group/i });
    const testName = "My Test Group";
    const testDescription = "A description";
    await user.type(nameInput, testName);
    await user.type(descriptionInput, testDescription);

    // Act - Wrap click in act
    await act(async () => {
      await user.click(submitButton);
    });

    // Assert mutation call - Only expect the first argument (values)
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: testName,
        description: testDescription,
      }),
    );

    // Assert onClose is called via onSuccess (needs waitFor)
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should show error toast if createGroup mutation fails", async () => {
    const user = userEvent.setup();
    const { toast: mockToastFn } = await import("@/components/ui/use-toast");
    renderModal();
    const errorMessage = "Failed to create group";
    const error = new Error(errorMessage);

    // Override mockMutate for this test: Simulate failure, then call captured onError
    mockMutate.mockImplementation(async (variables) => {
      try {
        // Simulate API call delay/failure
        await Promise.reject(error);
      } catch (e) {
        // Manually call component's onError if captured
        // This simulates React Query calling the onError callback
        capturedOptions.onError?.(error, variables, undefined);
      }
    });

    const nameInput = screen.getByLabelText(/group name/i);
    const descriptionInput = screen.getByLabelText(/description \(optional\)/i);
    await user.type(nameInput, "Error Group");
    await user.type(descriptionInput, "This group will fail.");

    // Act - Wrap click in act
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /create group/i }));
    });

    // Assert the DESTRUCTIVE toast was called (needs waitFor)
    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          description: errorMessage,
        }),
      );
    });

    // Assert modal did NOT close and queries were not invalidated
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
