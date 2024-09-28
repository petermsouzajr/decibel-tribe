import { render, screen, waitFor } from "@testing-library/react";
import Page from "@/app/(main)/bookmarks/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, vi } from "vitest";
import kyInstance from "@/lib/ky";

vi.mock("@/lib/ky", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("Bookmarks Page", () => {
  let queryClient: QueryClient;

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient();
    global.innerWidth = 1024;
    window.dispatchEvent(new Event("resize"));

    // @ts-ignore
    kyInstance.get.mockImplementation(() => ({
      json: () =>
        Promise.resolve({
          posts: [],
          nextCursor: null,
        }),
    }));
  });

  it("should render the Bookmarks component as part of the page", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /Bookmarks/i }),
    ).toBeInTheDocument();
  });

  it("should display a message when there are no bookmarks", async () => {
    renderPage();

    const message = await screen.findByText(
      "You don't have any bookmarks yet.",
    );
    expect(message).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
