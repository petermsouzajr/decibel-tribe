import { describe, it, expect, vi, beforeEach, Mock, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { UserData } from "@/lib/types";

// --- Declare Hoisted Mock Function Variables FIRST ---
const { mockCookiesGet, mockCookiesSet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockCookiesSet: vi.fn(),
}));
const {
  mockEventCreate,
  mockEventFindMany,
  mockEventFindUnique,
  mockEventDelete,
  mockEventUpdate,
  mockEventAttendeeDelete,
  mockUserFindUnique,
  mockUserPreferencesFindUnique,
} = vi.hoisted(() => ({
  mockEventCreate: vi.fn(),
  mockEventFindMany: vi.fn(),
  mockEventFindUnique: vi.fn(),
  mockEventDelete: vi.fn(),
  mockEventUpdate: vi.fn(),
  mockEventAttendeeDelete: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserPreferencesFindUnique: vi.fn(),
}));
const {
  mockLuciaValidateSession,
  mockCreateBlankSessionCookie,
  mockCreateSessionCookie,
} = vi.hoisted(() => ({
  mockLuciaValidateSession: vi.fn(),
  mockCreateBlankSessionCookie: vi.fn(),
  mockCreateSessionCookie: vi.fn(),
}));
const luciaSessionCookieName = "auth_session";

// --- Top-Level Mocks using vi.mock ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      create: mockEventCreate,
      findMany: mockEventFindMany,
      findUnique: mockEventFindUnique,
      delete: mockEventDelete,
      update: mockEventUpdate,
    },
    eventAttendee: {
      delete: mockEventAttendeeDelete,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    userPreferences: {
      findUnique: mockUserPreferencesFindUnique,
    },
  },
}));

vi.mock("@/auth", () => ({
  lucia: {
    sessionCookieName: "auth_session",
    validateSession: mockLuciaValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

// --- Import Route Handlers AFTER Top-Level Mocks ---
import { GET, POST, DELETE, PATCH, PUT } from "@/app/api/events/route";

// --- POST tests ---
describe("POST /api/events", () => {
  let request: NextRequest;
  const loggedInUserId = "user-creator-1";
  const loggedInUsername = "creatorUser";
  const mockEventData = {
    title: "Test Event",
    location: "Test Location",
    description: "Test Description",
    url: "http://test.com",
    when: new Date().toISOString(),
    startTime: "10:00",
    endTime: "12:00",
    performers: ["Performer 1"],
    status: "PUBLISHED",
    visibility: "PUBLIC",
    isCancelled: false,
  };
  const mockCreatedEvent = {
    ...mockEventData,
    id: "new-event-123",
    createdById: loggedInUserId,
  };
  const mockBlankCookie = {
    name: luciaSessionCookieName,
    value: "",
    attributes: { expires: expect.any(Date) },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default auth setup
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: loggedInUsername },
      session: { id: "valid-session-id", fresh: false },
    });
  });

  const createMockRequest = (body: any): NextRequest => {
    const url = new URL("http://localhost/api/events");
    return new NextRequest(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  };

  // Auth Tests
  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    request = createMockRequest(mockEventData);
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockLuciaValidateSession).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    request = createMockRequest(mockEventData);
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
  });

  // Functionality Tests
  it("should create an event and return it with status 201 on success", async () => {
    mockEventCreate.mockResolvedValue(mockCreatedEvent);
    request = createMockRequest(mockEventData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual(mockCreatedEvent);
    expect(mockEventCreate).toHaveBeenCalledWith({
      data: {
        ...mockEventData,
        createdBy: { connect: { id: loggedInUserId } },
        attendees: { create: { userId: loggedInUserId } },
      },
    });
  });

  it("should return 500 if prisma event creation fails", async () => {
    mockEventCreate.mockRejectedValue(new Error("DB Error"));
    request = createMockRequest(mockEventData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });
});

