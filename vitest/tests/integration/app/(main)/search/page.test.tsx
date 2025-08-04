import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SessionProvider from "@/app/(main)/SessionProvider";
import Page from "@/app/(main)/search/page";
import prisma from "@/lib/prisma";
import { vi } from "vitest";
import { validateRequest } from "@/auth";

// Mock auth module
vi.mock("@/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/auth")>();
  return {
    ...actual,
    validateRequest: vi.fn(),
  };
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => "", // Mock to return empty query string
  }),
  useRouter: () => ({
    push: vi.fn(), // Add mock push function
    // Add other router methods if needed (replace, back, etc.)
  }),
}));

// Mock react-query for SearchResults
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useInfiniteQuery: vi.fn().mockReturnValue({
      status: "success",
      data: {
        pages: [{ users: [], posts: [], events: [], nextCursor: null }],
        pageParams: [null],
      }, // Empty results
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    }),
  };
});

describe("Search Page", () => {
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
          <React.Suspense fallback={<div>Loading...</div>}>
            {/* Render Page without searchParams prop */}
            <Page />
          </React.Suspense>
        </QueryClientProvider>
      </SessionProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    // Keep prisma mocks for now, remove fetch mock
    // global.innerWidth = 1024;
    // window.dispatchEvent(new Event("resize"));
    // global.fetch = vi.fn();
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(validateRequest).mockResolvedValue({
      user: { id: "1" } as any,
      session: null,
    });
  });

  it("should render the Users/Posts tab", () => {
    // Remove async
    renderPage();
    const usersPostsTab = screen.getByRole("tab", { name: /Users\/Posts/i }); // Escaped /
    expect(usersPostsTab).toBeInTheDocument();
  });

  it("should render the Instruments/Skills tab", () => {
    // Remove async
    renderPage();
    const instrumentsSkillsTab = screen.getByRole("tab", {
      name: /Instruments\/Skills/i, // Escaped /
    });
    expect(instrumentsSkillsTab).toBeInTheDocument();
  });

  it("should render the Events tab", () => {
    // Remove async
    renderPage();
    const eventsTab = screen.getByRole("tab", { name: /Events/i });
    expect(eventsTab).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
