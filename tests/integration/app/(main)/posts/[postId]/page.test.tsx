import Page from "@/app/(main)/posts/[postId]/page";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("Post Id Page Integration Test", () => {
  let queryClient: QueryClient;

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Page params={{ postId: "123" }} />
      </QueryClientProvider>,
    );

  it("renders a Post body", async () => {
    renderPage();
    const bodyElement = document.body;
    expect(bodyElement).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
