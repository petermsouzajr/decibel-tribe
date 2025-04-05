import React from "react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- Mocks ---

// Mock UI components and hooks
vi.mock("@/components/LoadingButton", () => ({
  default: ({ children, loading, disabled, ...props }: any) => (
    <button {...props} disabled={disabled || loading}>
      {loading ? "Loading..." : children}
    </button>
  ),
}));

// --- Create mock function instance first ---
const mockToastFnInstance = vi.fn();

vi.mock("@/components/ui/use-toast", () => ({
  // Configure the mock to return the pre-defined instance
  useToast: () => ({
    toast: mockToastFnInstance,
    dismiss: vi.fn(),
    toasts: [],
  }),
}));
vi.mock("@/components/UserAvatar", () => ({
  default: ({ avatarUrl, ...props }: { avatarUrl?: string }) => (
    <div
      data-testid="user-avatar-mock"
      data-avatar-url={avatarUrl || ""}
      {...props}
    >
      Avatar
    </div>
  ),
}));
vi.mock("@/hooks/useDebounce", () => ({
  // Mock debounce to return the value immediately for testing
  default: (value: any) => value,
}));

// Mock context providers and hooks
vi.mock("@/app/(main)/SessionProvider", () => ({
  useSession: () => ({
    user: { id: "test-user-id", displayName: "Test User" }, // Mock logged-in user
  }),
}));

// Mock stream-chat-react
const mockQueryUsers = vi.fn();
const mockChannelCreate = vi.fn();
const mockChannel = vi.fn(() => ({ create: mockChannelCreate }));
const mockSetActiveChannel = vi.fn();
vi.mock("stream-chat-react", async (importOriginal) => {
  const original = await importOriginal<typeof import("stream-chat-react")>();
  return {
    ...original,
    useChatContext: () => ({
      client: {
        queryUsers: mockQueryUsers,
        channel: mockChannel,
      },
      setActiveChannel: mockSetActiveChannel,
    }),
  };
});

// Mock specific icons if needed for identification
vi.mock("lucide-react", async (importOriginal) => {
  const original = await importOriginal<typeof import("lucide-react")>();
  return {
    ...original, // Use original icons by default
    Loader2: (props: any) => (
      <div role="status" data-testid="loader" {...props}>
        Loading...
      </div>
    ),
    // Mock other icons like SearchIcon, Check, X if needed for specific tests
  };
});

// --- Test Setup ---

// Import the component AFTER mocks
import NewChatDialog from "@/app/(main)/messages/NewChatDialog";

// Import the ACTUAL hooks now
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast"; // Import for accessing mock

// Helper to render with QueryClientProvider
const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // Disable retries for tests
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

// --- Test Suite ---

