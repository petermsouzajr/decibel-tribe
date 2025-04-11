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
import { FollowerInfo } from "@/lib/types";

// --- Mock Types (Keep or define as needed) ---
type PrismaUserMock = {
  findUnique: Mock;
};
type PrismaFollowMock = {
  upsert: Mock;
  deleteMany: Mock;
};
type PrismaNotificationMock = {
  create: Mock;
  deleteMany: Mock;
};
type PrismaMock = {
  user: PrismaUserMock;
  follow: PrismaFollowMock;
  notification: PrismaNotificationMock;
  $transaction: Mock;
};

type LuciaMock = {
  sessionCookieName: string;
  validateSession: Mock;
  createBlankSessionCookie: Mock;
  createSessionCookie: Mock;
};

// --- Declare TOP-LEVEL Mock Variables ---
let mockUserFindUnique: Mock;
let mockFollowUpsert: Mock;
let mockFollowDeleteMany: Mock;
let mockNotificationCreate: Mock;
let mockNotificationDeleteMany: Mock;
let mockTransaction: Mock;
let mockLuciaValidateSession: Mock;
let mockCreateBlankSessionCookie: Mock;
let mockCreateSessionCookie: Mock;
let mockCookiesGet: Mock;
let mockCookiesSet: Mock;

// Declare handler variables at the top level
let GET: typeof import("@/app/api/users/[userId]/followers/route").GET;
let POST: typeof import("@/app/api/users/[userId]/followers/route").POST;
let DELETE: typeof import("@/app/api/users/[userId]/followers/route").DELETE;

