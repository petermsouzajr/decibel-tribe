import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { NotificationData, NotificationsPage } from "@/lib/types";
import { NotificationType } from "@prisma/client";
import type { GET as GETType } from "@/app/api/notifications/route";

// Keep type imports
// import { cookies } from "next/headers"; // Mocked below
// import prisma from "@/lib/prisma"; // Mocked below
// import { lucia } from "@/auth"; // Mocked below

// Mock dependencies
// vi.mock("next/headers", () => ({
//   cookies: vi.fn(),
// }));
//
// vi.mock("@/lib/prisma", () => ({
//   default: {
//     notification: {
//       findMany: vi.fn(),
//     },
//   },
// }));
//
// // Mock lucia and its methods
// vi.mock("@/auth", () => ({
//   lucia: {
//     sessionCookieName: "auth_session",
//     validateSession: vi.fn(),
//     createBlankSessionCookie: vi.fn(() => ({
//       name: "auth_session",
//       value: "",
//       attributes: {},
//     })),
//     createSessionCookie: vi.fn(() => ({
//       name: "auth_session",
//       value: "new-session-id",
//       attributes: {},
//     })),
//   },
// }));
//
// // Mock NextResponse
// // We can't directly mock the class methods like .json easily with vi.mock
// // Instead, we'll spy on the global NextResponse object if needed or check the return value structure.
// // For simplicity here, we'll check the return values directly.
//
// (cookies as Mock).mockReturnValue({
//   get: vi.fn(),
//   set: vi.fn(),
// });

// --- Mock Variable Declarations ---
let mockCookiesGet: Mock;
let mockCookiesSet: Mock;
let mockValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockNotificationFindMany: Mock;

// --- Helper Types ---
// Using Response as it seems less problematic than specific NextResponse generics
type ApiHandlerGet = (request: NextRequest) => Promise<Response>;