// --- GET tests ---
describe("GET /api/events", () => {
  let request: NextRequest;
  const loggedInUserId = "user-viewer-1";
  const loggedInUsername = "viewerUser";
  const targetUserId = "user-target-1";
  const targetUsername = "targetUser";
  const mockEvents = [
    { id: "event-1", title: "Event 1", createdById: targetUserId },
  ];
  const mockBlankCookie = {
    name: luciaSessionCookieName,
    value: "",
    attributes: { expires: expect.any(Date) },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default auth setup
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: loggedInUsername }, // Default logged-in user
      session: { id: "valid-session-id", fresh: false },
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
  });

  const createMockRequest = (params?: Record<string, string>): NextRequest => {
    const url = new URL("http://localhost/api/events");
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return new NextRequest(url, { method: "GET" });
  };

  // Auth Tests
  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("should return 401 if session validation fails", async () => {
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
  });

  // Functionality: No username provided (fetch logged-in user's events)
  it("should fetch events created by or attended by the logged-in user if no username is provided", async () => {
    mockEventFindMany.mockResolvedValue(mockEvents);
    request = createMockRequest(); // No user param
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockEvents);
    expect(mockEventFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { createdById: loggedInUserId },
          {
            attendees: { some: { userId: loggedInUserId } },
            status: "PUBLISHED",
          },
        ],
      },
      orderBy: { when: "asc" },
      include: { attendees: expect.any(Object) }, // Simplified check
    });
  });

  // Functionality: Username provided (logged-in user is the target user)
  it("should fetch all events for the target user if logged-in user is the target user", async () => {
    mockLuciaValidateSession.mockResolvedValue({
      // Simulate logged-in user IS target user
      user: { id: targetUserId, username: targetUsername },
      session: { id: "valid-session-id", fresh: false },
    });
    mockUserFindUnique.mockResolvedValue({ id: targetUserId }); // Mock finding the target user
    mockUserPreferencesFindUnique.mockResolvedValue({ calendar: "PRIVATE" }); // Calendar pref doesn't matter here
    mockEventFindMany.mockResolvedValue(mockEvents);

    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockEvents);
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockUserPreferencesFindUnique).toHaveBeenCalledWith({
      where: { userId: targetUserId },
      select: { calendar: true },
    });
    expect(mockEventFindMany).toHaveBeenCalledWith({
      where: { createdById: targetUserId }, // Should fetch all by creator
      orderBy: { when: "asc" },
      include: { attendees: expect.any(Object) },
    });
  });

  // Functionality: Username provided (different user, public calendar)
  it("should fetch public/published events for the target user if calendar is PUBLIC", async () => {
    mockUserFindUnique.mockResolvedValue({ id: targetUserId });
    mockUserPreferencesFindUnique.mockResolvedValue({ calendar: "PUBLIC" }); // Public calendar
    mockEventFindMany.mockResolvedValue(mockEvents);

    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockEvents);
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockUserPreferencesFindUnique).toHaveBeenCalledWith({
      where: { userId: targetUserId },
      select: { calendar: true },
    });
    expect(mockEventFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            AND: [
              { createdById: targetUserId },
              { status: "PUBLISHED" },
              { visibility: "PUBLIC" },
              { isCancelled: false },
            ],
          },
          {
            AND: [
              { attendees: { some: { userId: targetUserId } } },
              { status: "PUBLISHED" },
              { visibility: "PUBLIC" },
              { isCancelled: false },
            ],
          },
        ],
      },
      orderBy: { when: "asc" },
      include: { attendees: expect.any(Object) },
    });
  });

  // Functionality: Username provided (different user, private calendar)
  it("should return empty array for the target user if calendar is PRIVATE", async () => {
    mockUserFindUnique.mockResolvedValue({ id: targetUserId });
    mockUserPreferencesFindUnique.mockResolvedValue({ calendar: "PRIVATE" }); // Private calendar
    // mockEventFindMany should NOT be called

    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]); // Expect empty array
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: targetUsername },
      select: { id: true },
    });
    expect(mockUserPreferencesFindUnique).toHaveBeenCalledWith({
      where: { userId: targetUserId },
      select: { calendar: true },
    });
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  // Functionality: Username provided (user not found)
  it("should return 404 if the target user is not found", async () => {
    mockUserFindUnique.mockResolvedValue(null); // User not found
    request = createMockRequest({ user: "nonexistentuser" });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "User not found" });
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: "nonexistentuser" },
      select: { id: true },
    });
    expect(mockUserPreferencesFindUnique).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  // Error Handling
  it("should return 500 if prisma findMany fails", async () => {
    mockEventFindMany.mockRejectedValue(new Error("DB Error"));
    request = createMockRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("should return 500 if prisma findUnique for user fails", async () => {
    mockUserFindUnique.mockRejectedValue(new Error("DB User Error"));
    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(mockUserPreferencesFindUnique).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it("should return 500 if prisma findUnique for preferences fails", async () => {
    mockUserFindUnique.mockResolvedValue({ id: targetUserId });
    mockUserPreferencesFindUnique.mockRejectedValue(
      new Error("DB Prefs Error"),
    );
    request = createMockRequest({ user: targetUsername });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(mockUserFindUnique).toHaveBeenCalled();
    expect(mockUserPreferencesFindUnique).toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });
});

// --- DELETE tests ---
describe("DELETE /api/events", () => {
  let request: NextRequest;
  const loggedInUserId = "user-logged-in";
  const eventOwnerId = "user-owner";
  const eventIdToDelete = "event-to-delete";
  const mockBlankCookie = {
    name: luciaSessionCookieName,
    value: "",
    attributes: { expires: expect.any(Date) },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default to loggedInUserId being authenticated
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: "loggedinuser" },
      session: { id: "valid-session-id", fresh: false },
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
  });

  const createMockRequest = (eventIdParam?: string): NextRequest => {
    const url = new URL("http://localhost/api/events");
    if (eventIdParam) {
      url.searchParams.set("eventId", eventIdParam);
    }
    return new NextRequest(url, { method: "DELETE" });
  };

  // --- Auth Tests ---
  it("should return 401 if no session cookie is found", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    request = createMockRequest(eventIdToDelete);
    const response = await DELETE(request);
    expect(response.status).toBe(401);
    expect(mockLuciaValidateSession).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    request = createMockRequest(eventIdToDelete);
    const response = await DELETE(request);
    expect(response.status).toBe(401);
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
  });

  // --- Parameter Test ---
  it("should return 400 if eventId query parameter is missing", async () => {
    request = createMockRequest(); // No eventId provided
    const response = await DELETE(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Event ID is required" });
  });

  // --- Functionality Tests ---
  it("should return 404 if the event is not found", async () => {
    mockEventFindUnique.mockResolvedValue(null);
    request = createMockRequest(eventIdToDelete);
    const response = await DELETE(request);
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Event not found" });
    expect(mockEventFindUnique).toHaveBeenCalledWith({
      where: { id: eventIdToDelete },
      include: { createdBy: true },
    });
  });

  it("should delete the event (204) if the logged-in user is the owner", async () => {
    // Arrange: loggedInUser is the owner
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: eventOwnerId, username: "owneruser" },
      session: { id: "valid-session-id", fresh: false },
    });
    mockEventFindUnique.mockResolvedValue({
      id: eventIdToDelete,
      createdById: eventOwnerId,
      createdBy: { id: eventOwnerId },
    });
    request = createMockRequest(eventIdToDelete);

    // Act
    const response = await DELETE(request);

    // Assert
    expect(response.status).toBe(204);
    expect(mockEventFindUnique).toHaveBeenCalledWith({
      where: { id: eventIdToDelete },
      include: { createdBy: true },
    });
    expect(mockEventDelete).toHaveBeenCalledWith({
      where: { id: eventIdToDelete },
    });
    expect(mockEventAttendeeDelete).not.toHaveBeenCalled();
  });

  it("should remove attendee record (un-RSVP) (204) if the logged-in user is not the owner", async () => {
    // Arrange: loggedInUser is NOT the owner
    mockEventFindUnique.mockResolvedValue({
      id: eventIdToDelete,
      createdById: eventOwnerId, // Different owner
      createdBy: { id: eventOwnerId },
    });
    request = createMockRequest(eventIdToDelete);

    // Act
    const response = await DELETE(request);

    // Assert
    expect(response.status).toBe(204);
    expect(mockEventFindUnique).toHaveBeenCalledWith({
      where: { id: eventIdToDelete },
      include: { createdBy: true },
    });
    expect(mockEventDelete).not.toHaveBeenCalled();
    expect(mockEventAttendeeDelete).toHaveBeenCalledWith({
      where: {
        userId_eventId: {
          userId: loggedInUserId,
          eventId: eventIdToDelete,
        },
      },
    });
  });

  it("should return 500 if prisma event find fails", async () => {
    mockEventFindUnique.mockRejectedValue(new Error("DB Error"));
    request = createMockRequest(eventIdToDelete);
    const response = await DELETE(request);
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("should return 500 if prisma event delete fails (owner case)", async () => {
    // Arrange: loggedInUser is the owner
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: eventOwnerId, username: "owneruser" },
      session: { id: "valid-session-id", fresh: false },
    });
    mockEventFindUnique.mockResolvedValue({
      id: eventIdToDelete,
      createdById: eventOwnerId,
      createdBy: { id: eventOwnerId },
    });
    mockEventDelete.mockRejectedValue(new Error("DB Delete Error"));
    request = createMockRequest(eventIdToDelete);

    // Act
    const response = await DELETE(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("should return 500 if prisma attendee delete fails (attendee case)", async () => {
    // Arrange: loggedInUser is NOT the owner
    mockEventFindUnique.mockResolvedValue({
      id: eventIdToDelete,
      createdById: eventOwnerId,
      createdBy: { id: eventOwnerId },
    });
    mockEventAttendeeDelete.mockRejectedValue(
      new Error("DB Attendee Delete Error"),
    );
    request = createMockRequest(eventIdToDelete);

    // Act
    const response = await DELETE(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });
});

// --- PATCH tests ---
describe("PATCH /api/events", () => {
  let request: NextRequest;
  const loggedInUserId = "user-logged-in";
  const eventOwnerId = "user-owner";
  const eventIdToUpdate = "event-to-update";
  const validUpdateData = {
    title: "Updated Event Name",
    description: "Updated description",
  };
  const mockBlankCookie = {
    name: luciaSessionCookieName,
    value: "",
    attributes: { expires: expect.any(Date) },
  };
  const mockNewSessionCookie = {
    name: luciaSessionCookieName,
    value: "new-session-id",
    attributes: {},
  };

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: "loggedinuser" },
      session: { id: "valid-session-id", fresh: false },
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);
    // Assume event exists and user is owner by default for most tests
    mockEventFindUnique.mockResolvedValue({
      id: eventIdToUpdate,
      createdById: loggedInUserId,
    });
    mockEventUpdate.mockResolvedValue({
      id: eventIdToUpdate,
      ...validUpdateData,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (body: any, eventId?: string): NextRequest => {
    const effectiveEventId = eventId ?? eventIdToUpdate;
    const url = new URL(
      `http://localhost/api/events?eventId=${effectiveEventId}`,
    );
    return new NextRequest(url, {
      method: "PATCH",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  };

  // --- Auth Tests ---
  it("should return 401 if no session cookie", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    request = createMockRequest(validUpdateData);
    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it("should return 401 if session invalid", async () => {
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    request = createMockRequest(validUpdateData);
    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  // --- Parameter/Body Tests ---
  it("should return 400 if eventId query param is missing", async () => {
    request = createMockRequest(validUpdateData, "");
    const response = await PATCH(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Event ID is required" });
  });

  it("should return 400 if request body is invalid JSON", async () => {
    request = createMockRequest("{invalid json");
    const response = await PATCH(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid JSON body");
  });

  it("should return 400 if update data is invalid (zod schema)", async () => {
    const invalidData = { title: "" };
    request = createMockRequest(invalidData);
    const response = await PATCH(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  // --- Functionality Tests ---
  it("should return 404 if event not found", async () => {
    mockEventFindUnique.mockResolvedValue(null);
    request = createMockRequest(validUpdateData);
    const response = await PATCH(request);
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Event not found" });
  });

  it("should return 403 if user is not the event owner", async () => {
    mockEventFindUnique.mockResolvedValue({
      id: eventIdToUpdate,
      createdById: eventOwnerId,
    });
    request = createMockRequest(validUpdateData);
    const response = await PATCH(request);
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("should update event and return 200 with updated data if valid and user is owner", async () => {
    const simpleUpdateData = { description: "New simple description" };
    const mockUpdatedEvent = {
      id: eventIdToUpdate,
      createdById: loggedInUserId,
      ...simpleUpdateData,
    };
    mockEventUpdate.mockResolvedValue(mockUpdatedEvent);

    request = createMockRequest(simpleUpdateData);
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockEventUpdate).toHaveBeenCalledWith({
      where: { id: eventIdToUpdate },
      data: simpleUpdateData,
    });
    expect(body).toEqual(mockUpdatedEvent);
  });

  // --- Error Handling ---
  it("should return 500 if prisma event find fails", async () => {
    mockEventFindUnique.mockRejectedValue(new Error("DB Find Error"));
    request = createMockRequest(validUpdateData);
    const response = await PATCH(request);
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("should return 500 if prisma event update fails", async () => {
    mockEventUpdate.mockRejectedValue(new Error("DB Update Error"));
    request = createMockRequest(validUpdateData);
    const response = await PATCH(request);
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });
});

// --- PUT tests ---
describe("PUT /api/events", () => {
  it("should return 401 if no session cookie", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    const request = new NextRequest("http://localhost/api/events", {
      method: "PUT",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("should return 401 if session invalid", async () => {
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    const request = new NextRequest("http://localhost/api/events", {
      method: "PUT",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const response = await PUT(request);
    expect(response.status).toBe(401);
  });
});
