import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Page from "@/app/(main)/notifications/page";
import SessionProvider from "@/app/(main)/SessionProvider";
import { vi } from "vitest";
import prisma from "@/lib/prisma";

// Mock @tanstack/react-query hooks
vi.mock("@tanstack/react-query", async (importOriginal) => {
  // Define mock data INSIDE the factory function
  const mockNotification = {
    createdAt: new Date(),
    event: null,
    eventId: null,
    id: "1",
    issuer: {
      avatarUrl: "https://example.com/avatar.png",
      bio: "Test bio",
      displayName: "Test User",
      id: "1",
      username: "testuser",
      _count: {
        followers: 1,
      },
      followers: [
        {
          followerId: "2",
        },
      ],
    },
    issuerId: "2",
    post: null,
    postId: null,
    read: false,
    recipientId: "2",
    type: "EVENT_ATTENDEE",
  };
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useInfiniteQuery: vi.fn().mockReturnValue({
      status: "success",
      data: {
        pages: [{ notifications: [mockNotification], nextCursor: null }],
        pageParams: [null],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    }),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(), // Simple mock for the mutate function
    })),
  };
});

// Mock the entire TrendsSidebar component
vi.mock("@/components/TrendsSidebar", () => ({
  default: () => <div>Mocked TrendsSidebar</div>,
}));

// NOTE: Skipping due to persistent "Objects are not valid as a React child" errors.
describe("Notifications Page", () => {
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
        ,
      </SessionProvider>,
    );

  beforeAll(() => {
    queryClient = new QueryClient();

    // @ts-ignore
    global.IntersectionObserver = class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Remove prisma and ky mocks
    // Configure mocks that might change per test
    // vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    // vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // Ensure this is configured here
    // vi.mocked(kyInstance.get).mockResolvedValue({ ... } as any);
  });

  it("should render the Notifications component as part of the page", () => {
    renderPage();

    const notificationsHeading = screen.getByRole("heading", {
      name: /Notifications/i,
    });

    expect(notificationsHeading).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
