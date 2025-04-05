import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event"; // Uncomment
import FollowButton from "./FollowButton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useFollowerInfo from "@/hooks/useFollowerInfo"; // Use default import
import kyInstance from "@/lib/ky"; // Import ky to mock methods
import { useToast } from "./ui/use-toast"; // Import to mock
import { FollowerInfo } from "@/lib/types";

// Mock hooks and modules
// vi.mock("@/hooks/useFollowerInfo"); // Remove this mock
vi.mock("@/lib/ky");
vi.mock("./ui/use-toast");

// Mock return value for useToast
const mockToast = vi.fn();

describe("[Core][Component] FollowButton", () => {
  const userId = "targetUser123";
  const initialFollowerInfo: FollowerInfo = {
    followers: 10,
    isFollowedByUser: false,
  };

  // Cast to any for simplicity
  // const mockUseFollowerInfo = useFollowerInfo as any; // Remove reference to mocked hook
  const mockKyPost = kyInstance.post as any;
  const mockKyDelete = kyInstance.delete as any;
  const mockUseToast = useToast as any;

  // Declare queryClient and wrapper at describe scope
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create a new QueryClient instance for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }, // Disable retries for tests
        mutations: { retry: false },
      },
    });

    // Define wrapper using the test-specific queryClient
    wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Provide default mock implementations
    mockUseToast.mockReturnValue({ toast: mockToast });
    // Default follower info (not following) - Now handled by mocking ky.get
    // mockUseFollowerInfo.mockReturnValue({ data: initialFollowerInfo });
    // Default successful API calls
    mockKyPost.mockResolvedValue({});
    mockKyDelete.mockResolvedValue({});
    // Mock ky.get for useFollowerInfo's initial fetch - Assume endpoint
    (kyInstance.get as any).mockResolvedValue({
      json: () => Promise.resolve(initialFollowerInfo),
    });
  });

  it('should display "Follow" when user is not followed', async () => {
    // Arrange: Mock ky.get to return not following state
    (kyInstance.get as any).mockResolvedValue({
      json: () => Promise.resolve(initialFollowerInfo),
    });
    render(
      <FollowButton userId={userId} initialState={initialFollowerInfo} />,
      { wrapper },
    );
    // Wait for the query to potentially resolve and button to render
    expect(
      await screen.findByRole("button", { name: "Follow" }),
    ).toBeInTheDocument();
  });

  it('should display "Unfollow" when user is followed', async () => {
    // Arrange: Mock ky.get to return following state
    const followingState: FollowerInfo = {
      followers: 11,
      isFollowedByUser: true,
    };
    (kyInstance.get as any).mockResolvedValue({
      json: () => Promise.resolve(followingState),
    });

    render(<FollowButton userId={userId} initialState={followingState} />, {
      wrapper,
    });
    // Wait for the query to potentially resolve and button to render
    expect(
      await screen.findByRole("button", { name: "Unfollow" }),
    ).toBeInTheDocument();
  });

  // Interaction tests need adjustment based on real hook behavior
  it("should call POST API and optimistically update UI on Follow click", async () => {
    const user = userEvent.setup();
    // Arrange: Mock initial fetch
    (kyInstance.get as any).mockResolvedValue({
      json: () => Promise.resolve(initialFollowerInfo),
    });
    render(
      <FollowButton userId={userId} initialState={initialFollowerInfo} />,
      { wrapper },
    );
    const followButton = await screen.findByRole("button", { name: "Follow" });

    // Act
    await user.click(followButton);

    // Assert
    expect(mockKyPost).toHaveBeenCalledTimes(1);
    expect(mockKyPost).toHaveBeenCalledWith(`/api/users/${userId}/followers`);

    // Wait for the optimistic update to reflect in the UI via the real hook
    expect(
      await screen.findByRole("button", { name: "Unfollow" }),
    ).toBeInTheDocument();
  });

  it("should call DELETE API and optimistically update UI on Unfollow click", async () => {
    const user = userEvent.setup();
    // Arrange: Mock initial fetch as following
    const followingState: FollowerInfo = {
      followers: 11,
      isFollowedByUser: true,
    };
    (kyInstance.get as any).mockResolvedValue({
      json: () => Promise.resolve(followingState),
    });
    render(<FollowButton userId={userId} initialState={followingState} />, {
      wrapper,
    });
    const unfollowButton = await screen.findByRole("button", {
      name: "Unfollow",
    });

    // Act
    await user.click(unfollowButton);

    // Assert
    expect(mockKyDelete).toHaveBeenCalledTimes(1);
    expect(mockKyDelete).toHaveBeenCalledWith(`/api/users/${userId}/followers`);

    // Wait for the optimistic update to reflect
    expect(
      await screen.findByRole("button", { name: "Follow" }),
    ).toBeInTheDocument();
  });

  it("should revert UI and show toast on Follow API error", async () => {
    const user = userEvent.setup();
    // Arrange: Mock initial fetch, mock POST failure
    (kyInstance.get as any).mockResolvedValue({
      json: () => Promise.resolve(initialFollowerInfo),
    });
    const apiError = new Error("Failed to follow");
    mockKyPost.mockRejectedValue(apiError);
    render(
      <FollowButton userId={userId} initialState={initialFollowerInfo} />,
      { wrapper },
    );
    const followButton = await screen.findByRole("button", { name: "Follow" });

    // Act
    await user.click(followButton);

    // Assert API call
    expect(mockKyPost).toHaveBeenCalledTimes(1);

    // Wait for UI to revert (button back to Follow) after error
    expect(
      await screen.findByRole("button", { name: "Follow" }),
    ).toBeInTheDocument();

    // Assert toast
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });

  it("should revert UI and show toast on Unfollow API error", async () => {
    const user = userEvent.setup();
    // Arrange: Mock initial fetch as following, mock DELETE failure
    const followingState: FollowerInfo = {
      followers: 11,
      isFollowedByUser: true,
    };
    (kyInstance.get as any).mockResolvedValue({
      json: () => Promise.resolve(followingState),
    });
    const apiError = new Error("Failed to unfollow");
    mockKyDelete.mockRejectedValue(apiError);
    render(<FollowButton userId={userId} initialState={followingState} />, {
      wrapper,
    });
    const unfollowButton = await screen.findByRole("button", {
      name: "Unfollow",
    });

    // Act: Click Unfollow
    await user.click(unfollowButton);

    // Assert API call
    expect(mockKyDelete).toHaveBeenCalledTimes(1);

    // Wait for UI to revert (button back to Unfollow)
    expect(
      await screen.findByRole("button", { name: "Unfollow" }),
    ).toBeInTheDocument();

    // Assert toast
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });
});
