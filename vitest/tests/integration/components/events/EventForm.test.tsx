import React from "react";
import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { User } from "lucia"; // Import the actual User type

// Import the component being tested (the page)
import EventFormPage from "@/app/(main)/events/edit/page";

// Import hooks and types used
import { useSession } from "@/app/(main)/SessionProvider";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useAddEventMutation,
  useEditEventMutation,
} from "@/app/(main)/calendar/mutations";
import { CreateEventValues } from "@/lib/validation";

// --- Mocks ---
vi.mock("@/app/(main)/SessionProvider");
vi.mock("next/navigation");
vi.mock("@/app/(main)/calendar/mutations");

global.fetch = vi.fn();

// Type casts for mocks
const mockUseSession = useSession as MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as MockedFunction<
  typeof useSearchParams
>;
const mockUseAddEventMutation = useAddEventMutation as MockedFunction<
  typeof useAddEventMutation
>;
const mockUseEditEventMutation = useEditEventMutation as MockedFunction<
  typeof useEditEventMutation
>;
const mockFetch = fetch as MockedFunction<typeof fetch>;

// Mock return values
const mockPush = vi.fn();
const mockAddMutate = vi.fn();
const mockEditMutate = vi.fn();

// Complete mock user matching Lucia User type
const mockLuciaUser: User = {
  id: "user-1",
  username: "testuser",
  displayName: "Test User",
  avatarUrl: null,
  googleId: null,
  // passwordHash is likely not part of the direct User type for sessions
  // bio, createdAt, _count, userInstruments, userSkills, userPreferences are likely Prisma fields, not Lucia User session fields
};