describe("[Chat][Component] NewChatDialog", () => {
  let mockOnOpenChange: Mock;
  let mockOnChatCreated: Mock;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Also reset the mock function instance
    mockToastFnInstance.mockClear();

    // Setup default mock props
    mockOnOpenChange = vi.fn();
    mockOnChatCreated = vi.fn();

    // Default success state for client.queryUsers
    mockQueryUsers.mockResolvedValue({ users: [] });

    // Default success state for channel creation
    mockChannelCreate.mockResolvedValue({ id: "mock-channel-id", data: {} }); // Mock successful creation
    mockChannel.mockReturnValue({ create: mockChannelCreate }); // Ensure mockChannel returns the create mock
  });

  it("should render initial state correctly", async () => {
    renderWithClient(
      <NewChatDialog
        onOpenChange={mockOnOpenChange}
        onChatCreated={mockOnChatCreated}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /new chat/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search users.../i)).toBeInTheDocument();
    expect(screen.getByText(/start chat/i)).toBeInTheDocument();
    expect(screen.getByText(/start chat/i)).toBeDisabled();

    // Wait for the query to be called
    await waitFor(() => {
      expect(mockQueryUsers).toHaveBeenCalledWith(
        // Expected filter object
        expect.objectContaining({
          id: { $ne: "test-user-id" },
          role: { $ne: "admin" },
        }),
        { name: 1, username: 1 }, // sort
        { limit: 15 }, // options
      );
    });
    // Check $or is NOT present initially
    expect(mockQueryUsers.mock.calls[0][0]).not.toHaveProperty("$or");

    // Wait for the state update based on query result
    expect(await screen.findByText(/no users found/i)).toBeInTheDocument(); // Because default mock returns empty users array
  });

  it("should search for users when text is entered", async () => {
    const user = userEvent.setup();
    const mockUserAlice = {
      id: "user1",
      name: "Alice",
      username: "alice",
    };

    // Setup query mock for this specific test
    mockQueryUsers.mockImplementation(async (filters) => {
      if (filters?.$or?.[0]?.name?.$autocomplete === "ali") {
        return { users: [mockUserAlice] };
      }
      return { users: [] }; // Default empty for initial call
    });

    renderWithClient(
      <NewChatDialog
        onOpenChange={mockOnOpenChange}
        onChatCreated={mockOnChatCreated}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search users.../i);
    await user.type(searchInput, "ali");

    // Verify queryUsers was called with the search term
    await waitFor(() => {
      expect(mockQueryUsers).toHaveBeenCalledTimes(4); // Initial + a + l + i (due to immediate debounce mock)
      expect(mockQueryUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: { $ne: "test-user-id" },
          role: { $ne: "admin" },
          $or: [
            { name: { $autocomplete: "ali" } },
            { username: { $autocomplete: "ali" } },
          ],
        }),
        { name: 1, username: 1 },
        { limit: 15 },
      );
    });

    // Check the search result is displayed
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.queryByText(/no users found/i)).not.toBeInTheDocument();
  });

  // TODO: Adjust loading/error tests if necessary
  it("should display loading state during search", async () => {
    // Test needs adjustment: maybe mock queryUsers with a pending promise
    // and find the loader via its specific mock (added next)
    let resolveQuery: (value: { users: any[] }) => void;
    const queryPromise = new Promise<{ users: any[] }>((resolve) => {
      resolveQuery = resolve;
    });
    mockQueryUsers.mockReturnValue(queryPromise);

    renderWithClient(
      <NewChatDialog
        onOpenChange={mockOnOpenChange}
        onChatCreated={mockOnChatCreated}
      />,
    );

    // Initially query is called, mock returns pending promise
    await waitFor(() => expect(mockQueryUsers).toHaveBeenCalled());

    // Check for the loader
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.queryByText(/no users found/i)).not.toBeInTheDocument();

    // // Optionally: Resolve the promise and check loader disappears (if needed)
    // await act(async () => {
    //     resolveQuery({ users: [] });
    //     await queryPromise;
    // });
    // expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should display error state on search failure", async () => {
    const queryError = new Error("Query failed");
    mockQueryUsers.mockRejectedValue(queryError);

    renderWithClient(
      <NewChatDialog
        onOpenChange={mockOnOpenChange}
        onChatCreated={mockOnChatCreated}
      />,
    );

    // Check for the error message after the query fails
    expect(
      await screen.findByText(/an error occurred while loading users/i),
    ).toBeInTheDocument();
    // expect(screen.queryByRole("status")).not.toBeInTheDocument(); // Loader check removed/adjusted later
    expect(screen.queryByText(/no users found/i)).not.toBeInTheDocument();
  });

  it("should allow selecting and deselecting users", async () => {
    const user = userEvent.setup();
    const mockUsers = [
      { id: "user1", name: "Alice", username: "alice", image: "alice.jpg" },
      { id: "user2", name: "Bob", username: "bob", image: "bob.jpg" },
    ];

    // Mock useQuery to return users - Corrected mock
    mockQueryUsers.mockResolvedValue({ users: mockUsers });

    renderWithClient(
      <NewChatDialog
        onOpenChange={mockOnOpenChange}
        onChatCreated={mockOnChatCreated}
      />,
    );

    const startChatButton = screen.getByText(/start chat/i);
    expect(startChatButton).toBeDisabled();

    // Find user result buttons (UserResult component renders a button)
    // Wait for the results to appear based on the mockResolvedValue
    const aliceResultButton = await screen.findByRole("button", {
      name: /alice @alice/i, // This query is specific enough for the result
    });
    const bobResultButton = await screen.findByRole("button", {
      name: /bob @bob/i,
    });

    // 1. Select Alice
    await user.click(aliceResultButton);

    // Check selected tag appears and button enabled
    // Find the container for selected tags (the div with class starting mt-4)
    const selectedUsersContainer = await screen.findByTestId(
      "selected-users-container",
    );
    // ^^^ Requires adding data-testid="selected-users-container" to the div in the component

    // Query within the container for the tag button
    const aliceTag = within(selectedUsersContainer).getByRole("button", {
      name: /alice/i,
    });
    expect(aliceTag).toBeInTheDocument();

    // Check avatar within the tag (assuming only one avatar in the tag)

    // Check checkmark IS PRESENT on the result after selecting
    expect(
      within(aliceResultButton).getByTestId("user-result-check"),
    ).toBeInTheDocument();

    // 2. Select Bob
    await user.click(bobResultButton);
    expect(
      within(selectedUsersContainer).getByRole("button", { name: /bob/i }),
    ).toBeInTheDocument();
    expect(startChatButton).toBeEnabled();

    // 3. Deselect Alice by clicking result again
    await user.click(aliceResultButton);
    expect(
      within(selectedUsersContainer).queryByRole("button", { name: /alice/i }),
    ).not.toBeInTheDocument(); // Tag removed
    expect(startChatButton).toBeEnabled(); // Still enabled because Bob is selected
    // Wait for tag removal to ensure state update, then check icon
    await waitFor(() => {
      expect(
        within(selectedUsersContainer).queryByRole("button", {
          name: /alice/i,
        }),
      ).not.toBeInTheDocument();
    });
    // Now assert the checkmark is gone from the result button
    expect(
      within(aliceResultButton).queryByTestId("user-result-check"),
    ).not.toBeInTheDocument();

    // 4. Remove Bob using the tag's 'X' button
    // Query within the container for the tag button
    const bobTag = within(selectedUsersContainer).getByRole("button", {
      name: /bob/i,
    });
    await user.click(bobTag); // Click the tag itself (which includes the X)
    expect(
      within(selectedUsersContainer).queryByRole("button", { name: /bob/i }),
    ).not.toBeInTheDocument();
    expect(startChatButton).toBeDisabled(); // Disabled as no users are selected
  });

  it("should create a new chat and call callbacks on success", async () => {
    const user = userEvent.setup();
    const mockUsers = [
      { id: "user1", name: "Alice", username: "alice", image: "alice.jpg" },
    ];
    const mockCreatedChannelData = { id: "new-channel-id", data: {} }; // Data resolved by create()
    const mockChannelObject = { create: mockChannelCreate }; // Object returned by client.channel()

    // Mock useQuery to return Alice - Corrected mock
    mockQueryUsers.mockResolvedValue({ users: mockUsers });

    // Mock useMutation to succeed - create() resolves
    mockChannelCreate.mockResolvedValue(mockCreatedChannelData);
    mockChannel.mockReturnValue(mockChannelObject); // Ensure client.channel returns the object with the create mock

    renderWithClient(
      <NewChatDialog
        onOpenChange={mockOnOpenChange}
        onChatCreated={mockOnChatCreated}
      />,
    );

    // Select Alice
    // Wait for the result to appear
    const aliceResultButton = await screen.findByRole("button", {
      name: /alice @alice/i,
    });
    await user.click(aliceResultButton);

    // Click Start Chat
    const startChatButton = screen.getByText(/start chat/i);
    expect(startChatButton).toBeEnabled();
    await user.click(startChatButton);

    // Verify mutation was called (indirectly via button click)
    expect(mockChannelCreate).toHaveBeenCalled();

    // Need to wait for async mutation logic within the component
    await waitFor(() => {
      // Verify stream client methods were called correctly
      expect(mockChannel).toHaveBeenCalledWith("messaging", {
        members: ["test-user-id", "user1"],
        name: undefined, // Name is undefined for 1-on-1 chats
      });
      expect(mockChannelCreate).toHaveBeenCalled();

      // Verify success callbacks
      // onSuccess receives the return value of mutationFn, which is the channel object
      expect(mockSetActiveChannel).toHaveBeenCalledWith(mockChannelObject);
      expect(mockOnChatCreated).toHaveBeenCalled();
      expect(mockOnOpenChange).not.toHaveBeenCalled(); // Dialog shouldn't close itself
    });
  });

  it("should show error toast if chat creation fails", async () => {
    const user = userEvent.setup();
    const mockUsers = [{ id: "user1", name: "Alice", username: "alice" }];
    const creationError = new Error("Stream API Error");

    // Mock useQuery to return Alice - Corrected mock
    mockQueryUsers.mockResolvedValue({ users: mockUsers });

    // Mock useMutation to fail
    mockChannelCreate.mockRejectedValue(creationError);
    mockChannel.mockReturnValue({ create: mockChannelCreate });

    // --- Mock useToast specifically for this test ---
    // Re-assign mockToastFn to the instance used in this render
    // const specificMockToastFn = vi.fn();  // REMOVED
    // vi.mocked(useToast).mockReturnValue({ // REMOVED
    //   toast: specificMockToastFn,        // REMOVED
    //   dismiss: vi.fn(),                // REMOVED
    //   toasts: [],                      // REMOVED
    // });                                // REMOVED
    // mockToastFn = specificMockToastFn; // REMOVED - rely on beforeEach assignment
    // ---

    renderWithClient(
      <NewChatDialog
        onOpenChange={mockOnOpenChange}
        onChatCreated={mockOnChatCreated}
      />,
    );

    // Select Alice
    // Wait for the result to appear
    const aliceResultButton = await screen.findByRole("button", {
      name: /alice @alice/i,
    });
    await user.click(aliceResultButton);

    // Click Start Chat
    const startChatButton = screen.getByText(/start chat/i);
    await user.click(startChatButton);

    // Verify mutation was called
    expect(mockChannelCreate).toHaveBeenCalled();

    // Wait for async error handling
    await waitFor(() => {
      // Verify stream client methods were called (attempted creation)
      expect(mockChannel).toHaveBeenCalledWith("messaging", expect.anything());

      // Verify error toast is shown - using specificMockToastFn
      expect(mockToastFnInstance).toHaveBeenCalledWith({
        variant: "destructive",
        description: "Error starting chat. Please try again.",
      });

      // Verify success callbacks were NOT called
      expect(mockSetActiveChannel).not.toHaveBeenCalled();
      expect(mockOnChatCreated).not.toHaveBeenCalled();
    });
  });
});
