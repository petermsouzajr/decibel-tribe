import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import kyInstance from "@/lib/ky";
import Page from "@/app/(main)/notifications/page";

vi.mock("@/lib/ky", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("Notifications Page", () => {
  let queryClient: QueryClient;

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    );

  beforeAll(() => {
    queryClient = new QueryClient();

    // @ts-ignore
    kyInstance.get.mockImplementation(() => ({
      json: () =>
        Promise.resolve({
          posts: [],
          nextCursor: null,
        }),
    }));
  });

  it("should render the Notifications component as part of the page", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /Notifications/i }),
    ).toBeInTheDocument();
  });
});
