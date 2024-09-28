import Page from "@/app/(main)/posts/[postId]/page";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("Post Id Page Integration Test", () => {
  it("renders a Post body", async () => {
    render(<Page params={{ postId: "123" }} />);

    const bodyElement = document.body;
    expect(bodyElement).toBeInTheDocument();
  });
});
