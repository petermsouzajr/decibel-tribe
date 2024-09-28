import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SessionProvider from "@/app/(main)/SessionProvider";
import Page from "@/app/(main)/search/page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => "",
  }),
}));

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
          <Page
            searchParams={{
              q: "",
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
  });

  it("should render the Users/Posts tab", async () => {
    renderPage();
    const usersPostsTab = screen.getByRole("tab", { name: /Users\/Posts/i });
    expect(usersPostsTab).toBeInTheDocument();
  });

  it("should render the Instruments/Skills tab", async () => {
    renderPage();
    const instrumentsSkillsTab = screen.getByRole("tab", {
      name: /Instruments\/Skills/i,
    });
    expect(instrumentsSkillsTab).toBeInTheDocument();
  });

  it("should render the Events tab", async () => {
    renderPage();
    const eventsTab = screen.getByRole("tab", { name: /Events/i });
    expect(eventsTab).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
