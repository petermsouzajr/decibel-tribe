import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  Mock,
  afterEach,
  beforeAll,
} from "vitest";
import { NextRequest } from "next/server";
// Remove direct imports of mocked modules
// import { cookies } from "next/headers";
// import prisma from "@/lib/prisma";
// import { lucia } from "@/auth";

// --- Define Mock Types ---
type PrismaEventAttendeeMock = {
  findMany: Mock;
  findUnique: Mock;
  create: Mock;
  delete: Mock;
};

type PrismaEventMock = {
  findUnique: Mock;
};

type PrismaNotificationMock = {
  findFirst: Mock;
  create: Mock;
};

type PrismaMock = {
  eventAttendee: PrismaEventAttendeeMock;
  event: PrismaEventMock;
  notification: PrismaNotificationMock;
  // Add user, userPreferences if needed later
};

type LuciaMock = {
  sessionCookieName: string;
  validateSession: Mock;
  createBlankSessionCookie: Mock;
  createSessionCookie: Mock;
};

// --- Declare and Initialize Mock Variables TOP LEVEL ---
let mockCookiesGet: Mock = vi.fn();
let mockCookiesSet: Mock = vi.fn();
let mockValidateSession: Mock = vi.fn();
let mockCreateBlankSessionCookie: Mock = vi.fn();
let mockCreateSessionCookie: Mock = vi.fn();
let mockEventAttendeeFindMany: Mock = vi.fn();
let mockEventAttendeeFindUnique: Mock = vi.fn();
let mockEventAttendeeCreate: Mock = vi.fn();
let mockEventAttendeeDelete: Mock = vi.fn();
let mockEventFindUnique: Mock = vi.fn();
let mockNotificationFindFirst: Mock = vi.fn();
let mockNotificationCreate: Mock = vi.fn();

// Define Top-Level Variables needed by mocks
const loggedInUserId = "user-123";
const targetEventId = "event-abc";
const mockLoggedInUser = { id: loggedInUserId, username: "testuser" };
const mockSessionData = { id: "valid-session-id", fresh: false };
const mockFreshSessionData = { ...mockSessionData, fresh: true };
const mockBlankCookie = {
  name: "auth_session",
  value: "",
  attributes: { expires: expect.any(Date) },
};
const mockNewSessionCookie = {
  name: "auth_session",
  value: "new-session-id",
  attributes: {},
};

// --- Top-Level Mocks ---

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: mockCookiesGet,
    set: mockCookiesSet,
  })),
}));

// Mock @/lib/prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    eventAttendee: {
      findMany: mockEventAttendeeFindMany,
      findUnique: mockEventAttendeeFindUnique,
      create: mockEventAttendeeCreate,
      delete: mockEventAttendeeDelete,
    },
    event: {
      findUnique: mockEventFindUnique,
    },
    notification: {
      findFirst: mockNotificationFindFirst,
      create: mockNotificationCreate,
    },
  },
}));