describe("GET /api/notifications", () => {
  const loggedInUserId = "user-1";
  const mockBlankCookieData = {
    name: "auth_session",
    value: "",
    attributes: {},
  };
  const mockNewSessionCookieData = {
    name: "auth_session",
    value: "new-session-id",
    attributes: {},
  };

  // Define handler variable
  let GET: ApiHandlerGet;

  beforeEach(async () => {
    // 1. Reset mocks and modules
    vi.resetAllMocks();
    vi.resetModules();

    // 2. Define mock implementations
    mockCookiesGet = vi.fn();
    mockCookiesSet = vi.fn();
    mockValidateSession = vi.fn();
    mockCreateBlankSessionCookie = vi.fn(() => mockBlankCookieData);
    mockCreateSessionCookie = vi.fn(() => mockNewSessionCookieData);
    mockNotificationFindMany = vi.fn();

    // 3. Apply mocks using vi.doMock
    vi.doMock("next/headers", () => ({
      cookies: vi.fn(() => ({
        get: mockCookiesGet,
        set: mockCookiesSet,
      })),
    }));

    vi.doMock("@/lib/prisma", () => ({
      default: {
        notification: {
          findMany: mockNotificationFindMany,
        },
      },
    }));

    vi.doMock("@/auth", () => ({
      lucia: {
        sessionCookieName: "auth_session",
        validateSession: mockValidateSession,
        createBlankSessionCookie: mockCreateBlankSessionCookie,
        createSessionCookie: mockCreateSessionCookie,
      },
    }));

    // 4. Set default mock behaviors
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" }); // Default to valid session
    mockValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: "testuser" },
      session: { id: "valid-session-id", fresh: false },
    });

    // 5. Dynamically import the module
    const mod = await import("@/app/api/notifications/route");
    GET = mod.GET;
  });

  const createMockRequest = (cursor?: string): NextRequest => {
    const url = new URL(
      `http://localhost/api/notifications${cursor ? `?cursor=${cursor}` : ""}`,
    );
    return new NextRequest(url);
  };

  it("should return 401 if no session cookie is found", async () => {
    // Arrange
    mockCookiesGet.mockReturnValue(undefined); // No session cookie
    const request = createMockRequest();

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(401);
    expect(mockValidateSession).not.toHaveBeenCalled();
    expect(mockNotificationFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if session validation fails", async () => {
    // Arrange
    mockValidateSession.mockResolvedValue({ user: null, session: null });
    const request = createMockRequest();

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(401);
    expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
    expect(mockCookiesSet).toHaveBeenCalled(); // Should try to clear cookie
    expect(mockNotificationFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if user is not found even with a valid session", async () => {
    // Arrange
    // This scenario might be less likely if validateSession guarantees user if session exists, but testing defensively
    mockValidateSession.mockResolvedValue({
      user: null, // Simulate user somehow being null despite session
      session: { id: "valid-session-id", fresh: false },
    });
    const request = createMockRequest();

    // Act
    const response = await GET(request);

    // Assert
    expect(response.status).toBe(401);
    expect(mockNotificationFindMany).not.toHaveBeenCalled();
  });

  it("should set a new cookie if the session is fresh", async () => {
    // Arrange
    mockValidateSession.mockResolvedValue({
      user: { id: loggedInUserId, username: "testuser" },
      session: { id: "valid-session-id", fresh: true }, // Fresh session
    });
    mockNotificationFindMany.mockResolvedValue([]); // Return empty data is fine
    const request = createMockRequest();

    // Act
    await GET(request);

    // Assert
    expect(mockCreateSessionCookie).toHaveBeenCalledWith("valid-session-id");
    expect(mockCookiesSet).toHaveBeenCalledWith(
      mockNewSessionCookieData.name,
      mockNewSessionCookieData.value,
      mockNewSessionCookieData.attributes,
    );
  });

  it("should fetch notifications successfully without a cursor", async () => {
    // Arrange
    const mockNotificationsRaw: Partial<NotificationData>[] = [
      {
        id: "notif-1",
        type: NotificationType.LIKE,
        recipientId: loggedInUserId,
        issuerId: "user-2",
        postId: "post-1",
        eventId: null,
        read: false,
        createdAt: new Date(),
        issuer: {
          id: "user-2",
          username: "issuer",
          displayName: "Issuer",
          avatarUrl: null,
        } as any,
        post: { id: "post-1", content: "Hello" },
        event: null,
      },
      {
        id: "notif-2",
        type: NotificationType.FOLLOW,
        recipientId: loggedInUserId,
        issuerId: "user-3",
        postId: null,
        eventId: null,
        read: true,
        createdAt: new Date(),
        issuer: {
          id: "user-3",
          username: "issuer2",
          displayName: "Issuer 2",
          avatarUrl: null,
        } as any,
        post: null,
        event: null,
      },
    ];
    mockNotificationFindMany.mockResolvedValue(
      mockNotificationsRaw as NotificationData[],
    );
    const request = createMockRequest();

    // Act
    const response = await GET(request);
    const body: NotificationsPage = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: loggedInUserId },
        take: 11,
        cursor: undefined,
        orderBy: { createdAt: "desc" },
        include: expect.any(Object),
      }),
    );
    expect(body.notifications).toHaveLength(mockNotificationsRaw.length);
    expect(body.nextCursor).toBeNull();
  });

  it("should fetch notifications successfully with a cursor and return nextCursor", async () => {
    // Arrange
    const pageSize = 10;
    const mockNotificationsRaw: Partial<NotificationData>[] = Array.from(
      { length: pageSize + 1 },
      (_, i) => ({
        id: `notif-${i + 1}`,
        type: NotificationType.EVENT_ATTENDEE,
        recipientId: loggedInUserId,
        issuerId: "user-2",
        postId: null,
        eventId: `event-${i + 1}`,
        read: false,
        createdAt: new Date(Date.now() - i * 10000),
        issuer: {
          id: "user-2",
          username: "issuer",
          displayName: "Issuer",
          avatarUrl: null,
        } as any,
        post: null,
        event: {
          id: `event-${i + 1}`,
          title: "Test Event",
          location: "Online",
        },
      }),
    );
    mockNotificationFindMany.mockResolvedValue(
      mockNotificationsRaw as NotificationData[],
    );
    const cursor = "notif-11"; // Example cursor
    const request = createMockRequest(cursor);

    // Act
    const response = await GET(request);
    const body: NotificationsPage = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: loggedInUserId },
        take: pageSize + 1,
        cursor: { id: cursor },
        orderBy: { createdAt: "desc" },
        include: expect.any(Object),
      }),
    );
    expect(body.notifications).toHaveLength(pageSize);
    expect(body.notifications[0].id).toBe("notif-1");
    expect(body.notifications[0].type).toBe(NotificationType.EVENT_ATTENDEE);
    expect(body.notifications[0].event?.id).toBe("event-1");
    expect(body.nextCursor).toBe(`notif-${pageSize + 1}`);
  });

  it("should return 500 if prisma query fails", async () => {
    // Arrange
    const error = new Error("Database error");
    mockNotificationFindMany.mockRejectedValue(error);
    const request = createMockRequest();

    // Act
    const response = await GET(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });
});