// NOTE: This file tests the logic within src/app/(main)/events/edit/page.tsx
// It should ideally be renamed to match that path.
describe("[Event][Page] Event Form Page", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks for create mode
    mockUseSession.mockReturnValue({
      user: mockLuciaUser, // Use the Lucia-specific mock user
      session: {} as any,
    });
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
    mockUseSearchParams.mockReturnValue({
      get: vi.fn().mockImplementation((param: string) => {
        if (param === "id") return null; // Simulate create mode (no eventId)
        if (param === "date") return null; // Simulate no pre-filled date
        return null;
      }),
    } as any);
    mockUseAddEventMutation.mockReturnValue({ mutate: mockAddMutate } as any);
    mockUseEditEventMutation.mockReturnValue({ mutate: mockEditMutate } as any);

    // Default fetch mock (e.g., for preferences)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ calendarPreference: "PRIVATE" }), // Default preference
    } as Response);
  });

  // Unskip the first test
  it("should render form fields correctly in create mode", async () => {
    render(<EventFormPage />);

    // Wait for potentially async loading/preference fetching to settle
    // Check for a key element like the title field
    await screen.findByLabelText(/title/i);

    // Assertions for key fields
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/when/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/performer 1/i)).toBeInTheDocument(); // First performer input
    expect(screen.getByLabelText(/visibility/i)).toBeInTheDocument();
    // Find the checkbox by its role instead of a non-existent label
    expect(screen.getByRole("checkbox")).toBeInTheDocument();

    // Check for Create/Publish buttons (not Edit)
    expect(
      screen.getByRole("button", { name: /save as draft/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /publish event/i }),
    ).toBeInTheDocument();
  });

  it("should render form fields correctly in edit mode (with initial values)", async () => {
    const mockEventId = "evt-123";
    const mockFetchedEvent = {
      id: mockEventId,
      title: "Existing Event",
      location: "Existing Location",
      description: "Existing Desc",
      url: "http://existing.com",
      when: new Date("2025-10-10T00:00:00.000Z").toISOString(), // Use ISO string as API would return
      startTime: "14:00",
      endTime: "15:00",
      performers: ["Existing Performer"],
      status: "DRAFT",
      visibility: "PUBLIC",
      isCancelled: false,
    };

    // Override mocks for edit mode
    mockUseSearchParams.mockReturnValue({
      get: vi.fn().mockImplementation((param: string) => {
        if (param === "id") return mockEventId;
        return null;
      }),
    } as any);

    // Mock fetch for event data AND preferences
    mockFetch
      .mockResolvedValueOnce({
        // Preferences fetch
        ok: true,
        json: async () => ({ calendarPreference: "PRIVATE" }),
      } as Response)
      .mockResolvedValueOnce({
        // Event data fetch
        ok: true,
        json: async () => mockFetchedEvent,
      } as Response);

    render(<EventFormPage />);

    // Wait for form to populate after fetch
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue(
        mockFetchedEvent.title,
      );
    });

    // Assert other fields
    expect(screen.getByLabelText(/location/i)).toHaveValue(
      mockFetchedEvent.location,
    );
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      mockFetchedEvent.description,
    );
    expect(screen.getByLabelText(/url/i)).toHaveValue(mockFetchedEvent.url);
    expect(screen.getByLabelText(/when/i)).toHaveValue("2025-10-10"); // Check date format
    expect(screen.getByLabelText(/start time/i)).toHaveValue(
      mockFetchedEvent.startTime,
    );
    expect(screen.getByLabelText(/end time/i)).toHaveValue(
      mockFetchedEvent.endTime,
    );
    expect(screen.getByLabelText(/performer 1/i)).toHaveValue(
      mockFetchedEvent.performers[0],
    );
    // Visibility switch requires checking aria-checked based on mockFetchedEvent.visibility
    // Since mockFetchedEvent.visibility is PUBLIC, the switch should be checked.
    expect(screen.getByRole("switch", { name: /visibility/i })).toBeChecked();
    expect(screen.getByRole("checkbox")).not.toBeChecked(); // isCancelled

    // Check for Update buttons
    expect(
      screen.getByRole("button", { name: /update as draft/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update as published/i }),
    ).toBeInTheDocument();
  });

  it("should show validation errors on invalid input", async () => {
    const user = userEvent.setup();
    render(<EventFormPage />);

    // Ensure form is rendered
    await screen.findByLabelText(/title/i);

    // Try submitting the empty form (use Publish button)
    const publishButton = screen.getByRole("button", {
      name: /publish event/i,
    });
    await user.click(publishButton);

    // Assert validation errors appear for required fields based on schema
    // expect(await screen.findByText(/title is required/i)).toBeInTheDocument(); // Title is optional
    expect(
      await screen.findByText(/location is required/i),
    ).toBeInTheDocument();
    // expect(await screen.findByText(/date is required/i)).toBeInTheDocument(); // Date has min value, not simple required
    expect(
      await screen.findByText(/start time is required/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/end time is required/i),
    ).toBeInTheDocument();

    // Check specific format error (e.g., invalid URL)
    // URL validation not present in schema, remove this check
    // await user.type(screen.getByLabelText(/url/i), "invalid-url");
    // await user.click(publishButton); // Submit again
    // expect(await screen.findByText(/invalid url format/i)).toBeInTheDocument();
  });

  it("should disable submit buttons during submission", async () => {
    const user = userEvent.setup();

    // Mock mutation to simulate delay
    let resolveMutation: () => void;
    const mutationPromise = new Promise<void>((resolve) => {
      resolveMutation = resolve;
    });
    mockEditMutate.mockImplementation(() => mutationPromise); // Mock edit mutation

    render(<EventFormPage />);

    // Fill required fields to make form valid
    await user.type(screen.getByLabelText(/title/i), "Valid Title");
    await user.type(screen.getByLabelText(/location/i), "Valid Location");
    // Use fireEvent.change for date input
    fireEvent.change(screen.getByLabelText(/when/i), {
      target: { value: "2025-11-11" },
    });
    await user.type(screen.getByLabelText(/start time/i), "10:00");
    await user.type(screen.getByLabelText(/end time/i), "11:00");

    const draftButton = screen.getByRole("button", { name: /save as draft/i });
    const publishButton = screen.getByRole("button", {
      name: /publish event/i,
    });

    // Buttons should be enabled initially (after filling form)
    expect(draftButton).toBeEnabled();
    expect(publishButton).toBeEnabled();

    // Click one button (e.g., Publish)
    await user.click(publishButton);

    // Assert buttons are disabled immediately after click
    await waitFor(() => {
      expect(draftButton).toBeDisabled();
      expect(publishButton).toBeDisabled();
    });

    // Resolve mutation and wait for it to settle
    await act(async () => {
      resolveMutation();
      await mutationPromise;
    });

    // Optional: Assert buttons are re-enabled (depends on component logic after success/error)
    // The component currently redirects on success, so re-enabling might not be testable here.
  });

  it("should call create mutation with correct data on draft submit (create mode)", async () => {
    const user = userEvent.setup();
    render(<EventFormPage />);

    const formData = {
      title: "Draft Event",
      location: "Draft Location",
      description: "Draft Desc",
      url: "http://draft.com",
      when: "2025-12-01",
      startTime: "09:00",
      endTime: "10:00",
      performer: "Draft Performer",
    };

    // Fill form
    await user.type(screen.getByLabelText(/title/i), formData.title);
    await user.type(screen.getByLabelText(/location/i), formData.location);
    await user.type(
      screen.getByLabelText(/description/i),
      formData.description,
    );
    await user.type(screen.getByLabelText(/url/i), formData.url);
    // Use fireEvent.change for date input
    fireEvent.change(screen.getByLabelText(/when/i), {
      target: { value: formData.when }, // formData.when is "2025-12-01"
    });
    await user.type(screen.getByLabelText(/start time/i), formData.startTime);
    await user.type(screen.getByLabelText(/end time/i), formData.endTime);
    await user.type(screen.getByLabelText(/performer 1/i), formData.performer);

    // Submit as Draft
    const draftButton = screen.getByRole("button", { name: /save as draft/i });
    await user.click(draftButton);

    // Assert create mutation called with correct data
    await waitFor(() => {
      expect(mockAddMutate).toHaveBeenCalledTimes(1);
      expect(mockAddMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: formData.title,
          location: formData.location,
          description: formData.description,
          url: formData.url,
          when: new Date(formData.when + "T00:00:00"), // Ensure date object is passed
          startTime: formData.startTime,
          endTime: formData.endTime,
          performers: [formData.performer],
          status: "DRAFT", // Crucial check for draft save
          visibility: "PRIVATE", // Default/mocked preference
          isCancelled: false,
        }),
        expect.any(Object), // Options object for mutate
      );
    });

    // Ensure edit mutation was NOT called
    expect(mockEditMutate).not.toHaveBeenCalled();
  });

  it("should call update mutation with correct data on submit (edit mode)", async () => {
    const user = userEvent.setup();
    const mockEventId = "evt-456";
    const mockExistingEvent = {
      id: mockEventId,
      title: "Old Title",
      location: "Old Location",
      when: new Date("2025-01-01T00:00:00.000Z").toISOString(), // This base date doesn't matter as much now
      startTime: "11:00",
      endTime: "12:00",
      performers: ["Old Performer"],
      status: "DRAFT",
      visibility: "PRIVATE",
      isCancelled: false,
      // Other fields as needed by form reset
      description: "",
      url: "",
    };
    const updatedTitle = "Updated Title";

    // Setup mocks for edit mode
    mockUseSearchParams.mockReturnValue({
      get: vi
        .fn()
        .mockImplementation((param: string) =>
          param === "id" ? mockEventId : null,
        ),
    } as any);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ calendarPreference: "PRIVATE" }),
      } as Response) // Preferences
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockExistingEvent,
      } as Response); // Event data

    render(<EventFormPage />);

    // Wait for form to populate
    const titleInput = await screen.findByLabelText(/title/i);
    expect(titleInput).toHaveValue(mockExistingEvent.title);

    // Update fields using fireEvent.change
    fireEvent.change(titleInput, { target: { value: updatedTitle } });

    // --- Calculate tomorrow's date ---
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setHours(0, 0, 0, 0); // Set time to midnight UTC for consistent date object comparison
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split("T")[0]; // Format YYYY-MM-DD
    // --- End Calculate tomorrow's date ---

    fireEvent.change(screen.getByLabelText(/when/i), {
      target: { value: tomorrowDateString }, // Use tomorrow's date string
    });

    // Wait for RHF to process changes and potentially update validity
    await waitFor(() => {
      expect(titleInput).toHaveValue(updatedTitle);
    });

    // Submit (e.g., Update as Published)
    const updateButton = screen.getByRole("button", {
      name: /update as published/i,
    });
    // Ensure button is enabled before clicking (helps debug if validation is the issue)
    expect(updateButton).toBeEnabled();
    await user.click(updateButton);

    // Assert update mutation called with correct data
    await waitFor(() => {
      expect(mockEditMutate).toHaveBeenCalledTimes(1);
      expect(mockEditMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          // Explicitly list expected fields based on component logic and schema
          eventId: mockEventId,
          title: updatedTitle,
          location: mockExistingEvent.location,
          description: mockExistingEvent.description, // Should be passed even if empty
          url: mockExistingEvent.url, // Should be passed even if empty
          when: tomorrow, // Assert Date object for tomorrow (at midnight UTC)
          startTime: mockExistingEvent.startTime,
          endTime: mockExistingEvent.endTime,
          performers: mockExistingEvent.performers, // Include performers
          status: "PUBLISHED", // Status set by button click
          visibility: mockExistingEvent.visibility, // Should retain original visibility unless changed
          isCancelled: mockExistingEvent.isCancelled,
        }),
        expect.any(Object), // Options object for mutate
      );
    });

    // Ensure add mutation was NOT called
    expect(mockAddMutate).not.toHaveBeenCalled();
  });
});
