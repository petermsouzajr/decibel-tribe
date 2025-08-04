// src/components/profile/EditProfileDialog.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditProfileDialog from "@/app/(main)/users/[username]/EditProfileDialog";
import { UpdateUserProfileValues } from "@/lib/validation";
import { UserData } from "@/lib/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Import the mocked toast function using an alias
import { mockToastFn } from "@vitest-setup/setupTests";

// Mock react-select/animated
vi.mock("react-select/animated", () => ({ default: () => null }));

// Import skillsList here using alias
import skillsList from "@/data/skillsList.json";

// --- Mocks ---

// Mock fetch for calendar preference
global.fetch = vi.fn();
const mockFetch = fetch as Mock;

// Mock mutation hook
const mockMutate = vi.fn();
vi.mock("@/app/(main)/users/[username]/mutations", () => ({
  useUpdateProfileMutation: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

// Mock useTheme
vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light" })),
}));

// Mock sub-components (keep simple)
vi.mock("@/components/CropImageDialog", () => ({
  default: ({
    onClose,
    onCropped,
  }: {
    onClose: () => void;
    onCropped: (blob: Blob | null) => void;
  }) => (
    <div data-testid="crop-dialog-mock">
      Crop Dialog
      <button
        onClick={() => {
          const mockBlob = new Blob(["mock image data"], {
            type: "image/webp",
          });
          onCropped(mockBlob);
          onClose();
        }}
      >
        Close Crop
      </button>
    </div>
  ),
}));

