// src/components/groups/GroupList.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";

// Mock dependencies BEFORE component import
vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: vi.fn(),
}));

vi.mock("@/components/InfiniteScrollContainer", () => ({
  // Mock container to just render children
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="infinite-scroll-mock">{children}</div>
  ),
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual, // Preserve other exports if any
    Loader2: (props: any) => <div data-testid="loader-mock" {...props} />,
  };
});

vi.mock("next/link", () => ({
  // Mock Link to render a basic anchor tag
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Import component AFTER mocks
import GroupList from "@/app/(main)/groups/GroupList";

// --- Mock Data ---
interface MockGroup {
  id: string;
  name: string;
  description?: string;
  acceptedInvite: boolean;
}

const mockGroupsPage1: MockGroup[] = [
  {
    id: "group-1",
    name: "Group One",
    description: "Description for group one",
    acceptedInvite: true,
  },
  {
    id: "group-2",
    name: "Group Two",
    description: undefined, // Test optional description
    acceptedInvite: true,
  },
];

// const mockUseInfiniteQuery = useInfiniteQuery as vi.Mock; // Removed cast

describe("[Groups][Component] GroupList", () => {
  // Default mock state removed - will be set per test
  // const defaultMockQueryState = { ... };

  beforeEach(() => {
    vi.clearAllMocks();
    // No default mock needed here, set in each test
    // vi.mocked(useInfiniteQuery).mockReturnValue(defaultMockQueryState);
  });

  it("should render loading state", () => {
    // Arrange: Set loading state
    vi.mocked(useInfiniteQuery).mockReturnValue({
      status: "pending",
      // Provide other fields as needed by the component, even if default/null
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any); // Use 'as any' to simplify mock type
    render(<GroupList />);
    // Assert
    expect(screen.getByText(/loading groups.../i)).toBeInTheDocument();
  });

  it("should render error state", () => {
    // Arrange: Set error state
    vi.mocked(useInfiniteQuery).mockReturnValue({
      status: "error",
      data: undefined,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);
    render(<GroupList />);
    // Assert
    expect(
      screen.getByText(/an error occurred while loading groups./i),
    ).toBeInTheDocument();
  });

  it("should render empty state if no groups found", () => {
    // Arrange: Set success state with empty data
    vi.mocked(useInfiniteQuery).mockReturnValue({
      status: "success",
      data: { pages: [{ groups: [], nextCursor: null }] }, // Empty groups
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);
    render(<GroupList />);
    // Assert
    expect(
      screen.getByText(/you are not a member of any groups./i),
    ).toBeInTheDocument();
  });

  it("should render list of groups with links", () => {
    // Arrange: Set success state with mock groups
    vi.mocked(useInfiniteQuery).mockReturnValue({
      status: "success",
      data: { pages: [{ groups: mockGroupsPage1, nextCursor: null }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);
    render(<GroupList />);

    // Assert Group One
    const groupOneLink = screen.getByRole("link", { name: /group one/i });
    expect(groupOneLink).toBeInTheDocument();
    expect(groupOneLink).toHaveAttribute(
      "href",
      `/groups/${mockGroupsPage1[0].id}`,
    );
    // Check description is rendered (using within or more specific query if needed)
    expect(
      screen.getByText(mockGroupsPage1[0].description!), // Assert description exists
    ).toBeInTheDocument();

    // Assert Group Two
    const groupTwoLink = screen.getByRole("link", { name: /group two/i });
    expect(groupTwoLink).toBeInTheDocument();
    expect(groupTwoLink).toHaveAttribute(
      "href",
      `/groups/${mockGroupsPage1[1].id}`,
    );
    // Assert description for group two is NOT rendered
    expect(
      screen.queryByText(/description for group two/i),
    ).not.toBeInTheDocument();

    // Assert Loading/Error/Empty states are NOT visible
    expect(screen.queryByText(/loading groups.../i)).not.toBeInTheDocument();
    expect(screen.queryByText(/an error occurred/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/not a member of any groups/i),
    ).not.toBeInTheDocument();

    // Assert InfiniteScrollContainer mock is present
    expect(screen.getByTestId("infinite-scroll-mock")).toBeInTheDocument();
  });
});
