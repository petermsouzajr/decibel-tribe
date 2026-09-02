import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/groups/[groupId]/add-user/route";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Session, User } from "lucia";

// --- Mock Definitions ---
type MockLucia = {
  validateSession: MockedFunction<
    (
      sessionId: string | null,
    ) => Promise<{ user: User | null; session: Session | null }>
  >;
  sessionCookieName: string;
  createBlankSessionCookie: MockedFunction<
    () => { name: string; value: string; attributes: any }
  >;
  createSessionCookie: MockedFunction<
    (sessionId: string) => { name: string; value: string; attributes: any }
  >;
};
type MockCookies = {
  get: MockedFunction<(name: string) => { value: string } | undefined>;
  set: MockedFunction<(name: string, value: string, attributes: any) => void>;
};
type MockPrismaGroup = {
  findUnique: any; // MockedFunction<typeof prisma.group.findUnique>;
};
type MockPrismaGroupMember = {
  findUnique: any; // MockedFunction<typeof prisma.groupMember.findUnique>;
  create: any; // MockedFunction<typeof prisma.groupMember.create>;
};

// --- Mock Implementations ---
vi.mock("@/auth", () => {
  // Hoisted so the helper below and lucia.validateSession share one mock.
  const validateSessionMock = vi.fn();
  return {
    // Routes call this helper (src/auth.ts) instead of lucia directly.
    validateRequestWithCookieMutation: vi.fn(
      async () => (await validateSessionMock()) ?? { user: null, session: null },
    ),
    lucia: {
      validateSession: validateSessionMock,
      sessionCookieName: "auth_session",
      createBlankSessionCookie: vi.fn(() => ({
        name: "auth_session",
        value: "",
        attributes: {},
      })),
      createSessionCookie: vi.fn((sessionId: string) => ({
        name: "auth_session",
        value: sessionId,
        attributes: {},
      })),
    },
  };
});
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  default: {
    group: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

// --- Test Suite ---
describe("[Groups][API] /api/groups/[groupId]/add-user", () => {
  let mockValidateSession: MockedFunction<typeof lucia.validateSession>;
  let mockCookiesGet: MockedFunction<MockCookies["get"]>;
  let mockCookiesSet: MockedFunction<MockCookies["set"]>;
  let mockGroupFindUnique: MockPrismaGroup["findUnique"];
  let mockGroupMemberFindUnique: MockPrismaGroupMember["findUnique"];
  let mockGroupMemberCreate: MockPrismaGroupMember["create"];

  const mockOwner: User = { id: "user_owner", username: "owneruser" } as User;
  const mockOtherUser: User = {
    id: "user_other",
    username: "otheruser",
  } as User;
  const mockTargetUser: User = {
    id: "user_target",
    username: "targetuser",
  } as User;
  const mockSessionOwner: Session = {
    id: "s_owner",
    userId: mockOwner.id,
  } as Session;
  const mockSessionOther: Session = {
    id: "s_other",
    userId: mockOtherUser.id,
  } as Session;

  const mockGroupId = "group123";
  const mockGroup = {
    id: mockGroupId,
    name: "Test Group",
    ownerId: mockOwner.id,
  };
  const mockExistingMemberRecord = {
    userId: mockTargetUser.id,
    groupId: mockGroupId,
    role: "MEMBER",
    acceptedInvite: true,
  };

  // Helper to create POST request
  const createMockRequest = (body?: any): NextRequest => {
    const url = `http://localhost/api/groups/${mockGroupId}/add-user`;
    return new NextRequest(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : null,
    });
  };

  // Helper to set mock authentication state
  const setAuth = (user: User | null, session: Session | null) => {
    mockCookiesGet.mockReturnValue(session ? { value: session.id } : undefined);
    if (user && session) {
      mockValidateSession.mockResolvedValue({ user: user, session: session });
    } else {
      mockValidateSession.mockResolvedValue({ user: null, session: null });
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockValidateSession = vi.mocked(lucia.validateSession);
    mockCookiesGet = vi.fn();
    mockCookiesSet = vi.fn();
    vi.mocked(cookies).mockReturnValue({
      get: mockCookiesGet,
      set: mockCookiesSet,
    } as any);
    mockGroupFindUnique = vi.mocked(prisma.group.findUnique);
    mockGroupMemberFindUnique = vi.mocked(prisma.groupMember.findUnique);
    mockGroupMemberCreate = vi.mocked(prisma.groupMember.create);

    // Default Mocks
    setAuth(mockOwner, mockSessionOwner); // Default to owner being logged in
    mockGroupFindUnique.mockResolvedValue(mockGroup); // Group exists
    mockGroupMemberFindUnique.mockResolvedValue(null); // Target user not already member
    mockGroupMemberCreate.mockResolvedValue({} as any); // Mock create success
  });

  describe("POST", () => {
    it("should return 401 if not authenticated", async () => {
      setAuth(null, null);
      const req = createMockRequest({ userId: mockTargetUser.id });
      const response = await POST(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(401);
      expect(mockGroupMemberCreate).not.toHaveBeenCalled();
    });

    it("should return 403 if authenticated user is not group owner", async () => {
      setAuth(mockOtherUser, mockSessionOther); // Logged in as non-owner
      const req = createMockRequest({ userId: mockTargetUser.id });
      const response = await POST(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Forbidden." });
      expect(mockGroupMemberCreate).not.toHaveBeenCalled();
    });

    it("should return 400 if userId is missing in request body", async () => {
      const req = createMockRequest({}); // Empty body
      const response = await POST(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "User ID is required." });
      expect(mockGroupMemberCreate).not.toHaveBeenCalled();
    });

    it("should return 404 if group not found", async () => {
      mockGroupFindUnique.mockResolvedValue(null);
      const req = createMockRequest({ userId: mockTargetUser.id });
      const response = await POST(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Group not found." });
      expect(mockGroupMemberCreate).not.toHaveBeenCalled();
    });

    it("should return 400 if target user is already a member", async () => {
      mockGroupMemberFindUnique.mockResolvedValue(mockExistingMemberRecord); // User is already member
      const req = createMockRequest({ userId: mockTargetUser.id });
      const response = await POST(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "User is already a member of the group.",
      });
      expect(mockGroupMemberCreate).not.toHaveBeenCalled();
    });

    it("should successfully add user (create invite) if owner", async () => {
      const req = createMockRequest({ userId: mockTargetUser.id });
      const response = await POST(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      const body = await response.json();

      expect(response.status).toBe(200); // Should be 200 or 201? Route returns 200
      expect(mockGroupFindUnique).toHaveBeenCalledWith({
        where: { id: mockGroupId },
        include: { owner: true },
      });
      expect(mockGroupMemberFindUnique).toHaveBeenCalledWith({
        where: {
          userId_groupId: { userId: mockTargetUser.id, groupId: mockGroupId },
        },
      });
      expect(mockGroupMemberCreate).toHaveBeenCalledWith({
        data: {
          userId: mockTargetUser.id,
          groupId: mockGroupId,
          acceptedInvite: false, // Ensure invite is not auto-accepted
        },
      });
      expect(body.message).toContain("User added to the group successfully");
    });

    it("should return 500 on prisma group find error", async () => {
      mockGroupFindUnique.mockRejectedValue(new Error("DB Error"));
      const req = createMockRequest({ userId: mockTargetUser.id });
      const response = await POST(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(500);
    });

    it("should return 500 on prisma member find error", async () => {
      mockGroupMemberFindUnique.mockRejectedValue(new Error("DB Error"));
      const req = createMockRequest({ userId: mockTargetUser.id });
      const response = await POST(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(500);
    });

    it("should return 500 on prisma member create error", async () => {
      mockGroupMemberCreate.mockRejectedValue(new Error("DB Error"));
      const req = createMockRequest({ userId: mockTargetUser.id });
      const response = await POST(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(500);
    });
  });
});
