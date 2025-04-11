import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EventFormPage from "@/app/(main)/events/edit/page";
import { vi } from "vitest";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

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

// Mock auth module
vi.mock("@/auth", () => ({
  validateRequest: vi.fn(),
}));

// Mock prisma client
vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock Mutation Hooks
const mockMutateFn = vi.fn();
vi.mock("../../calendar/mutations", () => ({
  useAddEventMutation: vi.fn(() => ({
    mutate: mockMutateFn,
    isPending: false,
  })),
  useEditEventMutation: vi.fn(() => ({
    mutate: mockMutateFn,
    isPending: false,
  })),
}));

describe("Edit Event Page", () => {
  let queryClient: QueryClient;
  // Comment out fixedDate as it's not used with real timers
  // const fixedDate = new Date("2024-09-30T10:00:00.000Z");

  beforeEach(() => {
    // Use real timers
    // vi.useFakeTimers();
    // vi.setSystemTime(fixedDate);
    queryClient = new QueryClient();
    vi.clearAllMocks();

    // Explicitly resolve mocks within beforeEach
    vi.mocked(validateRequest).mockResolvedValue({
      user: { id: "user-1" } as any,
      session: null,
    });
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null); // Default: creating new event
    vi.mocked(mockGet).mockReturnValue(null); // Default: no eventId search param

    // Mock global fetch for this test suite
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/users/preferences") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ calendarPreference: "PUBLIC" }), // Mock pref fetch success
        });
      }
      // Mock event fetch (adjust mock data as needed for tests)
      if (url.startsWith("/api/events/")) {
        const currentEventId = mockGet("id"); // Get ID from mocked searchParams
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: currentEventId || "new-event-id", // Use ID from params or fallback
              title: "Mock Event Title",
              location: "Mock Location",
              description: "Mock Description",
              url: "",
              when: new Date().toISOString(), // Or provide a reasonable default date string
              startTime: "10:00",
              endTime: "11:00",
              performers: ["Mock Performer"],
              status: "DRAFT",
              visibility: "PRIVATE",
              isCancelled: false,
            }),
        });
      }
      // Default fallback for any other fetch calls
      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  afterEach(() => {
    // Use real timers
    // vi.useRealTimers();
  });

  const renderPage = async () => {
    const renderResult = render(
      <QueryClientProvider client={queryClient}>
        <EventFormPage />
      </QueryClientProvider>,
    );
    // Remove timer advancement
    // await vi.runAllTimers();
    // Wait for a key element to ensure initial async updates complete
    await screen.findByRole("heading", { name: /Create New Event/i });
    return renderResult;
  };

  it("should render the form heading", async () => {
    await renderPage(); // Await the render helper

    const pageTitle = screen.getByRole("heading", {
      name: /Create New Event/i,
    });

    expect(pageTitle).toBeInTheDocument();
  });

  it("should render the event form", async () => {
    await renderPage(); // Await the render helper

    const titleLabel = screen.getByLabelText(/Title/i);
    const startTimeLabel = screen.getByLabelText(/Start Time/i);

    expect(titleLabel).toBeInTheDocument();
    expect(startTimeLabel).toBeInTheDocument();
  });

  it("should match snapshot and contain key static elements", async () => {
    await renderPage(); // Await the render helper

    // Check for key static elements
    expect(
      screen.getByRole("heading", { name: /Create New Event/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/When/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Performer 1/i)).toBeInTheDocument();

    // Keep snapshot for broader structural check
    expect(document.body).toMatchSnapshot();
  });
});
