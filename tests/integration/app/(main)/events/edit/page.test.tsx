import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
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

describe("EventFormPage Integration Test", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <EventFormPage />
      </QueryClientProvider>,
    );

  it("renders the form heading", async () => {
    renderComponent();

    const pageTitle = await screen.findByRole("heading", {
      name: /Create New Event/i,
    });

    expect(pageTitle).toBeInTheDocument();
  });

  it("renders the event form", async () => {
    renderComponent();

    const titleLabel = await screen.findByLabelText(/Title/i);
    const startTimeLabel = await screen.findByLabelText(/Start Time/i);

    expect(titleLabel).toBeInTheDocument();
    expect(startTimeLabel).toBeInTheDocument();
  });
});
