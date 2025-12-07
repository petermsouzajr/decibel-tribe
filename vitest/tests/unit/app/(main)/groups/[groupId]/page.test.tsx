import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react"; // Correct import for waitFor
import userEvent from "@testing-library/user-event";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// --- Mocks ---

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useInfiniteQuery: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/components/posts/Post", () => ({
  default: ({ post }: { post: any }) => (
    <div data-testid={`post-mock-${post.id}`}>Post: {post.content}</div>
  ),
}));

vi.mock("@/components/InfiniteScrollContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="infinite-scroll-mock">{children}</div>
  ),
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Loader2: (props: any) => <div data-testid="loader-mock" {...props} />,
    MoreHorizontal: (props: any) => (
      <div data-testid="more-horizontal-mock" {...props} />
    ),
    UserPlus: (props: any) => <div data-testid="user-plus-mock" {...props} />,
    Trash2: (props: any) => <div data-testid="trash2-mock" {...props} />,
    LucideExternalLink: (props: any) => (
      <div data-testid="external-link-mock" {...props} />
    ), // Assuming this is the leave icon
  };
});

vi.mock("@/app/(main)/groups/GroupList", () => ({
  default: () => <div data-testid="group-list-mock">Group List</div>,
}));

// Mock DropdownMenu components
vi.mock("@/components/ui/dropdown-menu", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/ui/dropdown-menu")>();
  return {
    ...actual,
    DropdownMenu: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dropdown-content-mock">{children}</div>
    ),
    DropdownMenuItem: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
    }) => <button onClick={onClick}>{children}</button>,
  };
});

// Mock Modals using correct relative paths from the component's location
vi.mock("@/app/(main)/groups/[groupId]/AddUserModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-user-modal-mock">Add User Modal</div> : null,
}));
vi.mock("@/app/(main)/groups/[groupId]/DeleteGroupModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="delete-group-modal-mock">Delete Group Modal</div>
    ) : null,
}));
vi.mock("@/app/(main)/groups/[groupId]/LeaveGroupModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="leave-group-modal-mock">Leave Group Modal</div>
    ) : null,
}));

// --- Component Import ---

// Import component AFTER mocks
import GroupPage from "@/app/(main)/groups/[groupId]/page";

// --- Mock Data ---

const mockGroupId = "group-xyz";

const mockGroupData = {
  id: mockGroupId,
  name: "Test Group Name",
  description: "Test group description",
  ownerId: "user-owner-1",
};

const mockPostsPage1 = [
  { id: "post-1", content: "First post content" },
  { id: "post-2", content: "Second post content" },
];

const mockMemberData = {
  userId: "user-member-2",
  role: "MEMBER",
  acceptedInvite: true,
};
const mockAdminData = {
  userId: "user-admin-3",
  role: "ADMIN",
  acceptedInvite: true,
};
const mockOwnerData = {
  userId: "user-owner-1",
  role: "ADMIN",
  acceptedInvite: true,
}; // Owner is implicitly ADMIN role
const mockInvitedUserData = {
  userId: "user-invited-4",
  role: "MEMBER",
  acceptedInvite: false,
};
const mockNullMemberData = null; // For user not associated at all

// --- Test Setup ---

let mockRouterPush = vi.fn();

