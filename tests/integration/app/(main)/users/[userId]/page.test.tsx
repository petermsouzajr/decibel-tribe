import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
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
