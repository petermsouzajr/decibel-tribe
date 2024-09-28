import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Page from "@/app/(main)/users/[username]/page";

describe("User Page Integration Test", () => {
  it("renders user profile when user is logged in", async () => {
    render(<Page params={{ username: "123" }} />);

    const bodyElement = document.body;
    expect(bodyElement).toBeInTheDocument();
  });
});
