import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EventFormPage from "@/app/(main)/events/edit/page";

const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

describe("Edit Event Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <EventFormPage />
      </QueryClientProvider>,
    );

  it("should render the form heading", async () => {
    renderPage();

    const pageTitle = await screen.findByRole("heading", {
      name: /Create New Event/i,
    });

    expect(pageTitle).toBeInTheDocument();
  });

  it("should render the event form", async () => {
    renderPage();

    const titleLabel = await screen.findByLabelText(/Title/i);
    const startTimeLabel = await screen.findByLabelText(/Start Time/i);

    expect(titleLabel).toBeInTheDocument();
    expect(startTimeLabel).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