describe("API Route: /api/users/[userId]/followers", () => {
  const loggedInUserId = "user_viewer_123";
  const targetUserId = "user_profile_456";
  const mockLoggedInUser = { id: loggedInUserId };
  const mockSessionData = { id: "session_abc", fresh: false };
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

  // --- Implement async beforeAll for Mock Setup ---
  beforeAll(async () => {
    // Initialize mocks inside beforeAll
    mockUserFindUnique = vi.fn();
    mockFollowUpsert = vi.fn();
    mockFollowDeleteMany = vi.fn();
    mockNotificationCreate = vi.fn();
    mockNotificationDeleteMany = vi.fn();
    mockTransaction = vi.fn().mockImplementation(async (ops) => {
      const results = [];
      for (const op of ops) {
        results.push(await op);
      }
      return results;
    });
    mockLuciaValidateSession = vi.fn();
    mockCreateBlankSessionCookie = vi.fn();
    mockCreateSessionCookie = vi.fn();
    mockCookiesGet = vi.fn();
    mockCookiesSet = vi.fn();

    // Use vi.doMock for all mocks
    vi.doMock("next/headers", () => ({
      cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
    }));

    vi.doMock("@/lib/prisma", () => ({
      default: {
        user: { findUnique: mockUserFindUnique },
        follow: { upsert: mockFollowUpsert, deleteMany: mockFollowDeleteMany },
        notification: {
          create: mockNotificationCreate,
          deleteMany: mockNotificationDeleteMany,
        },
        $transaction: mockTransaction,
      },
    }));

    vi.doMock("@/auth", () => ({
      lucia: {
        sessionCookieName: "auth_session",
        validateSession: mockLuciaValidateSession,
        createBlankSessionCookie: mockCreateBlankSessionCookie,
        createSessionCookie: mockCreateSessionCookie,
      },
    }));

    // Dynamically import handlers at the END of beforeAll
    const handlers = await import("@/app/api/users/[userId]/followers/route");
    GET = handlers.GET;
    POST = handlers.POST;
    DELETE = handlers.DELETE;
  });

  let request: NextRequest;

  beforeEach(() => {
    vi.resetAllMocks();

    // Define constants needed for mock behaviors
    const mockLoggedInUser = { id: loggedInUserId };
    const mockSessionData = { id: "session_abc", fresh: false };
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

    // Set Default Mock Behaviors
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: mockLoggedInUser,
      session: mockSessionData,
    });
    mockCreateBlankSessionCookie.mockReturnValue(mockBlankCookie);
    mockCreateSessionCookie.mockReturnValue(mockNewSessionCookie);

    // Generic request setup
    request = new NextRequest(
      `http://localhost/api/users/${targetUserId}/followers`,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/users/[userId]/followers", () => {
    it("should return 401 if no session cookie is found", async () => {
      mockCookiesGet.mockReturnValue(undefined);

      const response = await GET(request, {
        params: { userId: targetUserId },
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(mockLuciaValidateSession).not.toHaveBeenCalled();
    });

    it("should return 401 if session validation fails", async () => {
      mockCookiesGet.mockReturnValue({ value: "invalid_session_id" });
      mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });

      const response = await GET(request, {
        params: { userId: targetUserId },
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(mockLuciaValidateSession).toHaveBeenCalledWith(
        "invalid_session_id",
      );
      expect(mockCreateBlankSessionCookie).toHaveBeenCalled();
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockBlankCookie.name,
        mockBlankCookie.value,
        mockBlankCookie.attributes,
      );
    });

    it("should set a new session cookie if session is fresh", async () => {
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockFreshSessionData,
      });
      mockUserFindUnique.mockResolvedValue({
        _count: { followers: 0 },
        followers: [],
      });

      await GET(request, { params: { userId: targetUserId } });

      expect(mockLuciaValidateSession).toHaveBeenCalledWith("valid_session_id");
      expect(mockCreateSessionCookie).toHaveBeenCalledWith(
        mockFreshSessionData.id,
      );
      expect(mockCookiesSet).toHaveBeenCalledWith(
        mockNewSessionCookie.name,
        mockNewSessionCookie.value,
        mockNewSessionCookie.attributes,
      );
    });

    it("should return 404 if the target user is not found", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const response = await GET(request, { params: { userId: targetUserId } });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("User not found");
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: targetUserId },
        select: expect.any(Object),
      });
    });

    it("should return follower count and isFollowedByUser: true if logged-in user follows target", async () => {
      const mockUserData = {
        _count: { followers: 15 },
        followers: [{ followerId: loggedInUserId }],
      };
      mockUserFindUnique.mockResolvedValue(mockUserData);

      const response = await GET(request, { params: { userId: targetUserId } });
      const body: FollowerInfo = await response.json();

      expect(response.status).toBe(200);
      expect(body.followers).toBe(15);
      expect(body.isFollowedByUser).toBe(true);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: targetUserId },
        select: {
          followers: {
            where: { followerId: loggedInUserId },
            select: { followerId: true },
          },
          _count: {
            select: { followers: true },
          },
        },
      });
    });

    it("should return follower count and isFollowedByUser: false if logged-in user does not follow target", async () => {
      const mockUserData = {
        _count: { followers: 20 },
        followers: [],
      };
      mockUserFindUnique.mockResolvedValue(mockUserData);

      const response = await GET(request, { params: { userId: targetUserId } });
      const body: FollowerInfo = await response.json();

      expect(response.status).toBe(200);
      expect(body.followers).toBe(20);
      expect(body.isFollowedByUser).toBe(false);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: targetUserId },
        select: {
          followers: {
            where: { followerId: loggedInUserId },
            select: { followerId: true },
          },
          _count: {
            select: { followers: true },
          },
        },
      });
    });

    it("should return 500 if prisma query fails", async () => {
      mockUserFindUnique.mockRejectedValue(new Error("DB Error"));

      const response = await GET(request, { params: { userId: targetUserId } });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/users/[userId]/followers", () => {
    it("should return 401 if not authenticated", async () => {
      mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });

      const response = await POST(request, {
        params: { userId: targetUserId },
      });

      expect(response.status).toBe(401);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("should return 400 if trying to follow self", async () => {
      const selfUserId = loggedInUserId;
      const selfRequest = new NextRequest(
        `http://localhost/api/users/${selfUserId}/followers`,
      );
      mockLuciaValidateSession.mockResolvedValue({
        user: { id: selfUserId },
        session: mockSessionData,
      });

      const response = await POST(selfRequest, {
        params: { userId: selfUserId },
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Cannot follow yourself");
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("should successfully follow a user and return 201", async () => {
      mockFollowUpsert.mockResolvedValue({});
      mockNotificationCreate.mockResolvedValue({});
      mockTransaction.mockResolvedValue([{}, {}]);
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockSessionData,
      });

      const response = await POST(request, {
        params: { userId: targetUserId },
      });

      expect(response.status).toBe(201);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockFollowUpsert).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: loggedInUserId,
            followingId: targetUserId,
          },
        },
        create: { followerId: loggedInUserId, followingId: targetUserId },
        update: {},
      });
      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: {
          recipientId: targetUserId,
          issuerId: loggedInUserId,
          type: "FOLLOW",
        },
      });
    });

    it("should return 500 if the transaction fails", async () => {
      mockTransaction.mockRejectedValue(new Error("Transaction failed"));
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockSessionData,
      });

      const response = await POST(request, {
        params: { userId: targetUserId },
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });

  describe("DELETE /api/users/[userId]/followers", () => {
    it("should return 401 if not authenticated", async () => {
      mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });

      const response = await DELETE(request, {
        params: { userId: targetUserId },
      });

      expect(response.status).toBe(401);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("should successfully unfollow a user and return 200", async () => {
      mockFollowDeleteMany.mockResolvedValue({ count: 1 });
      mockNotificationDeleteMany.mockResolvedValue({ count: 1 });
      mockTransaction.mockResolvedValue([{}, {}]);
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockSessionData,
      });

      const response = await DELETE(request, {
        params: { userId: targetUserId },
      });

      expect(response.status).toBe(200);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockFollowDeleteMany).toHaveBeenCalledWith({
        where: { followerId: loggedInUserId, followingId: targetUserId },
      });
      expect(mockNotificationDeleteMany).toHaveBeenCalledWith({
        where: {
          recipientId: targetUserId,
          issuerId: loggedInUserId,
          type: "FOLLOW",
        },
      });
    });

    it("should return 500 if the transaction fails", async () => {
      mockTransaction.mockRejectedValue(new Error("Transaction failed"));
      mockLuciaValidateSession.mockResolvedValue({
        user: mockLoggedInUser,
        session: mockSessionData,
      });

      const response = await DELETE(request, {
        params: { userId: targetUserId },
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
    });
  });
});
