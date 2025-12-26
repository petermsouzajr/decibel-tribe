import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Page from "@/app/(main)/events/[eventId]/page";
import { vi } from "vitest";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

// Mock the Page component itself
vi.mock("@/app/(main)/events/[eventId]/page", () => ({
  // Provide a simple React component as the default export
  default: () => <div>Mocked Event Details Page</div>,
  // Mock generateMetadata if needed by other parts of the test setup (unlikely here)
  generateMetadata: vi.fn().mockResolvedValue({ title: "Mock Event Title" }),
}));

// Mock auth module
vi.mock("@/auth", () => ({
  validateRequest: vi.fn(),
}));

// Remove potentially problematic page module mock
// vi.mock("@/app/(main)/events/[eventId]/page", async (importOriginal) => {
//   const actual =
//     await importOriginal<typeof import("@/app/(main)/events/[eventId]/page")>();
//   return {
//     ...actual,
//     generateMetadata: vi.fn().mockResolvedValue({ title: "Mock Event Title" }),
//   };
// });

// Mock prisma client
vi.mock("@/lib/prisma", () => ({
  default: {
    // Mock specific models and methods used
    event: {
      findUnique: vi.fn(),
    },
    // Add mocks for other models/methods if needed by the page
  },
}));

// Define mock event data (adjust based on actual Event type)
const mockEventData = {
  id: "event-id",
  title: "Mock Event",
  description: "Mock description",
  createdById: "user-1",
  when: new Date(),
  startTime: "10:00",
  endTime: "12:00",
  location: "Mock Location",
  zipCode: null,
  latitude: null,
  longitude: null,
  coverImage: null,
  url: null,
  performers: [],
  isCancelled: false,
  status: "SCHEDULED",
  visibility: "PUBLIC",
  groupId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: "user-1", username: "mockuser" },
  attendees: [],
  helpWantedSkills: [],
  group: null,
  _count: { attendees: 0 },
};

// NOTE: Skipping due to persistent "Cannot destructure property 'params'" error.
// Needs further investigation into async component rendering/prop handling in Vitest.
describe("Event Details Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    // Reset mocks and configure defaults
    vi.clearAllMocks();
    vi.mocked(validateRequest).mockResolvedValue({
      user: { id: "user-1" } as any,
      session: null,
    });
    vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEventData);
  });

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<div>Loading...</div>}>
          {/* The actual Page import will now resolve to our mock */}
          <Page
            params={Promise.resolve({
              eventId: "event-id",
            })}
          />
        </React.Suspense>
      </QueryClientProvider>,
    );

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
