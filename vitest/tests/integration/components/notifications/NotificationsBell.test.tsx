// src/components/notifications/NotificationsBell.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NotificationsButton from "@/app/(main)/NotificationsButton"; // Updated path
import { useQuery } from "@tanstack/react-query";
import { NotificationCountInfo } from "@/lib/types";
import kyInstance from "@/lib/ky"; // Import for mocking if needed, though useQuery mock is primary

// Mock dependencies
vi.mock("@tanstack/react-query");
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} data-testid="notifications-link" {...props}>
      {children}
    </a>
  ),
}));
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Bell: (props: any) => (
      <div data-testid="bell-icon-mock" {...props}>
        Bell Icon
      </div>
    ),
  };
});
// Mock kyInstance if directly used, otherwise mocking useQuery is enough
// vi.mock("@/lib/ky");

// Typed mock for useQuery
const mockUseQuery = vi.mocked(useQuery);

describe("[Notifications][Component] NotificationsButton", () => {
  // Mock the isActive prop function
  const mockIsActive = vi.fn((path: string) =>
    path === "/notifications" ? "active-class" : "",
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsActive.mockClear();
  });

  const renderComponent = (initialCount: number) => {
    const initialState: NotificationCountInfo = { unreadCount: initialCount };

    // Mock useQuery return value for this render
    mockUseQuery.mockReturnValue({
      data: initialState, // Use the initial state directly for simplicity
      // Add other necessary status fields if component uses them
      status: "success",
      isLoading: false,
      isError: false,
      // etc...
    } as any); // Use 'as any' for brevity in mock

    render(
      <NotificationsButton
        initialState={initialState}
        isActive={mockIsActive}
      />,
    );
  };

  it("should render bell icon and link correctly", () => {
    renderComponent(0); // Render with 0 count initially

    expect(screen.getByTestId("bell-icon-mock")).toBeInTheDocument();
    const link = screen.getByTestId("notifications-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/notifications");
    // Check if isActive prop was called correctly
    expect(mockIsActive).toHaveBeenCalledWith("/notifications");
  });

  it("should display unread count badge if count > 0", () => {
    const unreadCount = 5;
    renderComponent(unreadCount);

    const badge = screen.getByText(unreadCount.toString());
    expect(badge).toBeInTheDocument();
    // Check for presence of specific badge classes if needed
    expect(badge).toHaveClass("absolute -right-1 -top-1");
  });

  it("should not display badge if count is 0", () => {
    renderComponent(0);

    // The count itself (0) should not be rendered as a badge
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    // Verify no element has the badge classes
    const potentialBadge = screen.queryByText(/\d+/); // Find any element with digits
    if (potentialBadge) {
      expect(potentialBadge).not.toHaveClass("absolute -right-1 -top-1");
    }
  });

  // Test for popover/dropdown removed.
});
