import Page from "@/app/(main)/groups/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

describe("Groups Summary Page", () => {
  const queryClient = new QueryClient();

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    );

  it("should render the Groups header", () => {
    renderPage();

    const heading = screen.getByRole("heading", { name: /Groups/i });
    expect(heading).toBeInTheDocument();
  });

  it("should render the New Group button", () => {
    renderPage();

    const newGroupButton = screen.getByRole("button", { name: /New Group/i });
    expect(newGroupButton).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
