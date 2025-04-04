import Page from "@/app/(main)/messages/page";
import SessionProvider from "@/app/(main)/SessionProvider";
import { render } from "@testing-library/react";
import { vi } from "vitest";

// Mock the custom hook
vi.mock("./useInitializeChatClient", () => ({
  // Provide a default export which is a function returning null
  default: vi.fn(() => null),
}));

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

// NOTE: Skipping due to complex mocking required for Stream Chat API calls.
describe("Messages Page", () => {
  const renderPage = () =>
    render(
      <SessionProvider value={mockSessionContext}>
        <Page />
      </SessionProvider>,
    );

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
