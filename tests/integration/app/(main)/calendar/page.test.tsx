import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Page from "@/app/(main)/calendar/page";
import SessionProvider from "@/app/(main)/SessionProvider";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

describe("Calendar Page", () => {
  let queryClient: QueryClient;

  const mockSession = {
    user: {
      id: "1",
      username: "testuser",
      email: "testuser@example.com",
      displayName: "Test User",
      avatarUrl: "https://example.com/avatar.png",
      googleId: "google-123",
    },
    session: {
      id: "session-1",
      active: true,
      expires: new Date().toISOString(),
      expiresAt: new Date(),
      fresh: true,
      userId: "1",
    },
  };

  const renderPage = () =>
    render(
      <SessionProvider value={mockSession}>
        <QueryClientProvider client={queryClient}>
          <Page
            searchParams={{
              q: undefined,
            }}
          />
        </QueryClientProvider>
      </SessionProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient();

    global.innerWidth = 1024;
    window.dispatchEvent(new Event("resize"));

    global.fetch = vi.fn();

    console.error = vi.fn();
  });

  it("should render the calendar even if no events are returned", async () => {
    //@ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );

    renderPage();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const dayName = await screen.findByText(/Sun/i);
    const dayNumber = await screen.findByText(/15/i);
    expect(dayName).toBeInTheDocument();
    expect(dayNumber).toBeInTheDocument();
  });

  it("should display an error message when the API call fails", async () => {
    //@ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
      }),
    );

    renderPage();

    const errorMessage = await screen.findByText(/Failed to fetch events/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
