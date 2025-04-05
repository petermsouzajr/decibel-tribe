import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FollowerCount from "./FollowerCount";
import useFollowerInfo from "@/hooks/useFollowerInfo"; // Default import
import { formatNumber } from "@/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FollowerInfo } from "@/lib/types";

// Mock dependencies
vi.mock("@/hooks/useFollowerInfo");
vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual, // Keep other utils if any
    formatNumber: vi.fn(), // Mock formatNumber specifically
  };
});

// Setup QueryClient
const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("[Core][Component] FollowerCount", () => {
  const userId = "user1";
  const initialFollowerData: FollowerInfo = {
    followers: 1234,
    isFollowedByUser: false,
  };

  // Get typed mocks
  const mockUseFollowerInfo = useFollowerInfo as any;
  const mockFormatNumber = formatNumber as any;

  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
    // Setup default mocks for this test suite
    mockUseFollowerInfo.mockReturnValue({ data: initialFollowerData });
    mockFormatNumber.mockImplementation((num: number) => num.toLocaleString()); // Default mock format
  });

  it("should display the formatted follower count", () => {
    // Arrange
    const expectedFormattedNumber = (1234).toLocaleString(); // e.g., "1,234"
    mockFormatNumber.mockReturnValue(expectedFormattedNumber); // Ensure mock returns this

    // Act
    render(
      <FollowerCount userId={userId} initialState={initialFollowerData} />,
      { wrapper },
    );

    // Assert
    // Check for the static text part
    expect(screen.getByText("Followers:")).toBeInTheDocument();
    // Check for the formatted number within the specific span
    const countSpan = screen.getByText(expectedFormattedNumber);
    expect(countSpan).toBeInTheDocument();
    expect(countSpan).toHaveClass("font-semibold"); // Check styling span

    // Verify mocks
    expect(mockUseFollowerInfo).toHaveBeenCalledWith(
      userId,
      initialFollowerData,
    );
    expect(mockFormatNumber).toHaveBeenCalledWith(
      initialFollowerData.followers,
    );
  });

  it("should display different formatted count when data changes", () => {
    // Arrange
    const differentData: FollowerInfo = {
      followers: 5,
      isFollowedByUser: true,
    };
    const expectedFormattedNumber = (5).toLocaleString(); // "5"
    mockUseFollowerInfo.mockReturnValue({ data: differentData }); // Override hook return
    mockFormatNumber.mockReturnValue(expectedFormattedNumber);

    // Act
    render(<FollowerCount userId={userId} initialState={differentData} />, {
      wrapper,
    }); // Pass different initial state

    // Assert
    expect(screen.getByText(expectedFormattedNumber)).toBeInTheDocument();
    expect(mockFormatNumber).toHaveBeenCalledWith(differentData.followers);
  });
});
