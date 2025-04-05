import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
// import userEvent from "@testing-library/user-event"; // Keep commented out
import PostEditor from "@/components/posts/editor/PostEditor";
import SessionProvider from "@/app/(main)/SessionProvider";
import { User as LuciaUser } from "lucia";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// --- Mocks ---

// Mock Tiptap Editor
let mockEditorContentValue = ""; // Holds the simulated content
const mockClearContent = vi.fn(() => {
  mockEditorContentValue = ""; // Simulate clearing content
});
const mockSetContent = vi.fn((content: string) => {
  mockEditorContentValue = content;
});
const mockGetText = vi.fn(() => mockEditorContentValue);

vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tiptap/react")>();
  return {
    ...actual,
    useEditor: vi.fn(() => ({
      // Mock methods and properties used by PostEditor
      getText: mockGetText,
      commands: {
        clearContent: mockClearContent,
        setContent: mockSetContent,
      },
      // Add potentially required properties for EditorContent or internal logic
      isEditable: true,
      state: {
        // Basic state mock
        doc: {
          content: {
            size: mockEditorContentValue.length,
          },
        },
      },
      destroy: vi.fn(), // Add destroy mock
      off: vi.fn(), // Add off mock
      on: vi.fn(), // Add on mock
      // Add any other properties/methods accessed by your component or EditorContent
    })),
    EditorContent: vi.fn(({ editor, ...props }) => {
      // Simple mock: renders a textarea to be found by getByRole("textbox")
      // It simulates the editor's text changes via the mockEditorContentValue
      return React.createElement("textarea", {
        ...props,
        role: "textbox",
        readOnly: true, // Make it read-only as we control value externally
        value: mockEditorContentValue, // Display the controlled value
        // Optional: Add onChange if component relies on it, e.g.,
        // onChange: (e) => editor?.commands.setContent(e.target.value),
      });
    }),
    // Mock other exports if necessary
    FloatingMenu: vi.fn(() => null),
    BubbleMenu: vi.fn(() => null),
  };
});

// Mock mutations
const mockMutate = vi.fn((data, options) => {
  // Simulate successful mutation for testing clearContent
  options?.onSuccess?.();
});

vi.mock("@/components/posts/editor/mutations", () => ({
  useSubmitPostMutation: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}));

// Mock user session
const mockLuciaUser: LuciaUser = {
  id: "user1",
  username: "testuser",
  displayName: "Test User",
  avatarUrl: null,
  googleId: null,
};
const mockSessionContext = {
  user: mockLuciaUser,
  session: { id: "session1", expiresAt: new Date(), userId: "user1" } as any,
};

const queryClient = new QueryClient();

describe("[Social][Component] PostEditor", () => {
  const defaultProps = {
    onOpenChange: vi.fn(),
    selectedGroup: null,
  };

  const renderEditor = (props = {}, sessionContext = mockSessionContext) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider value={sessionContext}>
          <PostEditor {...defaultProps} {...props} />
        </SessionProvider>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    // Reset mocks and content before each test
    mockMutate.mockClear();
    defaultProps.onOpenChange.mockClear();
    mockClearContent.mockClear(); // Reset tiptap mocks
    mockSetContent.mockClear();
    mockGetText.mockClear();
    mockEditorContentValue = ""; // Reset content
  });

  // TODO: [Social] Implement detailed test cases for PostEditor component
  // Test initial rendering (textarea, submit button)
  // Test typing in textarea updates form state
  // Test submitting calls the useSubmitPostMutation mock
  // Test submit button disabled state while mutation isPending
  // Test error display if mutation fails
  // Test clearing form after successful submission
  // Test rendering with groupId prop for group posts

  it("should render the text area and submit button", () => {
    renderEditor();
    // EditorContent mock renders a textarea with role="textbox"
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /post/i })).toBeInTheDocument();
  });

  it("should call mutation on submit with valid input and clear editor", async () => {
    const { rerender } = renderEditor(); // Get rerender function
    const submitButton = screen.getByRole("button", { name: /post/i });

    // Simulate typing by setting the mock content value
    const testContent = "New post content";
    mockEditorContentValue = testContent;

    // *** Force a re-render to update component state based on mock value ***
    rerender(
      <QueryClientProvider client={queryClient}>
        <SessionProvider value={mockSessionContext}>
          <PostEditor {...defaultProps} />
        </SessionProvider>
      </QueryClientProvider>,
    );

    // Verify the button is now enabled after re-render
    expect(submitButton).not.toBeDisabled();

    // Wrap click in act
    await act(async () => {
      await fireEvent.click(submitButton);
    });

    // Assert editor getText was called (means onSubmit logic was reached)
    expect(mockGetText).toHaveBeenCalled();

    // Assert mutation was called correctly
    expect(mockMutate).toHaveBeenCalledOnce();
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ content: testContent }),
      expect.anything(),
    );

    // Assert editor clear command was called on success
    expect(mockClearContent).toHaveBeenCalledOnce();

    // Verify the content is now empty via the mock value
    expect(mockEditorContentValue).toBe("");
  });
});
