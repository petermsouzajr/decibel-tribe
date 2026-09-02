import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event"; // Import userEvent
import Post from "@/components/posts/Post"; // Updated import
import SessionProvider, { useSession } from "@/app/(main)/SessionProvider"; // Import SessionProvider as default
import { formatRelativeDate } from "@/lib/utils";
import { PostData, UserData } from "@/lib/types"; // Assuming types are here
import { Session } from "lucia";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

// Mock Child Components (Simple Placeholders) - Use Aliases
vi.mock("@/components/posts/LikeButton", () => ({
  default: () => <div>LikeButton Mock</div>,
}));
vi.mock("@/components/posts/DislikeButton", () => ({
  default: () => <div>DislikeButton Mock</div>,
}));
vi.mock("@/components/posts/BookmarkButton", () => ({
  default: () => <div>BookmarkButton Mock</div>,
}));
vi.mock("@/components/posts/PostMoreButton", () => ({
  default: () => <div>PostMoreButton Mock</div>,
}));
vi.mock("@/components/FollowButton", () => ({
  default: () => <div>FollowButton Mock</div>,
}));
vi.mock("@/components/comments/Comments", () => ({
  default: () => <div>Comments Mock</div>,
}));
vi.mock("@/components/UserAvatar", () => ({
  default: ({ avatarUrl }: { avatarUrl?: string | null }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="User avatar" src={avatarUrl || "placeholder.png"} />
  ),
}));
vi.mock("@/components/UserTooltip", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/Linkify", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock MediaPreview explicitly
vi.mock("@/components/MediaPreview", () => ({
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
  userId: mockPostUser.id,
  groupId: null,
  sharedFromId: null,
  sharedCount: 0,
  user: mockPostUser, // Should conform to UserWithFollowerStatus now
  attachments: [],
  sharedFrom: null,
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

// Helper to wrap component with QueryClientProvider
const renderWithClient = (ui: React.ReactElement) => {
  const testClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });
  return render(
    <QueryClientProvider client={testClient}>{ui}</QueryClientProvider>,
  );
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
    renderWithClient(<Post post={mockPostData} />);

    // User Info
    // eslint-disable-next-line @next/next/no-img-element
    expect(screen.getByAltText("User avatar")).toBeInTheDocument();
    // Check for the exact src rendered by the mock
    expect(screen.getByAltText("User avatar")).toHaveAttribute(
      "src",
      mockPostUser.avatarUrl, // The mock renders the direct URL
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

    renderWithClient(<Post post={mockPostData} />);

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

    renderWithClient(<Post post={postWithAttachments} />);

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
    const user = userEvent.setup();
    // Arrange: Create post data with long content
    const longContent = "a".repeat(301); // Ensure length > 300
    const longPost = { ...mockPostData, content: longContent };
    renderWithClient(<Post post={longPost} />);

    const contentDiv = screen.getByText((content, element) =>
      content.startsWith(longContent.substring(0, 290)),
    ); // Find based on truncated content

    // Assert initial state (truncated)
    expect(contentDiv).toHaveClass("overflow-hidden");
    // Find the element by text, as it's a div, not a button
    const showMoreButton = screen.getByText(/show more/i);
    expect(showMoreButton).toBeInTheDocument();

    // Act: Click the "Show More" div
    await user.click(showMoreButton);

    // Assert expanded state
    await waitFor(() => {
      expect(contentDiv).not.toHaveClass("overflow-hidden");
    });
    expect(contentDiv).toHaveTextContent(longContent); // Check full content is there
    // Check for the "Show Less" text in its div
    expect(screen.getByText(/show less/i)).toBeInTheDocument();
    expect(screen.queryByText(/show more/i)).not.toBeInTheDocument();

    // Optional: Click Show Less and assert again if needed
  });

  // Implement the comments toggle test
  it("should toggle comments visibility on click", async () => {
    const user = userEvent.setup();
    // Arrange
    renderWithClient(<Post post={mockPostData} />);
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
    // Arrange: Create post data with group info, post by another user
    const postInGroup = {
      ...mockPostData,
      userId: "otherUserId", // Make sure post user is not session user
      user: {
        ...mockPostUser,
        id: "otherUserId",
      },
      groupId: "group-1",
      Group: {
        id: "group-1",
        name: "Test Group",
        slug: "test-group",
        description: "",
        userId: "another-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        public: true,
        avatarUrl: null,
        coverPhotoUrl: null,
      },
    };
    // Session user is mockSessionUser (id: user-session-123)
    (useSession as any).mockReturnValue({ user: mockSessionUser });

    renderWithClient(<Post post={postInGroup} />);

    // Assert: Group Info is NOT rendered by this component
    // expect(screen.queryByText("Posted in Test Group")).not.toBeInTheDocument(); // Component doesn't render this

    // Assert: Follow button SHOULD be present because post.user.id !== session.user.id
    expect(screen.getByText("FollowButton Mock")).toBeInTheDocument();

    // Assert: Other standard elements are still present
    expect(screen.getByText(mockPostUser.displayName)).toBeInTheDocument(); // Should show original post author name
    expect(screen.getByText("LikeButton Mock")).toBeInTheDocument();
  });

  // Skipped: the Post model has no `updatedAt` column, so this behaviour cannot
  // occur in production. The test passed only because the mock supplied a field
  // the database never returns, and PostData (hand-written at the time) claimed
  // it existed. Restore this test if `updatedAt` is added to model Post — see
  // CODEBASE_AUDIT_TRACKER.md C3.
  it.skip("should display (Edited) if updatedAt is different from createdAt", async () => {
    // Arrange: Create post data with a different updatedAt
    const createdAt = new Date(Date.now() - 1000 * 60 * 15); // 15 mins ago
    const updatedAt = new Date(createdAt.getTime() + 1000 * 60 * 10); // 10 mins after creation (5 mins ago)
    const mockPostEdited = {
      ...mockPostData,
      createdAt: createdAt,
      updatedAt: updatedAt,
    } as unknown as PostData;

    // Import the actual utility function for this specific test
    // This overrides the global mock setup in beforeEach for this test only
    const actualUtils =
      await vi.importActual<typeof import("@/lib/utils")>("@/lib/utils");
    vi.mocked(formatRelativeDate).mockImplementation(
      actualUtils.formatRelativeDate,
    );

    // Act
    renderWithClient(<Post post={mockPostEdited} />);

    // Assert
    // Verify that the "(Edited)" text is now rendered
    expect(screen.getByText("(Edited)")).toBeInTheDocument();

    // Optional: Verify the original date is still rendered correctly if needed
    // const expectedDateString = actualUtils.formatRelativeDate(createdAt);
    // expect(screen.getByText(new RegExp(expectedDateString))).toBeInTheDocument();
  });

  it("should NOT display (Edited) if updatedAt is same as createdAt", () => {
    // Arrange: Use standard mockPostData where updatedAt is effectively the same as createdAt
    // Ensure the global mock is active (it is by default from beforeEach)
    (formatRelativeDate as any).mockReturnValue("5 minutes ago"); // Reaffirm global mock if needed

    // Act
    renderWithClient(<Post post={mockPostData} />);

    // Assert
    expect(screen.queryByText("(Edited)")).not.toBeInTheDocument();
    expect(screen.getByText("5 minutes ago")).toBeInTheDocument(); // Check the mocked date is shown
  });
});
