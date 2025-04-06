// src/components/posts/editor/PostEditor.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event"; // Import userEvent
import PostEditor from "@/components/posts/editor/PostEditor";
import { SessionProvider, useSession } from "@/app/(main)/SessionProvider";
import { useSubmitPostMutation } from "@/components/posts/editor/mutations";
import useMediaUpload, {
  Attachment,
} from "@/components/posts/editor/useMediaUpload";
import { useDropzone } from "@uploadthing/react";
import { useEditor, EditorContent } from "@tiptap/react";
import { UserData } from "@/lib/types"; // Assuming UserData type location
import { UploadDropzone } from "@uploadthing/react";

// --- Mocks ---

// Mock useSession
vi.mock("@/app/(main)/SessionProvider", () => ({
  useSession: vi.fn(),
}));

// Use vi.hoisted for the mock implementation
const { mockMutateFn, mockSubmitPostMutationHook } = vi.hoisted(() => {
  const mutateFn = vi.fn();
  return {
    mockMutateFn: mutateFn,
    mockSubmitPostMutationHook: vi.fn(() => ({
      mutate: mutateFn,
      isPending: false,
    })),
  };
});

// Mock useSubmitPostMutation
vi.mock("@/components/posts/editor/mutations", () => ({
  useSubmitPostMutation: mockSubmitPostMutationHook, // Use the hoisted mock
}));

// Mock useMediaUpload with a factory
vi.mock("@/components/posts/editor/useMediaUpload", () => ({
  default: vi.fn(), // Assuming it's a default export
}));

// Mock useDropzone and other exports from @uploadthing/react
vi.mock("@uploadthing/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@uploadthing/react")>();
  return {
    ...actual, // Keep other exports if any
    useDropzone: vi.fn(),
    generateReactHelpers: vi.fn(() => ({
      useUploadThing: vi.fn(),
      uploadFiles: vi.fn(),
    })), // Mock the function and its return value
    UploadDropzone: vi.fn(() => <div data-testid="upload-dropzone-mock"></div>), // Mock component
  };
});

// Mock Tiptap (basic implementations)
vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tiptap/react")>();
  return {
    ...actual,
    useEditor: vi.fn(),
    // Mock EditorContent to render a basic textarea for interaction/placeholder checks
    EditorContent: vi.fn(({ editor }: { editor: any }) => (
      <textarea
        data-testid="tiptap-editor"
        placeholder={
          editor?.options?.extensions?.find(
            (ext: any) => ext.name === "placeholder",
          )?.options?.placeholder || ""
        }
      ></textarea>
    )),
  };
});

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "Mocked Next Image"} />; // Render a basic img tag
  },
}));

// --- Test Setup ---
const mockSessionUser: Partial<UserData> = {
  // Use Partial for simplicity
  id: "user-session-123",
  username: "sessionUser",
  displayName: "Session User",
  avatarUrl: null,
};

// Adjust mock file objects
const mockFile = new File(["content"], "mock-image.jpg", {
  type: "image/jpeg",
});

// Represents an attachment that is currently uploading
const mockUploadingAttachment: Attachment = {
  file: mockFile,
  mediaId: undefined,
  isUploading: true,
};

// Represents an attachment that has finished uploading
const mockUploadedAttachment: Attachment = {
  file: mockFile,
  mediaId: "media-123",
  isUploading: false,
};

const mockUseEditor = {
  getText: vi.fn(() => ""), // Initially empty content
  commands: {
    clearContent: vi.fn(() => {
      mockUseEditor.getText.mockReturnValue("");
    }),
  },
  options: {
    // Mock options structure to find placeholder
    extensions: [
      { name: "placeholder", options: { placeholder: "Post it here!" } },
    ],
  },
};
const mockSubmitPostMutation = {
  mutate: vi.fn(),
  isPending: false,
};
const mockMediaUpload = {
  startUpload: vi.fn(),
  attachments: [] as Attachment[], // Explicitly type the array
  isUploading: false,
  uploadProgress: 0,
  removeAttachment: vi.fn(),
  reset: vi.fn(() => {
    mockMediaUpload.attachments = [];
  }),
};
const mockDropzone = {
  getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })), // Return basic props
  getInputProps: vi.fn(() => ({})),
  isDragActive: false,
};

