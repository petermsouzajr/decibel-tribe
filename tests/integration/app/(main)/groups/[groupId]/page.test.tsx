import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GroupPage from "@/app/(main)/groups/[groupId]/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Group Details Page", () => {
  const queryClient = new QueryClient();
  const mockGroupId = "mock-group-id";

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <GroupPage params={{ groupId: mockGroupId }} />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display loading text when group data is loading", () => {
    renderPage();

    const loadingText = screen.getByText("Loading group...");
    expect(loadingText).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
