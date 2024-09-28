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

describe("Events Page", () => {
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

  it("should render the events page heading", async () => {
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

  it("should render the events tab 'For you'", async () => {
    renderPage();

    const forYouTab = screen.getByRole("tab", { name: /For you/i });

    expect(forYouTab).toBeInTheDocument();
  });

  it("should render th events tab 'Following'", async () => {
    renderPage();

    const followingTab = screen.getByRole("tab", { name: /Following/i });

    expect(followingTab).toBeInTheDocument();
  });

  it("should render the event calendar", async () => {
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
    const saturdayName = await screen.findByText(/Sat/i);
    const dayNumber = await screen.findByText(/15/i);
    expect(yourCalendarHeading).toBeInTheDocument();
    expect(saturdayName).toBeInTheDocument();
    expect(dayNumber).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
