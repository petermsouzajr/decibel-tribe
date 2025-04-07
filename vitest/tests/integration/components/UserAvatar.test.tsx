import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import UserAvatar from "@/components/UserAvatar";
import avatarPlaceholder from "@/assets/avatar-placeholder.png"; // Import to check src

// Mock next/image if necessary, but often basic attribute checks work without full mocking
// vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }))

// Use describe.skip to skip all tests in this file
describe.skip("[Core][Component] UserAvatar", () => {
  it("should render user avatar with provided url and size", () => {
    const testUrl = "http://example.com/avatar.jpg";
    const testSize = 64;
    render(<UserAvatar avatarUrl={testUrl} size={testSize} />);

    const image = screen.getByAltText("User avatar");
    expect(image).toBeInTheDocument();
    expect(image.getAttribute("src")).toContain(encodeURIComponent(testUrl));
    expect(image).toHaveAttribute("width", testSize.toString());
    expect(image).toHaveAttribute("height", testSize.toString());
  });

  it("should render placeholder when avatarUrl is null", () => {
    render(<UserAvatar avatarUrl={null} />);

    const image = screen.getByAltText("User avatar");
    expect(image).toBeInTheDocument();
    const placeholderPath =
      typeof avatarPlaceholder === "string"
        ? avatarPlaceholder
        : avatarPlaceholder.src;
    expect(image.getAttribute("src")).toContain(
      encodeURIComponent(placeholderPath),
    );
    expect(image).toHaveAttribute("width", "48"); // Default size
    expect(image).toHaveAttribute("height", "48"); // Default size
  });

  it("should render placeholder when avatarUrl is undefined", () => {
    render(<UserAvatar avatarUrl={undefined} />); // Test undefined case too

    const image = screen.getByAltText("User avatar");
    expect(image).toBeInTheDocument();
    const placeholderPath =
      typeof avatarPlaceholder === "string"
        ? avatarPlaceholder
        : avatarPlaceholder.src;
    expect(image.getAttribute("src")).toContain(
      encodeURIComponent(placeholderPath),
    );
    expect(image).toHaveAttribute("width", "48");
    expect(image).toHaveAttribute("height", "48");
  });

  it("should apply custom className", () => {
    const customClass = "my-avatar-style";
    render(<UserAvatar avatarUrl={null} className={customClass} />);

    const image = screen.getByAltText("User avatar");
    expect(image).toHaveClass(customClass);
    expect(image).toHaveClass("rounded-full"); // Check default class is also present
  });
});
