import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EventDetails from "@/components/events/Event"; // Keep the import to see if it causes the issue
import { EventData, UserData } from "@/lib/types";
import SessionProvider from "@/app/(main)/SessionProvider";
import { User as LuciaUser } from "lucia";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// // Mocks UNCOMMENTED
vi.mock("@/components/events/mutations", () => ({
  useRsvpMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// // Mock Data UNCOMMENTED
const createMockUserData = (id: string, username: string): UserData => ({
  id: id,
  username: username,
  displayName: `Display ${username}`,
  avatarUrl: null,
  bio: null,
  createdAt: new Date(), // Date object
  email: null,
  passwordHash: null,
  userPreferences: null,
  userInstruments: [],
  userSkills: [],
  _count: { followers: 0, posts: 0 },
});

const mockEventCreator = createMockUserData("user1", "testcreator");
const mockAttendeeUser = createMockUserData("user2", "testattendee");

const mockEvent = {
  id: "event1",
  title: "Test Event Title",
  location: "Test Location",
  description: "Desc",
  url: "http://example.com/event",
  when: new Date(),
  startTime: new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
  endTime: new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
  performers: ["Performer 1"],
  createdById: "user1",
  isCancelled: false,
  status: "Scheduled",
  visibility: "Public",
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: mockEventCreator,
  attendees: [{ user: mockAttendeeUser }],
  _count: { attendees: 1 },
};

const mockLuciaUser: LuciaUser = {
  id: "user1",
  username: "testcreator",
  displayName: "Display testcreator",
  avatarUrl: null,
  googleId: null,
};
const mockSessionContext = {
  user: mockLuciaUser,
  session: { id: "session1", expiresAt: new Date(), userId: "user1" } as any,
};
const queryClient = new QueryClient();

describe("[Events][Component] EventDetails (Full Restore)", () => {
  // // render helper UNCOMMENTED
  const renderEvent = (
    eventData = mockEvent,
    sessionContext = mockSessionContext,
  ) => {
    // Add type annotation back to mockEvent? Let's try without first.
    const typedEventData = eventData as EventData; // Use type assertion for now

    return render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider value={sessionContext}>
          {/* Ensure event prop is correctly typed */}
          <EventDetails event={typedEventData} />
        </SessionProvider>
      </QueryClientProvider>,
    );
  };

  // // TODO: [Events] Implement detailed test cases for Event component
  // // ... (keep existing TODOs)

  // Original test case UNCOMMENTED
  it("should render event title", async () => {
    // Mock fetch for this specific test
    const mockFetch = vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (url === `/api/events/${mockEvent.id}/attendees`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ userId: "user2" }]), // Mock response matching component logic check
        } as Response);
      }
      // Fallback for other fetch calls if any
      return Promise.resolve({ ok: false, status: 404 } as Response);
    });

    renderEvent(); // Use default mockEvent

    // Wait for potential state updates after fetch by using findByText
    await screen.findByText(mockEvent.title, { exact: false }); // UNCOMMENTED

    // Now make the assertion after waiting
    expect(
      screen.getByText(mockEvent.title, { exact: false }),
    ).toBeInTheDocument();

    // Restore fetch mock
    mockFetch.mockRestore();
  });

  // Keep dummy test just in case
  it("should still be discoverable", () => {
    expect(true).toBe(true);
  });
});
