// src/components/groups/GroupPage.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky"; // Assuming direct import
import { GroupMembershipData, PostData } from "@/lib/types";

// Mock dependencies BEFORE component import
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useInfiniteQuery: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));
vi.mock("@/lib/ky"); // Mock the whole ky instance module if used directly
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Loader2: (props: any) => <div data-testid="loader-mock" {...props} />,
    MoreHorizontal: (props: any) => (
      <button data-testid="more-button-mock" {...props} /> // Make it clickable
    ),
    UserPlus: (props: any) => (
      <div data-testid="userplus-icon-mock" {...props} />
    ),
    Trash2: (props: any) => <div data-testid="trash-icon-mock" {...props} />,
    LucideExternalLink: (props: any) => (
      <div data-testid="external-link-icon-mock" {...props} />
    ),
  };
});
vi.mock("@/components/posts/Post", () => ({
  default: ({ post }: { post: PostData }) => (
    <div data-testid={`post-${post.id}`}>Mock Post: {post.content}</div>
  ),
}));
vi.mock("@/components/InfiniteScrollContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="infinite-scroll-mock">{children}</div>
  ),
}));
vi.mock("./AddUserModal", () => ({
  // Mocking the specific relative path
  default: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="add-user-modal-mock">Add User Modal Mock</div>
    ) : null,
}));
vi.mock("./DeleteGroupModal", () => ({
  // Mocking the specific relative path
  default: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="delete-group-modal-mock">Delete Group Modal Mock</div>
    ) : null,
}));
vi.mock("./LeaveGroupModal", () => ({
  // Mocking the specific relative path
  default: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="leave-group-modal-mock">Leave Group Modal Mock</div>
    ) : null,
}));
vi.mock("@/app/(main)/groups/GroupList", () => ({
  // Mocking the specific relative path
  default: () => <div data-testid="group-list-mock">Group List Mock</div>,
}));

// Import component AFTER mocks
import GroupPage from "@/app/(main)/groups/[groupId]/page";

// Typed mocks
const mockUseQuery = vi.mocked(useQuery);
const mockUseInfiniteQuery = vi.mocked(useInfiniteQuery);
const mockUseRouter = vi.mocked(useRouter);
const mockKyPost = vi.mocked(kyInstance.post); // Assuming post is used for accept invite

// --- Mock Data ---
const mockGroupId = "group-123";
const mockUserId = "user-abc";
const mockOwnerId = "user-owner";

const mockSimpleUser = {
  id: "user-1",
  username: "postuser1",
  displayName: "Post User 1",
  avatarUrl: null,
};

const mockPostUser = {
  // Satisfies UserWithFollowerStatus (add missing fields)
  ...mockSimpleUser,
  bio: null,
  createdAt: new Date(),
  email: "user@example.com", // Placeholder
  passwordHash: "", // Placeholder
  emailVerified: true,
  googleId: null,
  deletedAt: null,
  followerCount: 0,
  followingCount: 0,
  isFollowing: false,
  _count: { posts: 1, followers: 0, following: 0 }, // Placeholder counts
  // Add missing relation fields
  userPreferences: null,
  userInstruments: [],
  userSkills: [],
  followers: [],
  following: [], // Also add 'following' if it exists on the type
  isDatingActive: false,
  user_dating_preferences: null,
};

const mockGroupDetails = {
  id: mockGroupId,
  name: "Test Group Name",
  description: "Test group description here.",
  ownerId: mockOwnerId,
};

const mockPost1: PostData = {
  id: "post-1",
  content: "This is the first post in the group.",
  createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
  updatedAt: new Date(Date.now() - 1000 * 60 * 10), // Add updatedAt, same as createdAt
  user: mockPostUser, // Author
  Group: { id: mockGroupId, name: mockGroupDetails.name }, // Capitalize Group
  likes: [],
  dislikes: [], // Add missing dislikes array
  bookmarks: [], // Keep bookmarks array for PostData type
  _count: { likes: 5, dislikes: 0, comments: 1 },
  attachments: [], // RENAME mediaItems to attachments
  userId: mockPostUser.id, // Add missing userId
  groupId: mockGroupId, // Add missing groupId
};

const mockPostsPage1 = {
  posts: [mockPost1],
  nextCursor: null,
};

