import Page from "@/app/(main)/messages/page";
import SessionProvider from "@/app/(main)/SessionProvider";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

const mockUser: any = {
  id: "1",
  name: "testUser",
};

type SessionContextType = {
  user: any;
  session: any;
  setUser: (user: any) => void;
};

const mockSessionContext: SessionContextType = {
  user: mockUser,
  session: {},
  setUser: () => {},
};

describe("Messages Page Integration Test", () => {
  const renderComponent = () =>
    render(
      <SessionProvider value={mockSessionContext}>
        <Page />
      </SessionProvider>,
    );

  it("renders a page body", async () => {
    renderComponent();

    const bodyElement = document.body;
    expect(bodyElement).toBeInTheDocument();
  });
});
