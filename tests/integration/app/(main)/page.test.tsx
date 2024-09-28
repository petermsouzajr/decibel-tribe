import Home from "@/app/(main)/page";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SessionProvider from "@/app/(main)/SessionProvider";

describe("Home Page", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    //@ts-ignore
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );
  });

  const renderPage = () =>
    render(
      <SessionProvider value={mockSession}>
        <QueryClientProvider client={queryClient}>
          <Home />
        </QueryClientProvider>
      </SessionProvider>,
    );

  it("should render the 'For you' tab", () => {
    renderPage();

    const forYouTab = screen.getByRole("tab", { name: /For you/i });

    expect(forYouTab).toBeInTheDocument();
  });

  it("should render the 'Following' tab", () => {
    renderPage();

    const followingTab = screen.getByRole("tab", { name: /Following/i });

    expect(followingTab).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