// --- Mock Data ---
const mockUser: any = {
  id: "user-123",
  displayName: "Test User",
  bio: "This is a bio.",
  avatarUrl: "/test-avatar.png",
  visibility: "PRIVATE", // Default vis before fetch
  userSkills: [{ skill: { name: "Guitar" } }],
  userInstruments: [{ instrument: { name: "Drums" } }],
};

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
describe("[Profile][Component] EditProfileDialog", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Re-evaluate skillOptions before each test, adding type annotation
    let skillOptions: { value: string; label: string }[] = skillsList.map(
      (skill: string) => ({
        value: skill,
        label: skill,
      }),
    );

    // Default mocks
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ calendarPreference: "PUBLIC" }), // Mock pref fetch success
    } as Response);

    mockMutate.mockImplementation((_variables: any, options: any) => {
      // Default success for mutation
      options?.onSuccess?.();
    });
  });

  // 1. Test Rendering with Initial Data
  it("should render form fields with initial user data", async () => {
    // Wrap initial render in act to handle useEffect updates
    await act(async () => {
      renderWithClient(
        <EditProfileDialog
          user={mockUser}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
      );
    });

    // Wait for potential async actions like preference fetch
    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toHaveValue(
        mockUser.displayName,
      );
    });

    expect(screen.getByLabelText(/bio/i)).toHaveValue(mockUser.bio);

    // Visibility switch - check default or fetched value
    // Since fetch returns PUBLIC, it should be checked/on
    await waitFor(() => {
      const visibilitySwitch = screen.getByRole("switch", {
        name: /calendar visibility/i,
      });
      // Need to check the underlying input's checked state or data-state
      // Try aria-checked="true" instead of data-state
      expect(visibilitySwitch).toHaveAttribute("aria-checked", "true");
    });

    // Check avatar
    expect(screen.getByAltText(/avatar preview/i)).toHaveAttribute(
      "src",
      expect.stringContaining("test-avatar.png"), // Check if initial URL is used
    );
  });

  // 2. Test Input Changes
  it("should handle form input changes", async () => {
    const { user } = renderWithClient(
      <EditProfileDialog
        user={mockUser}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    const displayNameInput = screen.getByLabelText(/display name/i);
    const bioInput = screen.getByLabelText(/bio/i);
    const newName = "New Display Name";
    const newBio = "Updated bio.";

    await user.clear(displayNameInput);
    await user.type(displayNameInput, newName);
    await user.clear(bioInput);
    await user.type(bioInput, newBio);

    expect(displayNameInput).toHaveValue(newName);
    expect(bioInput).toHaveValue(newBio);
  });

  // 3. Test Validation Errors
  it("should show validation errors for invalid input", async () => {
    const { user } = renderWithClient(
      <EditProfileDialog
        user={mockUser}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    const displayNameInput = screen.getByLabelText(/display name/i);
    const saveButton = screen.getByRole("button", { name: /save/i });

    // Make display name too long (schema max is 50)
    await user.clear(displayNameInput);
    await user.type(displayNameInput, "a".repeat(51)); // Exceed max 50

    await user.click(saveButton);

    // Check for the correct Zod validation message
    await waitFor(() => {
      expect(
        // Use the exact message from the schema
        screen.getByText("Must be less than 50 characters"),
      ).toBeInTheDocument();
    });

    // Ensure mutation was NOT called
    expect(mockMutate).not.toHaveBeenCalled();
  });

  // 4. Test Successful Submission
  it("should call update mutation with correct data on submit", async () => {
    const { user } = renderWithClient(
      <EditProfileDialog
        user={mockUser}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    const displayNameInput = screen.getByLabelText(/display name/i);
    const bioInput = screen.getByLabelText(/bio/i);
    const saveButton = screen.getByRole("button", { name: /save/i });

    const finalName = "Valid Name";
    const finalBio = "Valid Bio";

    await user.clear(displayNameInput);
    await user.type(displayNameInput, finalName);
    await user.clear(bioInput);
    await user.type(bioInput, finalBio);
    // Assume default visibility (PUBLIC from fetch), skills, instruments are fine

    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    // Assert mutation payload
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({
          displayName: finalName,
          bio: finalBio,
          // Include other fields passed (visibility, skills, instruments)
          visibility: "PUBLIC", // From mocked fetch
          skills: mockUser.userSkills.map((us: any) => us.skill.name),
          instruments: mockUser.userInstruments.map(
            (ui: any) => ui.instrument.name,
          ),
        }),
        avatar: undefined, // No avatar change in this test
      }),
      expect.anything(), // For the options object
    );

    // Ensure dialog closes on success
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // 5. Test Switch Interaction (Calendar Visibility)
  it("should update form state when visibility switch is toggled", async () => {
    const { user } = renderWithClient(
      <EditProfileDialog
        user={mockUser} // Initial state might be PRIVATE before fetch
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    // Wait for initial fetch to complete (mock returns PUBLIC)
    const visibilitySwitch = await screen.findByRole("switch", {
      name: /calendar visibility/i,
    });
    await waitFor(() => {
      expect(visibilitySwitch).toHaveAttribute("aria-checked", "true"); // Starts as PUBLIC
    });

    // Toggle to PRIVATE
    await user.click(visibilitySwitch);
    expect(visibilitySwitch).toHaveAttribute("aria-checked", "false");

    // Submit and check value
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.objectContaining({
            visibility: "PRIVATE", // Check if toggled value is sent
          }),
        }),
        expect.anything(),
      );
    });
  });

  // 6. Test Multi-Select Changes (Skills/Instruments)
  it("should update form state when skills/instruments are changed", async () => {
    const { user } = renderWithClient(
      <EditProfileDialog
        user={mockUser}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    // Wait for initial render/async actions
    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    // Find the FormItem for Skills using the label text, then query within it
    const skillsLabel = screen.getByText(/skills/i);
    const skillsFormItem = skillsLabel.closest(".space-y-2"); // Target FormItem div
    expect(skillsFormItem).toBeInstanceOf(HTMLElement); // Assert it's an HTMLElement
    const skillsSelectInput = within(skillsFormItem as HTMLElement).getByRole(
      "combobox",
    );

    // Find the FormItem for Instruments using the label text, then query within it
    const instrumentsLabel = screen.getByText(/instruments/i);
    const instrumentsFormItem = instrumentsLabel.closest(".space-y-2"); // Target FormItem div
    expect(instrumentsFormItem).toBeInstanceOf(HTMLElement); // Assert it's an HTMLElement
    const instrumentsSelectInput = within(
      instrumentsFormItem as HTMLElement,
    ).getByRole("combobox");

    expect(skillsSelectInput).toBeInTheDocument();
    expect(instrumentsSelectInput).toBeInTheDocument();

    // TODO: Add interaction simulation and assertions here if needed
    // For now, just verifying the selects render is a start.
    // Example: Assert initial values (might need specific queries for react-select value container)
    // expect(within(skillsSelect.parentElement!).getByText('Guitar')).toBeInTheDocument();
    // expect(within(instrumentsSelect.parentElement!).getByText('Drums')).toBeInTheDocument();
  });

  // 7. Test Image Upload Flow
  it("should handle image selection, open crop dialog, and include cropped image in mutation", async () => {
    const { user } = renderWithClient(
      <EditProfileDialog
        user={mockUser}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    // Mock file
    const file = new File(["(⌐□_□)"], "test-avatar.png", { type: "image/png" });
    // Use data-testid to find the hidden input
    const fileInput = screen.getByTestId("avatar-upload-input");

    // Simulate file upload
    await user.upload(fileInput, file);

    // Wait for crop dialog mock to appear
    const cropDialog = await screen.findByTestId("crop-dialog-mock");
    expect(cropDialog).toBeInTheDocument();

    // Simulate closing the crop dialog (assuming cropping happens)
    // In a real test, you'd mock the cropping result via onImageCropped callback
    const closeCropButton = screen.getByRole("button", { name: /close crop/i });
    await user.click(closeCropButton);
    expect(screen.queryByTestId("crop-dialog-mock")).not.toBeInTheDocument();

    // Submit the form
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Wait for mutation and assert avatar data
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          values: expect.anything(), // Other values
          avatar: expect.any(File), // Check if a file object is passed
        }),
        expect.anything(),
      );
    });

    // Check if the avatar file passed has the expected name structure
    const mutationCallArgs = mockMutate.mock.calls[0][0];
    expect(mutationCallArgs.avatar.name).toMatch(/^avatar_user-123.webp$/);
  });

  // 8. Test Calendar Preference Fetch Error
  it("should handle error when fetching calendar visibility preference", async () => {
    // Arrange: Mock fetch to reject
    mockFetch.mockRejectedValueOnce(new Error("API Error"));

    // Wrap in act because state update happens in useEffect
    await act(async () => {
      renderWithClient(
        <EditProfileDialog
          user={mockUser}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
      );
    });

    // Assert: Check if visibility defaults to PRIVATE after error
    const visibilitySwitch = await screen.findByRole("switch", {
      name: /calendar visibility/i,
    });
    // Should default to PRIVATE (unchecked)
    expect(visibilitySwitch).toHaveAttribute("aria-checked", "false");

    // Optionally: Check console error if important
    // expect(console.error).toHaveBeenCalledWith(...)
  });

  // 9. Test Mutation Error Handling
  it("should not close dialog and potentially show error on mutation failure", async () => {
    // Arrange: Mock mutation to call onError
    const mutationError = new Error("Update failed");
    mockMutate.mockImplementation((_variables: any, options: any) => {
      options?.onError?.(mutationError, _variables, undefined); // Simulate error callback
    });

    const { user } = renderWithClient(
      <EditProfileDialog
        user={mockUser}
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
    );

    // Act: Submit the form (assuming valid data initially)
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    // Ensure dialog did NOT close
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);

    // Assert that an error toast was displayed
    expect(mockToastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Error"), // Or a more specific title if known
        description: expect.stringContaining(mutationError.message),
        variant: "destructive",
      }),
    );
  });
});
