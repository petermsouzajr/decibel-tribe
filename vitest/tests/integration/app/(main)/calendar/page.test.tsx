import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

  const renderPage = async () => {
    const renderResult = render(
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
    // Wait for the fetch call triggered by the component
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // Wait for the calendar to actually render after loading
    await screen.findByText(/Sun/i); // Wait for a stable element post-load
    return renderResult;
  };

  beforeEach(() => {
    queryClient = new QueryClient();
    // Mock fetch to return empty array by default
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  it("should render the calendar even if no events are returned", async () => {
    //@ts-ignore
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );

    await renderPage();

    const dayName = await screen.findByText(/Sun/i);
    const dayNumber = await screen.findByText(/15/i);
    expect(dayName).toBeInTheDocument();
    expect(dayNumber).toBeInTheDocument();
  });

  it("should display an error message when the API call fails", async () => {
    // Mock fetch specifically for this test to return an error
    //@ts-ignore
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      }),
    );

    // Render the component directly for this test case
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

    // Wait specifically for the error message to appear
    const errorMessage = await screen.findByText(/Failed to fetch events/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it("should match snapshot", async () => {
    await renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