// --- Tests ---
describe("[Social][Component] PostEditor", () => {
  let mockOnOpenChange: () => void;

  beforeEach(() => {
    vi.resetAllMocks();
    mockOnOpenChange = vi.fn();

    // Mock URL methods for jsdom
    global.URL.createObjectURL = vi.fn(() => "mock-object-url");
    global.URL.revokeObjectURL = vi.fn(); // Add mock for revoke

    // Setup default mock implementations
    (useSession as any).mockReturnValue({ user: mockSessionUser });
    (useSubmitPostMutation as any).mockReturnValue(mockSubmitPostMutation);
    (useMediaUpload as any).mockReturnValue(mockMediaUpload);
    (useDropzone as any).mockReturnValue(mockDropzone);
    (useEditor as any).mockReturnValue(mockUseEditor);

    // Reset specific mock function calls if needed (mutate, getText etc)
    mockUseEditor.getText.mockReturnValue("");
    mockSubmitPostMutation.mutate.mockClear();
    mockUseEditor.commands.clearContent.mockClear();
    mockMediaUpload.reset.mockClear();
    // Clear the URL mock call counts
    vi.mocked(global.URL.createObjectURL).mockClear();
    vi.mocked(global.URL.revokeObjectURL).mockClear(); // Add clear for revoke
  });

  // Optional: Restore original after each test if other tests need the real one
  // afterEach(() => {
  //    vi.restoreAllMocks(); // Or specifically restore URL.createObjectURL if assigned differently
  // });

  it("should render initial state correctly", () => {
    render(<PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />);

    // Check for editor placeholder (rendered via mocked EditorContent's textarea)
    expect(screen.getByPlaceholderText("Post it here!")).toBeInTheDocument();

    // Check for Add Attachment button (find by role or test id if needed)
    // Assuming AddAttachmentsButton renders a button role
    const attachmentButton = screen.getByRole("button", {
      name: /add attachment/i,
    }); // Use the added aria-label
    expect(attachmentButton).toBeInTheDocument();
    expect(attachmentButton).not.toBeDisabled();

    // Check for Post button
    const postButton = screen.getByRole("button", { name: "Post" });
    expect(postButton).toBeInTheDocument();
    expect(postButton).toBeDisabled(); // Disabled initially

    // Check no attachments shown (AttachmentPreviews shouldn't render anything)
    expect(screen.queryByText(/AttachmentPreview/i)).not.toBeInTheDocument(); // Check if mock/real component text exists

    // Check upload indicator not visible
    expect(screen.queryByText(/%/)).not.toBeInTheDocument(); // Check for '%' sign in progress
    expect(screen.queryByTestId("loader-spin")).not.toBeInTheDocument(); // Add data-testid to Loader2 if needed
  });

  it("should enable Post button when editor has content", () => {
    const { rerender } = render(
      <PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />,
    );

    const postButtonInitially = screen.getByRole("button", { name: "Post" });
    expect(postButtonInitially).toBeDisabled();

    // Simulate editor having text by updating the mock's return value
    mockUseEditor.getText.mockReturnValue("Some typed content");

    // Rerender the *same* component instance with potentially updated props/context
    // Even though props aren't changing here, rerender triggers the necessary update cycle
    // for the component to re-evaluate the button's disabled state based on the new mock value.
    rerender(
      <PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />,
    );

    const postButtonAfterTyping = screen.getByRole("button", { name: "Post" });
    expect(postButtonAfterTyping).not.toBeDisabled();
  });

  it("should handle adding attachment state correctly", () => {
    // --- Initial Render ---
    const { rerender } = render(
      <PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />,
    );
    const postButton = screen.getByRole("button", { name: "Post" });
    expect(postButton).toBeDisabled();
    expect(screen.queryByAltText("Attachment preview")).not.toBeInTheDocument(); // Check real component isn't rendered
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();

    // --- Start Upload ---
    mockMediaUpload.isUploading = true; // Overall hook status
    mockMediaUpload.uploadProgress = 50; // Overall progress (might be average?)
    mockMediaUpload.attachments = [mockUploadingAttachment]; // Use the object with internal status
    rerender(
      <PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />,
    );

    // Assert uploading state using REAL component output
    expect(screen.getByText("50%")).toBeInTheDocument(); // Check overall progress
    expect(screen.getByAltText("Attachment preview")).toBeInTheDocument(); // Look for real alt text
    expect(screen.getByAltText("Attachment preview")).toHaveAttribute(
      "src",
      "mock-object-url",
    ); // Check mock URL is used
    // expect(screen.getByTestId("loader-spin")).toBeInTheDocument(); // Need to add test id to Loader2
    expect(postButton).toBeDisabled(); // Still disabled because isUploading = true

    // --- Finish Upload ---
    mockMediaUpload.isUploading = false; // Overall hook status
    mockMediaUpload.uploadProgress = 100; // Assumes 100% when done
    mockMediaUpload.attachments = [mockUploadedAttachment]; // Use the finished object
    rerender(
      <PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />,
    );

    // Assert finished state
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.getByAltText("Attachment preview")).toBeInTheDocument(); // Real preview still shown
    // expect(screen.queryByTestId("loader-spin")).not.toBeInTheDocument();
    expect(postButton).not.toBeDisabled(); // Enabled now because isUploading=false and attachment exists
  });

  it("should handle removing attachment", async () => {
    const user = userEvent.setup(); // Setup userEvent
    // --- Setup: Start with an uploaded attachment ---
    mockMediaUpload.attachments = [mockUploadedAttachment];
    const { rerender } = render(
      <PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />,
    );

    // Initial assertions
    expect(screen.getByAltText("Attachment preview")).toBeInTheDocument();
    const postButton = screen.getByRole("button", { name: "Post" });
    expect(postButton).not.toBeDisabled();
    const removeButton = screen.getByRole("button", {
      name: "Remove attachment",
    });
    expect(removeButton).toBeInTheDocument();

    // --- Action: Click remove button ---
    await user.click(removeButton);

    // --- Assertions: Check mock function call ---
    expect(mockMediaUpload.removeAttachment).toHaveBeenCalledTimes(1);
    expect(mockMediaUpload.removeAttachment).toHaveBeenCalledWith(
      mockUploadedAttachment.file.name,
    );

    // --- Simulate state update after removal ---
    mockMediaUpload.attachments = []; // Remove attachment from mock state
    rerender(
      <PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />,
    );

    // --- Final Assertions ---
    expect(screen.queryByAltText("Attachment preview")).not.toBeInTheDocument();
    expect(postButton).toBeDisabled(); // Post button should be disabled again
  });

  it("should submit post and clear state on success", async () => {
    const user = userEvent.setup(); // Setup userEvent

    // --- Setup: Mock mutation success and initial state ---
    mockSubmitPostMutation.mutate.mockImplementation((data, { onSuccess }) => {
      // Immediately call onSuccess to simulate successful mutation
      if (onSuccess) {
        onSuccess();
      }
    });
    mockUseEditor.getText.mockReturnValue("This is the post content.");
    mockMediaUpload.attachments = [mockUploadedAttachment]; // Include an attachment

    const { rerender } = render(
      <PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />,
    ); // Destructure rerender

    // --- Initial Assertions ---
    const postButton = screen.getByRole("button", { name: "Post" });
    expect(postButton).not.toBeDisabled();
    expect(screen.getByAltText("Attachment preview")).toBeInTheDocument();

    // --- Action: Click Post button ---
    await user.click(postButton);

    // --- Assertions: Mutation called & cleanup functions ---
    expect(mockSubmitPostMutation.mutate).toHaveBeenCalledTimes(1);
    expect(mockSubmitPostMutation.mutate).toHaveBeenCalledWith(
      {
        content: "This is the post content.",
        mediaIds: [mockUploadedAttachment.mediaId], // Expect the media ID
        groupId: null, // <<< Add expectation for null groupId
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }), // Check that onSuccess is part of options
    );

    // Check cleanup functions were called by the onSuccess callback
    expect(mockUseEditor.commands.clearContent).toHaveBeenCalledTimes(1);
    expect(mockMediaUpload.reset).toHaveBeenCalledTimes(1);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);

    // --- Force re-render after state updates from onSuccess ---
    rerender(
      <PostEditor onOpenChange={mockOnOpenChange} selectedGroup={null} />,
    );

    // --- Final Assertions: Check state is cleared ---
    // Note: Rerender isn't strictly needed here as the component logic itself
    // should trigger the state clears via the onSuccess callback.
    // We check the mocks and the visible state after the click.
    expect(screen.getByPlaceholderText("Post it here!")).toBeInTheDocument(); // Placeholder means editor is empty
    expect(screen.queryByAltText("Attachment preview")).not.toBeInTheDocument(); // Attachment preview is gone
    expect(postButton).toBeDisabled(); // Button should be disabled again
  });

  it("should submit post with groupId", async () => {
    const user = userEvent.setup(); // Setup userEvent
    const mockGroupId = "group-abc-123";
    const testContent = "Posting to a specific group";

    // --- Setup ---
    mockUseEditor.getText.mockReturnValue(testContent);
    // No attachments needed for this test
    mockMediaUpload.attachments = [];

    render(
      <PostEditor
        onOpenChange={mockOnOpenChange}
        selectedGroup={mockGroupId} // Pass only the string ID
      />,
    );

    // --- Initial Assertions ---
    const postButton = screen.getByRole("button", { name: "Post" });
    expect(postButton).not.toBeDisabled();

    // --- Action: Click Post button ---
    await user.click(postButton);

    // --- Assertions: Mutation called with groupId ---
    expect(mockSubmitPostMutation.mutate).toHaveBeenCalledTimes(1);
    expect(mockSubmitPostMutation.mutate).toHaveBeenCalledWith(
      // Check the first argument (the data object)
      expect.objectContaining({
        content: testContent,
        mediaIds: [], // Expect empty array as per setup
        groupId: mockGroupId, // Verify groupId is passed
      }),
      // Check the second argument (options object)
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  // Add tests for mutation pending/error states if needed

  // Add test for clicking Add Attachments button? (If it involves state)
});
