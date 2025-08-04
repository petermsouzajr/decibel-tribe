// src/components/notifications/NotificationItem.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NotificationItem from "@/app/(main)/notifications/Notification"; // Updated path
import { NotificationData } from "@/lib/types";
import { useSession } from "@/app/(main)/SessionProvider";
import { NotificationType } from "@prisma/client";

// Mock dependencies
vi.mock("@/app/(main)/SessionProvider");
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/UserAvatar", () => ({
  default: ({ avatarUrl, ...props }: any) => (
    <img data-testid="user-avatar-mock" src={avatarUrl || ""} {...props} />
  ),
}));
vi.mock("@/components/UserTooltip", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/FollowButton", () => ({
  default: ({ userId }: { userId: string }) => (
    <button data-testid={`follow-button-mock-${userId}`}>
      Follow Button Mock
    </button>
  ),
}));
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    User2: () => <div data-testid="icon-follow">FollowIcon</div>,
    MessageCircle: () => <div data-testid="icon-comment">CommentIcon</div>,
    ThumbsUp: () => <div data-testid="icon-like">LikeIcon</div>,
    // Add other icons used by NotificationItem if necessary
  };
});

// Mock Data Helper
const createMockNotification = (
  type: NotificationType,
  overrides = {},
): NotificationData => {
  const baseIssuer = {
    id: "issuer-1",
    username: "testissuer",
    displayName: "Test Issuer",
    avatarUrl: "http://example.com/avatar.png",
    bio: "Issuer bio",
    _count: { followers: 5, posts: 0 },
    followers: [],
    // Add other required fields for UserWithFollowerStatus if needed based on imports/usage
    // Likely needs fields from UserData/Prisma User model
    createdAt: new Date(),
    email: "issuer@example.com",
    passwordHash: "",
    emailVerified: true,
    googleId: null,
    deletedAt: null,
    userPreferences: null,
    userInstruments: [],
    userSkills: [],
    following: [],
    followerCount: 5, // Add if UserWithFollowerStatus expects it
    followingCount: 0, // Add if UserWithFollowerStatus expects it
    isFollowing: false, // Add if UserWithFollowerStatus expects it
  };

  const baseNotification = {
    id: `notif-${Math.random()}`,
    recipientId: "user-logged-in",
    issuerId: baseIssuer.id,
    type,
    read: false,
    createdAt: new Date(),
    issuer: baseIssuer,
    postId: type === "LIKE" || type === "COMMENT" ? "post-123" : null,
    eventId:
      type === "EVENT_ATTENDEE" || type === "EVENT_CANCELLED"
        ? "event-456"
        : null,
    event:
      type === "EVENT_ATTENDEE" || type === "EVENT_CANCELLED"
        ? { id: "event-456", title: "Test Event", location: "Test Location" }
        : null,
    post:
      type === "LIKE" || type === "COMMENT"
        ? { id: "post-123", content: "Test post content" }
        : null,
    ...overrides,
  };

  return baseNotification as NotificationData; // Use type assertion carefully
};

const mockUser = {
  id: "user-logged-in",
  // add other fields if useSession().user needs them
};

describe("[Notifications][Component] NotificationItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue({ user: mockUser } as any);
  });

  it("should render user avatar, name, message for FOLLOW notification", () => {
    const notification = createMockNotification(NotificationType.FOLLOW);
    render(<NotificationItem notification={notification} />);

    expect(screen.getByTestId("user-avatar-mock")).toHaveAttribute(
      "src",
      notification.issuer.avatarUrl,
    );
    expect(
      screen.getByText(notification.issuer.displayName),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`@${notification.issuer.username}`),
    ).toBeInTheDocument();
    expect(screen.getByText("followed you")).toBeInTheDocument();
    expect(screen.getByTestId("icon-follow")).toBeInTheDocument();
  });

  it("should render correct text and icon for LIKE notification", () => {
    const notification = createMockNotification(NotificationType.LIKE);
    render(<NotificationItem notification={notification} />);
    expect(screen.getByText("liked your post")).toBeInTheDocument();
    expect(screen.getByTestId("icon-like")).toBeInTheDocument();
    // Check for post content preview
    expect(screen.getByText(notification.post!.content)).toBeInTheDocument();
  });

  it("should link to the correct user profile for FOLLOW notification", () => {
    const notification = createMockNotification(NotificationType.FOLLOW);
    render(<NotificationItem notification={notification} />);

    // Find links pointing to the issuer's profile
    const links = screen.getAllByRole("link");
    const profileLinks = links.filter(
      (link) =>
        link.getAttribute("href") === `/users/${notification.issuer.username}`,
    );
    expect(profileLinks.length).toBeGreaterThan(0); // Avatar, name, etc. should link

    // Check the main notification body link
    const mainLink = screen.getByText("followed you").closest("a");
    expect(mainLink).toHaveAttribute(
      "href",
      `/users/${notification.issuer.username}`,
    );
  });

  it("should link to the correct post for LIKE notification", () => {
    const notification = createMockNotification(NotificationType.LIKE);
    render(<NotificationItem notification={notification} />);

    const mainLink = screen.getByText("liked your post").closest("a");
    expect(mainLink).toHaveAttribute("href", `/posts/${notification.postId}`);
  });

  // Tests for unread status and mark-as-read are removed.
});
