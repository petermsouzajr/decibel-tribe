import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Navbar from "@/app/(main)/Navbar"; // Import the actual component
import useScrollDirection from "@/hooks/useScrollDirection";

// Mock dependencies
vi.mock("@/hooks/useScrollDirection");
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/SearchField", () => ({
  default: () => <div data-testid="search-field-mock">Search Field Mock</div>,
}));
vi.mock("@/components/UserButton", () => ({
  default: (props: any) => (
    <button data-testid="user-button-mock" {...props}>
      User Button Mock
    </button>
  ),
}));

describe("[Navigation][Component] Navbar", () => {
  beforeEach(() => {
    // Reset mocks if needed
    vi.clearAllMocks();
    // Default mock for scroll direction
    vi.mocked(useScrollDirection).mockReturnValue("up");
  });

  // Implement Test 1: Logo/Brand
  it("should render logo/brand link", () => {
    render(<Navbar />);
    const brandLink = screen.getByRole("link", {
      // Use regex to match any variation of the brand name
      name: /(decibel tribe|tribe)/i,
    });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute("href", "/");
  });

  // Implement Test 2: Search Field
  it("should render search field (mocked)", () => {
    render(<Navbar />);
    expect(screen.getByTestId("search-field-mock")).toBeInTheDocument();
  });

  // Implement Test 3: User Button
  it("should render User button (mocked)", () => {
    render(<Navbar />);
    expect(screen.getByTestId("user-button-mock")).toBeInTheDocument();
  });

  // Test for Notifications bell is removed as it's not directly in Navbar
});
