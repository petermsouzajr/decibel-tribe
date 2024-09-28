import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Page from "@/app/(main)/events/[eventId]/page";

describe("Event Details Page", () => {
  let queryClient: QueryClient;

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Page
          params={{
            eventId: "event-id",
          }}
        />
      </QueryClientProvider>,
    );

  it("should render a page body", async () => {
    renderPage();

    const bodyElement = document.body;
    expect(bodyElement).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
