import { render } from "@testing-library/react";
import Page from "@/app/(main)/users/[username]/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("User Page", () => {
  let queryClient: QueryClient;

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Page params={{ username: "123" }} />
      </QueryClientProvider>,
    );

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
