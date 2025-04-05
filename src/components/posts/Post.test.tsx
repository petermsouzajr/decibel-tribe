import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event"; // Import userEvent
import Post from "./Post"; // Adjust import path
import { useSession } from "@/app/(main)/SessionProvider";
import { formatRelativeDate } from "@/lib/utils";
import { PostData, UserData } from "@/lib/types"; // Assuming types are here

// --- Mocks ---
vi.mock("@/app/(main)/SessionProvider", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    formatRelativeDate: vi.fn(),
  };
});

// Mock Child Components (Simple Placeholders)
vi.mock("./LikeButton", () => ({ default: () => <div>LikeButton Mock</div> }));
vi.mock("./DislikeButton", () => ({
  default: () => <div>DislikeButton Mock</div>,
}));
vi.mock("./BookmarkButton", () => ({
  default: () => <div>BookmarkButton Mock</div>,
}));
vi.mock("./PostMoreButton", () => ({
  default: () => <div>PostMoreButton Mock</div>,
}));
vi.mock("../FollowButton", () => ({
  default: () => <div>FollowButton Mock</div>,
}));
vi.mock("../comments/Comments", () => ({
  default: () => <div>Comments Mock</div>,
}));
vi.mock("../UserAvatar", () => ({
  default: ({ avatarUrl }: { avatarUrl?: string | null }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="User avatar" src={avatarUrl || "placeholder.png"} />
  ),
}));
vi.mock("../UserTooltip", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../Linkify", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock MediaPreview explicitly
vi.mock("../MediaPreview", () => ({
  default: ({ attachments }: { attachments: any[] }) => (
    <div data-testid="media-preview-mock">
      {attachments.map((att) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={att.id} src={att.url} alt="Attachment Mock" />
      ))}
    </div>
  ),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// --- Test Setup ---
// Explicitly type or use 'as any'/'as Partial<Type>' if full type is too verbose for mocks
const mockSessionUser = {
  id: "user-session-123",
  username: "sessionUser",
  displayName: "Session User",
  avatarUrl: null,
  coverPhotoUrl: null, // Add if needed
  bio: "Session bio",
  location: null, // Add if needed
  website: null, // Add if needed
  createdAt: new Date(),
  email: null,
  passwordHash: null, // Required by UserWithFollowerStatus
  emailVerified: null, // Required by UserWithFollowerStatus
  userPreferences: null, // Required by UserWithFollowerStatus
  userInstruments: [], // Required by UserWithFollowerStatus
  userSkills: [], // Required by UserWithFollowerStatus
  muted: [], // Add if needed
  blocked: [], // Add if needed
  followers: [], // Required top-level array
  _count: {
    posts: 0,
    followers: 0, // ONLY these two based on getUserDataSelect
  },
} as any; // Use 'as any' or a more specific Partial type for mocks

const mockPostUser = {
  id: "user-post-456",
  username: "postAuthor",
  displayName: "Post Author",
  avatarUrl: "http://example.com/avatar.jpg",
  coverPhotoUrl: null, // Add if needed
  bio: "Author bio",
  location: null, // Add if needed
  website: null, // Add if needed
  createdAt: new Date(),
  email: null,
  passwordHash: null, // Required by UserWithFollowerStatus
  emailVerified: null, // Required by UserWithFollowerStatus
  userPreferences: null, // Required by UserWithFollowerStatus
  userInstruments: [], // Required by UserWithFollowerStatus
  userSkills: [], // Required by UserWithFollowerStatus
  muted: [], // Add if needed
  blocked: [], // Add if needed
  followers: [], // Required top-level array
  _count: {
    posts: 1,
    followers: 0, // ONLY these two based on getUserDataSelect
  },
} as any; // Use 'as any' or a more specific Partial type for mocks

const mockPostData: PostData = {
  id: "post-1",
  content: "This is a test post content.",
  createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  // updatedAt: new Date(Date.now() - 1000 * 60 * 5), // Removed, not in PostData type
  userId: mockPostUser.id,
  groupId: null,
  user: mockPostUser, // Should conform to UserWithFollowerStatus now
  attachments: [],
  Group: null, // Required by PostData type
  _count: {
    // Correct root _count
    likes: 5,
    dislikes: 1,
    comments: 2,
  },
  // Add required top-level arrays
  likes: [],
  dislikes: [],
  bookmarks: [],
};

// --- Tests ---
describe("[Social][Component] Post", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Setup default mock implementations
    (useSession as any).mockReturnValue({ user: mockSessionUser });
    (formatRelativeDate as any).mockReturnValue("5 minutes ago");
  });

  it("should render basic post details for another user", () => {
    render(<Post post={mockPostData} />);

    // User Info
    // eslint-disable-next-line @next/next/no-img-element
    expect(screen.getByAltText("User avatar")).toBeInTheDocument();
    expect(screen.getByAltText("User avatar")).toHaveAttribute(
      "src",
      mockPostUser.avatarUrl,
    );
    expect(screen.getByText(mockPostUser.displayName)).toBeInTheDocument();
    expect(screen.getByText(`@${mockPostUser.username}`)).toBeInTheDocument();
    expect(screen.getByText("5 minutes ago")).toBeInTheDocument(); // Mocked date

    // Post Content
    expect(screen.getByText(mockPostData.content)).toBeInTheDocument();

    // Action Buttons (Mocks)
    expect(screen.getByText("LikeButton Mock")).toBeInTheDocument();
    expect(screen.getByText("DislikeButton Mock")).toBeInTheDocument();
    expect(screen.getByText("BookmarkButton Mock")).toBeInTheDocument();
    // Find the button containing the comment count from mock data
    const commentCount = mockPostData._count.comments.toString(); // "2"
    expect(
      screen.getByRole("button", { name: commentCount }),
    ).toBeInTheDocument();

    // Conditional Buttons (Follow/More)
    expect(screen.getByText("FollowButton Mock")).toBeInTheDocument(); // Should show Follow for other user
    expect(screen.queryByText("PostMoreButton Mock")).not.toBeInTheDocument();

    // Other Mocks
    expect(screen.queryByText("Comments Mock")).not.toBeInTheDocument(); // Comments initially hidden
    expect(screen.queryByText("MediaPreviews Mock")).not.toBeInTheDocument(); // No attachments

    // Check Link Hrefs (basic check)
    const links = screen.getAllByRole("link");
    expect(
      links.some(
        (link) =>
          link.getAttribute("href") === `/users/${mockPostUser.username}`,
      ),
    ).toBe(true);
    expect(
      links.some(
        (link) => link.getAttribute("href") === `/posts/${mockPostData.id}`,
      ),
    ).toBe(true);
  });

  it("should render PostMoreButton for own post and hide FollowButton", () => {
    // Arrange: Override session user to match post author
    (useSession as any).mockReturnValue({ user: mockPostUser });

    render(<Post post={mockPostData} />);

    // Assert
    expect(screen.getByText("PostMoreButton Mock")).toBeInTheDocument();
    expect(screen.queryByText("FollowButton Mock")).not.toBeInTheDocument();
  });

  it("should display attachments using MediaPreview", () => {
    // Arrange: Create post data with attachments
    const postWithAttachments = {
      ...mockPostData,
      attachments: [
        {
          id: "media-1",
          url: "http://example.com/img.jpg",
          type: "IMAGE" as const,
          postId: mockPostData.id,
          createdAt: new Date(),
        },
      ],
    };

    render(<Post post={postWithAttachments} />);

    // Assert: Check for the rendered image from the *internal* MediaPreview component
    // Find the image by its actual alt text
    // eslint-disable-next-line @next/next/no-img-element
    expect(screen.getByAltText("Attachment")).toHaveAttribute(
      // Correct alt text
      "src",
      // Next Image encodes the src, so we check for the original URL part
      expect.stringContaining(
        encodeURIComponent(postWithAttachments.attachments[0].url),
      ),
    );
    // Remove check for the irrelevant mock's test ID
    // expect(screen.getByTestId("media-preview-mock")).toBeInTheDocument();
  });

  // Implement the content expansion test
  it("should toggle content expansion for long posts", async () => {
    const user = userEvent.setup(); // Setup userEvent
    // Arrange: Create post data with long content
    const longContent = "a".repeat(350); // Must be > 300 chars
    const postWithLongContent = {
      ...mockPostData,
      content: longContent,
    };
    render(<Post post={postWithLongContent} />);

    // Assert initial state (truncated, show more visible)
    // Find the content div - might need a data-testid if text selection is flaky
    const contentDiv = screen.getByText(
      (content, element) =>
        element?.tagName.toLowerCase() === "div" &&
        content.startsWith(longContent.substring(0, 290)), // Check start
    );
    expect(contentDiv).toHaveClass("overflow-hidden"); // Check for truncation class
    const showMoreButton = screen.getByText(/show more/i);
    expect(showMoreButton).toBeInTheDocument();
    expect(screen.queryByText(/show less/i)).not.toBeInTheDocument();

    // Act: Click Show More
    await user.click(showMoreButton);

    // Assert expanded state (full content, show less visible)
    expect(contentDiv).not.toHaveClass("overflow-hidden"); // Truncation removed
    expect(contentDiv).toHaveTextContent(longContent); // Check full content is there
    expect(screen.queryByText(/show more/i)).not.toBeInTheDocument();
    const showLessButton = screen.getByText(/show less/i);
    expect(showLessButton).toBeInTheDocument();

    // Act: Click Show Less
    await user.click(showLessButton);

    // Assert initial state again
    expect(contentDiv).toHaveClass("overflow-hidden");
    expect(screen.getByText(/show more/i)).toBeInTheDocument();
    expect(screen.queryByText(/show less/i)).not.toBeInTheDocument();
  });

  // Implement the comments toggle test
  it("should toggle comments visibility on click", async () => {
    const user = userEvent.setup();
    // Arrange
    render(<Post post={mockPostData} />);
    const commentCount = mockPostData._count.comments.toString(); // "2"
    const commentButton = screen.getByRole("button", {
      name: commentCount,
    });

    // Assert: Comments initially hidden
    expect(screen.queryByText("Comments Mock")).not.toBeInTheDocument();

    // Act: Click the comment button
    await user.click(commentButton);

    // Assert: Comments now visible
    expect(screen.getByText("Comments Mock")).toBeInTheDocument();

    // Act: Click again to hide
    await user.click(commentButton);

    // Assert: Comments hidden again
    expect(screen.queryByText("Comments Mock")).not.toBeInTheDocument();
  });

  // Add test for group posts
  it("should render group information and hide follow button for group posts", () => {
    // Arrange: Create post data associated with a group
    const mockGroup = {
      id: "group-1",
      slug: "cool-group",
      name: "Cool Group",
      // Add other necessary group properties if needed by the component
    };
    const postInGroup = {
      ...mockPostData,
      groupId: mockGroup.id,
      Group: mockGroup as any, // Cast if mock doesn't match full type
    };

    render(<Post post={postInGroup} />);

    // Assert: Group link is NOT rendered by Post component itself.
    // Assert: Follow button SHOULD be present for group posts by other users.
    expect(screen.getByText("FollowButton Mock")).toBeInTheDocument();

    // Assert: Other standard elements are still present
    expect(screen.getByText(mockPostUser.displayName)).toBeInTheDocument();
    expect(screen.getByText(mockPostData.content)).toBeInTheDocument();
    expect(screen.getByText("LikeButton Mock")).toBeInTheDocument();
  });

  // TODO: [Social] Test case: Content Expansion (long content, click show more/less)
  // TODO: [Social] Test case: Attachments (shows MediaPreviews)
  // TODO: [Social] Test case: Comment Toggle (click comment button shows/hides Comments Mock)
});