// Add missing fields to satisfy GroupMembershipData & { group: ..., user: ... }
const mockMembershipIsMember: GroupMembershipData = {
  id: "gm-member-1", // Add missing base ID
  userId: mockUserId,
  groupId: mockGroupId,
  role: "MEMBER",
  acceptedInvite: true,
  joinedAt: new Date(), // Add missing field
  group: mockGroupDetails, // Add missing field
  user: mockSimpleUser, // Add missing field (simple user is likely enough here)
};

const mockMembershipIsAdmin: GroupMembershipData = {
  id: "gm-admin-1", // Add missing base ID
  userId: mockUserId,
  groupId: mockGroupId,
  role: "ADMIN",
  acceptedInvite: true,
  joinedAt: new Date(),
  group: mockGroupDetails,
  user: mockSimpleUser,
};

const mockMembershipIsOwner: GroupMembershipData = {
  id: "gm-owner-1", // Add missing base ID
  userId: mockOwnerId, // Use owner ID
  groupId: mockGroupId,
  role: "ADMIN", // Owners are implicitly admin? Check logic if needed
  acceptedInvite: true,
  joinedAt: new Date(),
  group: mockGroupDetails,
  user: { ...mockSimpleUser, id: mockOwnerId }, // Use owner ID for user
};

const mockMembershipNotMember: GroupMembershipData | null = null; // This remains null

// Helper function to create a full UseQueryResult mock structure
const createUseQueryMock = (
  status: "success" | "pending" | "error",
  data: any,
) =>
  ({
    status,
    data,
    error: status === "error" ? new Error("Mock Error") : null,
    isError: status === "error",
    isIdle: false,
    isLoading: status === "pending",
    isPending: status === "pending",
    isFetching: status === "pending",
    isPaused: false,
    isPlaceholderData: false,
    isRefetching: false,
    isStale: false,
    isSuccess: status === "success",
    refetch: vi.fn(),
    remove: vi.fn(),
    // Add any other commonly accessed properties if needed
  }) as any; // Use 'as any' here to avoid excessive detail

// Helper for UseInfiniteQueryResult
const createUseInfiniteQueryMock = (
  status: "success" | "pending" | "error",
  data: any,
  hasNextPage: boolean = false,
  isFetchingNextPage: boolean = false,
) =>
  ({
    status,
    data,
    error: status === "error" ? new Error("Mock Error") : null,
    fetchNextPage: vi.fn(),
    hasNextPage,
    isError: status === "error",
    isIdle: false,
    isFetching: status === "pending" && !isFetchingNextPage,
    isFetchingNextPage,
    isPaused: false,
    isLoading: status === "pending",
    isPending: status === "pending",
    isRefetching: false,
    isStale: false,
    isSuccess: status === "success",
    refetch: vi.fn(),
    remove: vi.fn(),
  }) as any; // Use 'as any' here

