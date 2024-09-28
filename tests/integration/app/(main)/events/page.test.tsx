import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Page from "@/app/(main)/events/page";
import SessionProvider from "@/app/(main)/SessionProvider";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

describe("Events Page Integration Test", () => {
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
          <Page />
        </QueryClientProvider>
      </SessionProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient();

    global.innerWidth = 1024;
    window.dispatchEvent(new Event("resize"));

    global.fetch = vi.fn();
  });

  it("renders the events page heading", async () => {
    //@ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );

    renderPage();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const heading = await screen.findByRole("heading", { name: /Events/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders tab 'For you' events", async () => {
    renderPage();

    const forYouTab = screen.getByRole("tab", { name: /For you/i });

    expect(forYouTab).toBeInTheDocument();
  });

  it("renders tab 'Following' events", async () => {
    renderPage();

    const followingTab = screen.getByRole("tab", { name: /Following/i });

    expect(followingTab).toBeInTheDocument();
  });

  it("renders the event calendar with no events", async () => {
    //@ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );

    renderPage();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const yourCalendarHeading = await screen.findByText(/Your Calendar/i);
    const sundayName = await screen.findByText(/Sun/i);
    const wednesdayName = await screen.findByText(/Wed/i);
    const saturdayName = await screen.findByText(/Sat/i);
    expect(yourCalendarHeading).toBeInTheDocument();
    expect(sundayName).toBeInTheDocument();
    expect(wednesdayName).toBeInTheDocument();
    expect(saturdayName).toBeInTheDocument();
  });
});
