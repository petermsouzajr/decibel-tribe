import Page from "@/app/(main)/messages/page";
import SessionProvider from "@/app/(main)/SessionProvider";
import { render } from "@testing-library/react";

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