// Mock @/auth
vi.mock("@/auth", () => ({
  // Routes call this helper (src/auth.ts) instead of lucia directly;
  // delegate to the validateSession mock this file already configures.
  validateRequestWithCookieMutation: vi.fn(
    async () => (await mockValidateSession()) ?? { user: null, session: null },
  ),
  lucia: {
    sessionCookieName: "auth_session",
    validateSession: mockValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

// --- Define top-level variables for route handlers ---
let GET: typeof import("@/app/api/events/[eventId]/attendees/route").GET;
let POST: typeof import("@/app/api/events/[eventId]/attendees/route").POST;
let DELETE: typeof import("@/app/api/events/[eventId]/attendees/route").DELETE;

// --- Global Test Setup ---
describe("API Route: /api/events/{eventId}/attendees", () => {
  // Import handlers ONCE using beforeAll AFTER mocks are defined
  beforeAll(async () => {
    ({ GET, POST, DELETE } = await import(
      "@/app/api/events/[eventId]/attendees/route"
    ));
  });

  // Reset mocks and set default behaviors before each test
  beforeEach(() => {
    vi.resetAllMocks(); // Use resetAllMocks

    // --- Set Default Mock Behaviors (Common) ---
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockValidateSession.mockResolvedValue({
      // Default: Logged in
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);

    // Default Prisma mock behaviors (can be overridden in specific tests/describe blocks)
    mockEventFindUnique.mockResolvedValue({ createdById: "event-creator-id" }); // Assume event exists and has a creator
    mockNotificationFindFirst.mockResolvedValue(null); // Assume notification doesn't exist

    // Ensure attendee finding defaults to null unless overridden
    mockEventAttendeeFindUnique.mockResolvedValue(null);
  });

  // Add afterEach to restore mocks thoroughly
  afterEach(() => {
    vi.restoreAllMocks(); // Restore original implementations
  });

  // --- GET tests ---
  describe("GET", () => {
    let request: NextRequest;

    beforeEach(() => {
      // Set default GET-specific mock behaviors
      mockEventAttendeeFindMany.mockResolvedValue([]); // Default: No attendees
    });

    // Helper to create request
    const createMockRequest = (): NextRequest => {
      const url = new URL(
        `http://localhost/api/events/${targetEventId}/attendees`,
      );
      return new NextRequest(url);
    };

    // --- Auth Tests ---
    it("should return 401 if no session cookie is found", async () => {
      // Arrange
      mockCookiesGet.mockReturnValue(undefined); // Override default
      // Act
      request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      // Assert
      expect(response.status).toBe(401);
      expect(mockValidateSession).not.toHaveBeenCalled();
      expect(mockEventAttendeeFindMany).not.toHaveBeenCalled();
    });

    it("should return 401 if session validation fails", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({ user: null, session: null }); // Override default
      // Act
      request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      // Assert
      expect(response.status).toBe(401);
      expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockBlankCookie.name,
        mockBlankCookie.value,
        mockBlankCookie.attributes,
      );
      expect(mockEventAttendeeFindMany).not.toHaveBeenCalled();
    });

    it("should return 401 if user is null after session validation", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({
        user: null,
        session: mockSessionData,
      }); // Override default
      // Act
      request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      // Assert
      expect(response.status).toBe(401);
      expect(mockEventAttendeeFindMany).not.toHaveBeenCalled();
    });

    // --- Functionality Tests ---
    it("should return 400 if eventId param is missing", async () => {
      // Arrange
      request = createMockRequest(); // Request created before call
      // Act
      // Simulate Next.js not providing the param correctly
      const response = await GET(request, { params: Promise.resolve({ eventId: "" }) });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(400);
      expect(body).toEqual({ error: "Event ID is required" });
    });

    it("should return 404 if no attendees are found", async () => {
      // Arrange
      mockEventAttendeeFindMany.mockResolvedValue([]); // No attendees
      request = createMockRequest();

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(body).toEqual({ message: "No attendees found for this event" });
      expect(mockEventAttendeeFindMany).toHaveBeenCalledWith({
        where: { eventId: targetEventId },
        include: expect.any(Object), // Check structure later if needed
      });
    });

    it("should return the list of attendees successfully", async () => {
      // Arrange
      const mockAttendees = [
        {
          userId: "user-1",
          eventId: targetEventId,
          user: {
            id: "user-1",
            username: "a",
            displayName: "A",
            avatarUrl: null,
          },
        },
        {
          userId: "user-2",
          eventId: targetEventId,
          user: {
            id: "user-2",
            username: "b",
            displayName: "B",
            avatarUrl: null,
          },
        },
      ];
      mockEventAttendeeFindMany.mockResolvedValue(mockAttendees);
      request = createMockRequest();

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockEventAttendeeFindMany).toHaveBeenCalledWith({
        where: { eventId: targetEventId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
      expect(body).toEqual(mockAttendees);
    });

    it("should return 500 if prisma query fails", async () => {
      // Arrange
      mockEventAttendeeFindMany.mockRejectedValue(new Error("DB Error"));
      request = createMockRequest();

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "Internal server error" });
    });

    it("should handle fresh session correctly", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData,
      });
      request = createMockRequest();
      // Act
      await GET(request, { params: Promise.resolve({ eventId: targetEventId }) });
      // Assert
      expect(mockEventAttendeeFindMany).toHaveBeenCalled(); // Ensure main logic ran
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });
  });

  // --- POST tests ---
  describe("POST", () => {
    let request: NextRequest;
    const eventOwnerId = "user-event-owner"; // Keep separate owner ID distinct
    const postLoggedInUserId = "user-rsvp"; // Specific ID for POST tests
    const postMockLoggedInUser = { id: postLoggedInUserId, username: "rsvper" };
    const postMockSessionData = { id: "valid-session-rsvp", fresh: false };

    beforeEach(() => {
      // Reset mocks specific to POST
      mockEventAttendeeFindUnique.mockReset();
      mockEventAttendeeCreate.mockReset();
      mockEventFindUnique.mockReset();
      mockNotificationFindFirst.mockReset();
      mockNotificationCreate.mockReset();

      // Set default POST-specific mock behaviors
      mockValidateSession.mockResolvedValue({
        user: postMockLoggedInUser, // Use POST-specific user
        session: postMockSessionData,
      });
      // Default: Event exists, owned by someone else (eventOwnerId)
      mockEventFindUnique.mockResolvedValue({ createdById: eventOwnerId });
      mockEventAttendeeFindUnique.mockResolvedValue(null); // Default: User is not already attending
      mockNotificationFindFirst.mockResolvedValue(null); // Default: Notification doesn't exist
      // Default create returns simple object to avoid serialization issues
      mockEventAttendeeCreate.mockResolvedValue({ success: true });
    });

    // Helper for POST request (no body needed)
    const createMockRequest = (): NextRequest => {
      const url = new URL(
        `http://localhost/api/events/${targetEventId}/attendees`,
      );
      return new NextRequest(url, { method: "POST" });
    };

    // --- Auth Tests ---
    it("should return 401 if no session cookie is found", async () => {
      // Arrange
      mockCookiesGet.mockReturnValue(undefined);
      mockValidateSession.mockResolvedValue({ user: null, session: null });
      request = createMockRequest();

      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });

      // Assert
      expect(response.status).toBe(401);
      expect(mockValidateSession).not.toHaveBeenCalled();
      expect(mockEventAttendeeCreate).not.toHaveBeenCalled();
    });

    it("should return 401 if session validation fails", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({ user: null, session: null });
      request = createMockRequest();

      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });

      // Assert
      expect(response.status).toBe(401);
      expect(mockEventAttendeeCreate).not.toHaveBeenCalled();
    });

    // --- Functionality Tests ---
    it("should return 404 if event does not exist", async () => {
      // Arrange
      mockEventFindUnique.mockResolvedValue(null); // Event not found
      request = createMockRequest();
      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(404);
      expect(body.error).toBe("Event not found");
      // Check the findUnique call that happens AFTER create attendee
      expect(mockEventFindUnique).toHaveBeenCalledWith({
        where: { id: targetEventId },
        select: { createdById: true }, // Correct select clause
      });
      expect(mockEventAttendeeCreate).toHaveBeenCalled(); // Create is called before event check
    });

    it("should return 400 if user is already attending", async () => {
      // Arrange: Mock findUnique to return an existing record BEFORE create is called
      mockEventAttendeeFindUnique.mockResolvedValue({
        userId: loggedInUserId,
        eventId: targetEventId,
      });
      request = createMockRequest();

      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();

      // Assert: Route returns 400 in this case
      expect(response.status).toBe(400);
      expect(body.error).toBe("User is already an attendee of this event");
      expect(mockEventAttendeeFindUnique).toHaveBeenCalled(); // Checked for existing
      expect(mockEventAttendeeCreate).not.toHaveBeenCalled(); // Create should NOT be called
    });

    it("should successfully create attendance and notification", async () => {
      // Arrange: Setup specific event owner different from logged-in user
      const specificEventOwnerId = "specific-owner-123";
      mockEventFindUnique.mockResolvedValue({
        createdById: specificEventOwnerId,
      });
      // Ensure create mock returns simple object
      mockEventAttendeeCreate.mockResolvedValue({ success: true });
      request = createMockRequest();
      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(201);
      // Expect the simplified success object from the mock
      expect(body).toEqual({ success: true });
      // Use the correct user ID for this test suite (postLoggedInUserId)
      expect(mockEventAttendeeCreate).toHaveBeenCalledWith({
        data: { eventId: targetEventId, userId: postLoggedInUserId },
      });
      expect(mockNotificationFindFirst).toHaveBeenCalled();
      // Ensure notification create is called with correct recipient
      expect(mockNotificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ recipientId: specificEventOwnerId }),
        }),
      );
    });

    it("should not create notification if user owns the event", async () => {
      // Arrange
      const ownerUserId = postLoggedInUserId; // User for this suite IS the owner
      mockEventFindUnique.mockResolvedValue({ createdById: ownerUserId }); // Event owned by this user
      // Ensure create mock returns simple object
      mockEventAttendeeCreate.mockResolvedValue({ success: true });
      request = createMockRequest();
      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json(); // Check body to ensure route completed
      // Assert
      expect(response.status).toBe(201);
      expect(body).toEqual({ success: true }); // Check simple success body
      // Ensure create was called with the owner's ID
      expect(mockEventAttendeeCreate).toHaveBeenCalledWith({
        data: { userId: ownerUserId, eventId: targetEventId },
      });
      expect(mockNotificationCreate).not.toHaveBeenCalled(); // Check notification NOT called
    });

    it("should return 500 if finding event fails", async () => {
      // Arrange
      // Attendee create succeeds (default mock)
      mockEventFindUnique.mockRejectedValue(new Error("DB Error Find Event")); // Event lookup fails after create
      request = createMockRequest();
      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(mockEventAttendeeCreate).toHaveBeenCalled(); // Create was called before event check failed
    });

    it("should return 500 if finding existing attendance fails", async () => {
      // Arrange
      mockEventAttendeeFindUnique.mockRejectedValue(
        new Error("DB Error Find Attendee"),
      );
      request = createMockRequest();
      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(mockEventAttendeeCreate).not.toHaveBeenCalled(); // Create not called if initial check fails
    });

    it("should return 500 if creating attendance fails", async () => {
      // Arrange
      mockEventAttendeeFindUnique.mockResolvedValue(null); // Assume not attending yet
      mockEventAttendeeCreate.mockRejectedValue(
        new Error("DB Error Create Attendee"),
      );
      request = createMockRequest();
      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });

    // Renamed and corrected test based on route logic
    it("should return 500 if creating notification fails", async () => {
      // Arrange
      // Attendee creation succeeds (default mock)
      // Event lookup succeeds (default mock)
      mockNotificationCreate.mockRejectedValue(
        new Error("Notification DB Error"),
      );
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      request = createMockRequest();
      // Act
      const response = await POST(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert: Route returns 500 because error is not gracefully handled
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(mockNotificationCreate).toHaveBeenCalled(); // It was attempted
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should handle fresh session correctly", async () => {
      mockValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData,
      });
      request = createMockRequest();
      await POST(request, { params: Promise.resolve({ eventId: targetEventId }) });
      expect(mockEventAttendeeCreate).toHaveBeenCalled(); // Ensure main logic ran
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalled();
    });
  });

  // --- DELETE tests ---
  describe("DELETE", () => {
    let request: NextRequest;
    const deleteLoggedInUserId = "user-unattend"; // Specific ID for DELETE tests
    const deleteMockLoggedInUser = {
      id: deleteLoggedInUserId,
      username: "unattender",
    };
    const deleteMockSessionData = {
      id: "valid-session-unattend",
      fresh: false,
    };

    beforeEach(() => {
      mockEventAttendeeDelete.mockReset();
      mockEventAttendeeFindUnique.mockReset(); // Reset find unique too
      // Set default DELETE-specific mock behaviors
      mockValidateSession.mockResolvedValue({
        user: deleteMockLoggedInUser, // Use DELETE-specific user
        session: deleteMockSessionData,
      });
      // Assume user IS attending by default for delete tests
      mockEventAttendeeFindUnique.mockResolvedValue({
        userId: deleteLoggedInUserId, // Ensure find uses correct ID
        eventId: targetEventId,
      });
      // Default delete returns simple object
      mockEventAttendeeDelete.mockResolvedValue({});
    });

    // Helper for DELETE request
    const createMockRequest = (): NextRequest => {
      const url = new URL(
        `http://localhost/api/events/${targetEventId}/attendees`,
      );
      return new NextRequest(url, { method: "DELETE" });
    };

    // --- Auth Tests ---
    it("should return 401 if validation fails", async () => {
      // Arrange
      mockValidateSession.mockResolvedValue({ user: null, session: null });
      request = createMockRequest();
      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      // Assert
      expect(response.status).toBe(401);
      expect(mockEventAttendeeDelete).not.toHaveBeenCalled();
    });

    // --- Functionality Tests ---
    it("should return 400 if user is not currently attending", async () => {
      // Arrange: Mock findUnique to return null BEFORE delete is called
      mockEventAttendeeFindUnique.mockResolvedValue(null);
      request = createMockRequest();
      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert: Route returns 400
      expect(response.status).toBe(400);
      expect(body.error).toBe("User is not an attendee of this event");
      expect(mockEventAttendeeFindUnique).toHaveBeenCalled(); // Checked for existing
      expect(mockEventAttendeeDelete).not.toHaveBeenCalled(); // Delete should NOT be called
    });

    it("should successfully delete attendance record", async () => {
      // Arrange: The beforeEach sets up the user as attending
      request = createMockRequest();
      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(200);
      expect(body).toEqual({ message: "Attendee removed" });
      // Verify findUnique was called with the correct user ID for this suite
      expect(mockEventAttendeeFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_eventId: {
              userId: deleteLoggedInUserId,
              eventId: targetEventId,
            },
          },
        }),
      );
      // Verify delete was called with the correct user ID for this suite
      expect(mockEventAttendeeDelete).toHaveBeenCalledWith({
        where: {
          userId_eventId: {
            userId: deleteLoggedInUserId, // Use correct ID here
            eventId: targetEventId,
          },
        },
      });
    });

    // --- Error Handling ---
    it("should return 500 if finding attendance record fails", async () => {
      // Arrange
      mockEventAttendeeFindUnique.mockRejectedValue(new Error("DB Error Find"));
      request = createMockRequest();
      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(mockEventAttendeeDelete).not.toHaveBeenCalled();
    });

    it("should return 500 if deleting attendance record fails", async () => {
      // Arrange
      mockEventAttendeeDelete.mockRejectedValue(new Error("DB Error Delete"));
      request = createMockRequest();
      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ eventId: targetEventId  }),
      });
      const body = await response.json();
      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(mockEventAttendeeDelete).toHaveBeenCalled(); // Delete was attempted
    });

    it("should handle fresh session correctly", async () => {
      mockValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData,
      });
      request = createMockRequest();
      await DELETE(request, { params: Promise.resolve({ eventId: targetEventId }) });
      expect(mockEventAttendeeDelete).toHaveBeenCalled(); // Ensure main logic ran
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalled();
    });
  });
});
