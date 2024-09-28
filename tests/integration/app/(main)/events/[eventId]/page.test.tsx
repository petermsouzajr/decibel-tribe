import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Page from "@/app/(main)/events/[eventId]/page";

describe("Event Page Integration Test", () => {
  it("renders a page body", async () => {
    render(<Page params={{ eventId: "123" }} />);

    const bodyElement = document.body;
    expect(bodyElement).toBeInTheDocument();
  });
});