describe("[Groups][Component] GroupPage Client Logic", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
    // Use helper functions for default mocks
    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey?.[0] === "group" && queryKey?.[1] === mockGroupId) {
        return createUseQueryMock("success", mockGroupDetails);
      }
      if (queryKey?.[0] === "group-member" && queryKey?.[1] === mockGroupId) {
        return createUseQueryMock("success", mockMembershipIsMember); // Default to member
      }
      return createUseQueryMock("pending", undefined);
    });
    mockUseInfiniteQuery.mockReturnValue(
      createUseInfiniteQueryMock("success", { pages: [mockPostsPage1] }),
    );
    mockKyPost.mockResolvedValue({} as any);
  });

  // Test 1: Render name, description (as member)
  it("should render group name, description", () => {
    render(<GroupPage params={{ groupId: mockGroupId }} />);
    expect(screen.getByText(mockGroupDetails.name)).toBeInTheDocument();
    expect(screen.getByText(mockGroupDetails.description)).toBeInTheDocument();
  });

  // Test 2: Render activity feed (as member)
  it("should render activity feed (mocked)", () => {
    render(<GroupPage params={{ groupId: mockGroupId }} />);
    expect(screen.getByTestId(`post-${mockPost1.id}`)).toBeInTheDocument();
    expect(
      screen.getByText(`Mock Post: ${mockPost1.content}`),
    ).toBeInTheDocument();
  });

  // Test 3: Show Accept Invite/Unjoin button
  describe("Membership Buttons", () => {
    it("should show 'Accept Invite' button when not a member", () => {
      mockUseQuery.mockImplementation(({ queryKey }) => {
        if (queryKey?.[0] === "group" && queryKey?.[1] === mockGroupId) {
          return createUseQueryMock("success", mockGroupDetails);
        }
        if (queryKey?.[0] === "group-member" && queryKey?.[1] === mockGroupId) {
          return createUseQueryMock("success", mockMembershipNotMember); // Not a member
        }
        return createUseQueryMock("pending", undefined);
      });
      render(<GroupPage params={{ groupId: mockGroupId }} />);

      expect(
        screen.getByRole("button", { name: /accept invite/i }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("more-button-mock")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId(`post-${mockPost1.id}`),
      ).not.toBeInTheDocument();
    });

    it("should show dropdown with 'Unjoin Group' when a member (not owner)", async () => {
      const user = userEvent.setup();
      // beforeEach already sets user as member (non-owner)
      render(<GroupPage params={{ groupId: mockGroupId }} />);
      expect(
        screen.queryByRole("button", { name: /accept invite/i }),
      ).not.toBeInTheDocument();
      const moreButton = screen.getByTestId("more-button-mock");
      expect(moreButton).toBeInTheDocument();
      await user.click(moreButton);
      const unjoinMenuItem = await screen.findByText(/unjoin group/i);
      expect(unjoinMenuItem).toBeInTheDocument();
    });

    it("should call accept invite API on button click", async () => {
      const user = userEvent.setup();
      mockUseQuery.mockImplementation(({ queryKey }) => {
        if (queryKey?.[0] === "group" && queryKey?.[1] === mockGroupId) {
          return createUseQueryMock("success", mockGroupDetails);
        }
        if (queryKey?.[0] === "group-member" && queryKey?.[1] === mockGroupId) {
          return createUseQueryMock("success", mockMembershipNotMember); // Not a member
        }
        return createUseQueryMock("pending", undefined);
      });
      render(<GroupPage params={{ groupId: mockGroupId }} />);
      const acceptButton = screen.getByRole("button", {
        name: /accept invite/i,
      });
      await act(async () => {
        await user.click(acceptButton);
      });
      expect(mockKyPost).toHaveBeenCalledTimes(1);
      expect(mockKyPost).toHaveBeenCalledWith(
        `/api/groups/${mockGroupId}/accept-invite`,
      );
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/groups/${mockGroupId}`);
      });
    });
  });

  // Test 4: Show Admin/Owner controls
  describe("Admin/Owner Controls", () => {
    it("should show 'Add User' and 'Delete' for owner", async () => {
      const user = userEvent.setup();
      mockUseQuery.mockImplementation(({ queryKey }) => {
        if (queryKey?.[0] === "group" && queryKey?.[1] === mockGroupId) {
          return createUseQueryMock("success", mockGroupDetails);
        }
        if (queryKey?.[0] === "group-member" && queryKey?.[1] === mockGroupId) {
          return createUseQueryMock("success", mockMembershipIsOwner); // Is owner
        }
        return createUseQueryMock("pending", undefined);
      });
      render(<GroupPage params={{ groupId: mockGroupId }} />);
      const moreButton = screen.getByTestId("more-button-mock");
      await user.click(moreButton);
      expect(await screen.findByText(/add user/i)).toBeInTheDocument();
      expect(await screen.findByText(/delete/i)).toBeInTheDocument();
      expect(screen.queryByText(/unjoin group/i)).not.toBeInTheDocument();
    });

    it("should show 'Add User' and 'Unjoin Group' for admin (non-owner)", async () => {
      const user = userEvent.setup();
      mockUseQuery.mockImplementation(({ queryKey }) => {
        if (queryKey?.[0] === "group" && queryKey?.[1] === mockGroupId) {
          return createUseQueryMock("success", mockGroupDetails);
        }
        if (queryKey?.[0] === "group-member" && queryKey?.[1] === mockGroupId) {
          return createUseQueryMock("success", mockMembershipIsAdmin); // Is Admin
        }
        return createUseQueryMock("pending", undefined);
      });
      render(<GroupPage params={{ groupId: mockGroupId }} />);
      const moreButton = screen.getByTestId("more-button-mock");
      await user.click(moreButton);
      expect(await screen.findByText(/add user/i)).toBeInTheDocument();
      expect(screen.queryByText(/delete/i)).not.toBeInTheDocument(); // Admin cannot delete
      expect(await screen.findByText(/unjoin group/i)).toBeInTheDocument(); // Admin can unjoin
    });
  });
});

// Add imports for act if not already present
import { act } from "@testing-library/react";
