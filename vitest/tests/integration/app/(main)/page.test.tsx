import React from "react";
import Home from "@/app/(main)/page";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SessionProvider from "@/app/(main)/SessionProvider";
import { vi } from "vitest";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// Mock the entire TrendsSidebar component
vi.mock("@/components/TrendsSidebar", () => ({
  // Provide a default export that is a simple React component
  default: () => <div>Mocked TrendsSidebar</div>,
  // If TrendsSidebar has named exports that are used, mock them here too
  // e.g., export const someNamedExport = ... -> someNamedExport: vi.fn(),
}));

// Refine mock for auth within this file
vi.mock("@/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/auth")>();
  return {
    ...actual,
    validateRequest: vi.fn(),
  };
});

// NOTE: Skipping due to persistent "Objects are not valid as a React child" errors.
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
    // Configure global prisma mocks for this test file
    vi.mocked(prisma.user.findMany).mockResolvedValue([]); // WhoToFollow
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // TrendingTopics
    vi.mocked(validateRequest).mockResolvedValue({
      user: { id: "1" } as any,
      session: null,
    }); // WhoToFollow
  });

  const renderPage = () =>
    render(
      <SessionProvider value={mockSession}>
        <QueryClientProvider client={queryClient}>
          <React.Suspense fallback={<div>Loading...</div>}>
            <Home />
          </React.Suspense>
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