describe("[Groups][Page] GroupPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRouterPush = vi.fn();

    // Default useRouter mock
    vi.mocked(useRouter).mockReturnValue({
      push: mockRouterPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });

    // Default useQuery / useInfiniteQuery mocks (can be overridden)
    vi.mocked(useQuery).mockImplementation(({ queryKey }) => {
      if (queryKey?.includes("group") && queryKey?.includes(mockGroupId)) {
        return {
          status: "success",
          data: mockGroupData,
          refetch: vi.fn(),
        } as any; // Default group success
      }
      if (
        queryKey?.includes("group-member") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: mockMemberData,
          refetch: vi.fn(),
        } as any; // Default member success
      }
      return { status: "pending", data: undefined, refetch: vi.fn() } as any;
    });
    vi.mocked(useInfiniteQuery).mockImplementation(({ queryKey }) => {
      if (
        queryKey?.includes("group-posts") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: { pages: [{ posts: mockPostsPage1, nextCursor: null }] },
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        } as any; // Default posts success
      }
      return { status: "pending", data: undefined } as any;
    });
  });

  it("should show loading state initially", () => {
    // Arrange: Override the main group query to be pending
    vi.mocked(useQuery).mockImplementation(({ queryKey }) => {
      if (queryKey?.includes("group") && queryKey?.includes(mockGroupId)) {
        return { status: "pending", data: undefined, refetch: vi.fn() } as any; // Set group query to pending
      }
      // Keep others as default (success or pending based on original beforeEach)
      if (
        queryKey?.includes("group-member") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: mockMemberData,
          refetch: vi.fn(),
        } as any;
      }
      return { status: "pending", data: undefined, refetch: vi.fn() } as any;
    });

    // Act: Render
    render(<GroupPage params={Promise.resolve({ groupId: mockGroupId })} />);

    // Assert: Check for loading text
    expect(screen.getByText(/loading group.../i)).toBeInTheDocument();
    // Check that group name/posts are not rendered yet
    expect(screen.queryByText(mockGroupData.name)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`post-mock-${mockPostsPage1[0].id}`),
    ).not.toBeInTheDocument();
  });

  it("should show error state and redirect if group fetch fails", async () => {
    // Arrange: Override group query to return error
    vi.mocked(useQuery).mockImplementation(({ queryKey }) => {
      if (queryKey?.includes("group") && queryKey?.includes(mockGroupId)) {
        return {
          status: "error",
          data: undefined,
          error: new Error("Failed to fetch group"), // Provide an error object
          refetch: vi.fn(),
        } as any; // Set group query to error
      }
      // Keep others as default (success or pending)
      if (
        queryKey?.includes("group-member") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: mockMemberData,
          refetch: vi.fn(),
        } as any;
      }
      return { status: "pending", data: undefined, refetch: vi.fn() } as any;
    });

    // Act: Render
    render(<GroupPage params={Promise.resolve({ groupId: mockGroupId })} />);

    // Assert: Check for error text
    expect(screen.getByText(/group not found./i)).toBeInTheDocument();
    expect(screen.queryByText(/loading group.../i)).not.toBeInTheDocument();

    // Assert: Check router.push was called due to useEffect
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledWith("/groups");
    });
  });

  it("should show invite prompt/button for non-member (invited)", () => {
    // Arrange: Override membership query to return invited user data
    vi.mocked(useQuery).mockImplementation(({ queryKey }) => {
      if (queryKey?.includes("group") && queryKey?.includes(mockGroupId)) {
        return {
          status: "success",
          data: mockGroupData,
          refetch: vi.fn(),
        } as any; // Group success
      }
      if (
        queryKey?.includes("group-member") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: mockInvitedUserData,
          refetch: vi.fn(),
        } as any; // Invited user
      }
      return { status: "pending", data: undefined, refetch: vi.fn() } as any;
    });

    // Act: Render
    render(<GroupPage params={Promise.resolve({ groupId: mockGroupId })} />);

    // Assert: Check group name is visible
    expect(screen.getByText(mockGroupData.name)).toBeInTheDocument();

    // Assert: Check for invite text/button
    expect(
      screen.getByText(/you have been invited to join this group/i),
    ).toBeInTheDocument();
    const acceptButton = screen.getByRole("button", { name: /accept invite/i });
    expect(acceptButton).toBeInTheDocument();

    // Assert: Posts feed NOT rendered
    expect(
      screen.queryByTestId("infinite-scroll-mock"),
    ).not.toBeInTheDocument();
    // Assert: Dropdown NOT rendered
    expect(
      screen.queryByTestId("more-horizontal-mock"),
    ).not.toBeInTheDocument();
  });

  it("should show invite prompt/button for non-member (not associated)", () => {
    // Arrange: Override membership query to return null
    vi.mocked(useQuery).mockImplementation(({ queryKey }) => {
      if (queryKey?.includes("group") && queryKey?.includes(mockGroupId)) {
        return {
          status: "success",
          data: mockGroupData,
          refetch: vi.fn(),
        } as any; // Group success
      }
      if (
        queryKey?.includes("group-member") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: mockNullMemberData,
          refetch: vi.fn(),
        } as any; // Not associated
      }
      return { status: "pending", data: undefined, refetch: vi.fn() } as any;
    });

    // Act: Render
    render(<GroupPage params={Promise.resolve({ groupId: mockGroupId })} />);

    // Assert: Check group name is visible
    expect(screen.getByText(mockGroupData.name)).toBeInTheDocument();

    // Assert: Check for invite text/button
    expect(
      screen.getByText(/you have been invited to join this group/i),
    ).toBeInTheDocument();
    const acceptButton = screen.getByRole("button", { name: /accept invite/i });
    expect(acceptButton).toBeInTheDocument();

    // Assert: Posts feed NOT rendered
    expect(
      screen.queryByTestId("infinite-scroll-mock"),
    ).not.toBeInTheDocument();
    // Assert: Dropdown NOT rendered
    expect(
      screen.queryByTestId("more-horizontal-mock"),
    ).not.toBeInTheDocument();
  });

  it("should render posts and dropdown for a regular member", () => {
    // Arrange: Default mocks (member, group success, posts success)
    render(<GroupPage params={Promise.resolve({ groupId: mockGroupId })} />);

    // Assert: Check group name, description
    expect(screen.getByText(mockGroupData.name)).toBeInTheDocument();
    expect(screen.getByText(mockGroupData.description)).toBeInTheDocument();

    // Assert: Check posts are rendered (using mocks)
    expect(screen.getByTestId("infinite-scroll-mock")).toBeInTheDocument();
    expect(
      screen.getByTestId(`post-mock-${mockPostsPage1[0].id}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`post-mock-${mockPostsPage1[1].id}`),
    ).toBeInTheDocument();
    // Use regex to find content within the mock Post component text
    expect(screen.getByText(/first post content/i)).toBeInTheDocument();

    // Assert: Check dropdown trigger exists
    expect(screen.getByTestId("more-horizontal-mock")).toBeInTheDocument();

    // Assert: Invite prompt/button NOT rendered
    expect(
      screen.queryByText(/you have been invited/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /accept invite/i }),
    ).not.toBeInTheDocument();

    // Assert: Check dropdown content
    expect(screen.getByTestId("dropdown-content-mock")).toBeInTheDocument();
  });

  it("should show 'Leave Group' in dropdown for regular member", async () => {
    const user = userEvent.setup();
    // Arrange: Default mocks (regular member)
    // Get rerender function
    const { rerender } = render(
      <GroupPage params={Promise.resolve({ groupId: mockGroupId })} />,
    );

    // Act: Locate dropdown content
    const dropdownContent = screen.getByTestId("dropdown-content-mock");

    // Assert: Correct items visible within dropdown for member
    const leaveButton = within(dropdownContent).getByRole("button", {
      name: /unjoin group/i,
    });
    // Check icon mock within the button
    expect(
      within(leaveButton).getByTestId("external-link-mock"),
    ).toBeInTheDocument();

    // Assert other role items NOT visible
    expect(
      within(dropdownContent).queryByRole("button", { name: /add user/i }),
    ).not.toBeInTheDocument();
    expect(
      within(dropdownContent).queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();

    // Assert: Modal initially hidden
    expect(
      screen.queryByTestId("leave-group-modal-mock"),
    ).not.toBeInTheDocument();

    // Act: Click Leave Group
    await user.click(leaveButton);

    // Force re-render AFTER the click/state update
    rerender(<GroupPage params={Promise.resolve({ groupId: mockGroupId })} />);

    // Assert: LeaveGroupModal mock is now visible (use waitFor as a precaution)
    await waitFor(() => {
      expect(screen.getByTestId("leave-group-modal-mock")).toBeInTheDocument();
    });
  });

  it("should show 'Add User' and 'Leave Group' in dropdown for admin", async () => {
    const user = userEvent.setup();
    // Arrange: Override membership to admin
    vi.mocked(useQuery).mockImplementation(({ queryKey }) => {
      if (queryKey?.includes("group") && queryKey?.includes(mockGroupId)) {
        return {
          status: "success",
          data: mockGroupData,
          refetch: vi.fn(),
        } as any;
      }
      if (
        queryKey?.includes("group-member") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: mockAdminData,
          refetch: vi.fn(),
        } as any; // ADMIN user
      }
      return { status: "pending", data: undefined, refetch: vi.fn() } as any;
    });
    vi.mocked(useInfiniteQuery).mockImplementation(({ queryKey }) => {
      if (
        queryKey?.includes("group-posts") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: { pages: [{ posts: mockPostsPage1, nextCursor: null }] },
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        } as any;
      }
      return { status: "pending", data: undefined } as any;
    });

    // Act: Render and get rerender function
    const { rerender } = render(
      <GroupPage params={Promise.resolve({ groupId: mockGroupId })} />,
    );

    // Act: Locate dropdown content
    const dropdownContent = screen.getByTestId("dropdown-content-mock");

    // Assert: Correct items visible within dropdown for admin
    const addButton = within(dropdownContent).getByRole("button", {
      name: /add user/i,
    });
    expect(addButton).toBeInTheDocument();
    expect(within(addButton).getByTestId("user-plus-mock")).toBeInTheDocument();

    // Correct button text is "Unjoin Group"
    const leaveButton = within(dropdownContent).getByRole("button", {
      name: /unjoin group/i,
    });
    expect(leaveButton).toBeInTheDocument();
    expect(
      within(leaveButton).getByTestId("external-link-mock"),
    ).toBeInTheDocument();

    // Assert delete NOT visible
    expect(
      within(dropdownContent).queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();

    // Assert: Modal initially hidden
    expect(screen.queryByTestId("add-user-modal-mock")).not.toBeInTheDocument();

    // Act: Click Add User
    await user.click(addButton);

    // Force re-render AFTER the click/state update
    rerender(<GroupPage params={Promise.resolve({ groupId: mockGroupId })} />);

    // Assert: AddUserModal mock is now visible (use waitFor as a precaution)
    await waitFor(() => {
      expect(screen.getByTestId("add-user-modal-mock")).toBeInTheDocument();
    });
  });

  it("should show 'Add User' and 'Delete Group' in dropdown for owner", async () => {
    const user = userEvent.setup();
    // Arrange: Override membership to owner
    vi.mocked(useQuery).mockImplementation(({ queryKey }) => {
      if (queryKey?.includes("group") && queryKey?.includes(mockGroupId)) {
        return {
          status: "success",
          data: mockGroupData,
          refetch: vi.fn(),
        } as any;
      }
      if (
        queryKey?.includes("group-member") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: mockOwnerData,
          refetch: vi.fn(),
        } as any; // OWNER user
      }
      return { status: "pending", data: undefined, refetch: vi.fn() } as any;
    });
    vi.mocked(useInfiniteQuery).mockImplementation(({ queryKey }) => {
      if (
        queryKey?.includes("group-posts") &&
        queryKey?.includes(mockGroupId)
      ) {
        return {
          status: "success",
          data: { pages: [{ posts: mockPostsPage1, nextCursor: null }] },
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        } as any;
      }
      return { status: "pending", data: undefined } as any;
    });

    // Act: Render and get rerender function
    const { rerender } = render(
      <GroupPage params={Promise.resolve({ groupId: mockGroupId })} />,
    ); // Get rerender for later fix

    // Act: Locate dropdown content
    const dropdownContent = screen.getByTestId("dropdown-content-mock");

    // Assert: Correct items visible within dropdown for owner
    const addButton = within(dropdownContent).getByRole("button", {
      name: /add user/i,
    });
    expect(addButton).toBeInTheDocument();
    expect(within(addButton).getByTestId("user-plus-mock")).toBeInTheDocument();

    const deleteButton = within(dropdownContent).getByRole("button", {
      name: /delete/i,
    });
    expect(deleteButton).toBeInTheDocument();
    expect(within(deleteButton).getByTestId("trash2-mock")).toBeInTheDocument();

    // Assert leave NOT visible
    expect(
      within(dropdownContent).queryByRole("button", { name: /unjoin group/i }),
    ).not.toBeInTheDocument();

    // Assert: Modal initially hidden
    expect(
      screen.queryByTestId("delete-group-modal-mock"),
    ).not.toBeInTheDocument();

    // Act: Click Delete Group
    await user.click(deleteButton);

    // Force re-render AFTER the click/state update
    rerender(<GroupPage params={Promise.resolve({ groupId: mockGroupId })} />);

    // Assert: DeleteGroupModal mock is now visible (use waitFor as a precaution)
    await waitFor(() => {
      expect(screen.getByTestId("delete-group-modal-mock")).toBeInTheDocument();
    });
  });
});
