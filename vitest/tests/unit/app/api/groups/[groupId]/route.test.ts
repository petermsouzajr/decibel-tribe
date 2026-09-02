import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";
import { NextRequest } from "next/server";
import { GET, DELETE, PUT } from "@/app/api/groups/[groupId]/route";
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
  delete: any; // MockedFunction<typeof prisma.group.delete>;
};
type MockPrismaGroupMember = {
  findUnique: any; // MockedFunction<typeof prisma.groupMember.findUnique>;
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
    group: { findUnique: vi.fn(), delete: vi.fn() },
    groupMember: { findUnique: vi.fn() },
  },
}));

// --- Test Suite ---
describe("[Groups][API] /api/groups/[groupId]", () => {
  let mockValidateSession: MockedFunction<typeof lucia.validateSession>;
  let mockCookiesGet: MockedFunction<MockCookies["get"]>;
  let mockCookiesSet: MockedFunction<MockCookies["set"]>;
  let mockGroupFindUnique: MockPrismaGroup["findUnique"];
  let mockGroupDelete: MockPrismaGroup["delete"];
  let mockGroupMemberFindUnique: MockPrismaGroupMember["findUnique"];

  const mockUser: User = { id: "user1", username: "owneruser" } as User;
  const mockMember: User = { id: "user2", username: "memberuser" } as User;
  const mockNonMember: User = {
    id: "user3",
    username: "nonmemberuser",
  } as User;
  const mockSessionOwner: Session = {
    id: "s_owner",
    userId: mockUser.id,
  } as Session;
  const mockSessionMember: Session = {
    id: "s_member",
    userId: mockMember.id,
  } as Session;
  const mockSessionNonMember: Session = {
    id: "s_nonmember",
    userId: mockNonMember.id,
  } as Session;

  const mockGroupId = "group123";
  const mockGroup = {
    id: mockGroupId,
    name: "Test Group",
    description: "Desc",
    ownerId: mockUser.id,
  };
  const mockMemberRecord = {
    userId: mockMember.id,
    groupId: mockGroupId,
    role: "MEMBER",
    acceptedInvite: true,
  };

  // Helper to create request
  const createMockRequest = (method: string, body?: any): NextRequest => {
    const url = `http://localhost/api/groups/${mockGroupId}`;
    if (method === "PUT" && body) {
      // Assuming PUT might have a body eventually
      return new NextRequest(url, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    }
    // For GET, DELETE, or PUT without body
    return new NextRequest(url, { method });
  };

  // Helper to set mock authentication state with correct types
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
    mockGroupDelete = vi.mocked(prisma.group.delete);
    mockGroupMemberFindUnique = vi.mocked(prisma.groupMember.findUnique);

    // Default Mocks
    setAuth(mockUser, mockSessionOwner); // Default to owner being logged in
    mockGroupFindUnique.mockResolvedValue(mockGroup); // Group exists
    mockGroupMemberFindUnique.mockResolvedValue(mockMemberRecord); // Assume user is member (will be overridden)
    mockGroupDelete.mockResolvedValue(mockGroup); // Mock delete success
  });

  // --- GET Tests ---
  describe("GET", () => {
    it("should return 401 if not authenticated", async () => {
      setAuth(null, null);
      const req = createMockRequest("GET");
      const response = await GET(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(401);
      expect(mockGroupFindUnique).not.toHaveBeenCalled();
    });

    it("should return 404 if group not found", async () => {
      setAuth(mockMember, mockSessionMember);
      mockGroupFindUnique.mockResolvedValue(null);
      const req = createMockRequest("GET");
      const response = await GET(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(404);
      expect(mockGroupMemberFindUnique).not.toHaveBeenCalled();
    });

    it("should return 403 if authenticated user is not a member", async () => {
      setAuth(mockNonMember, mockSessionNonMember);
      mockGroupMemberFindUnique.mockResolvedValue(null); // Not a member
      const req = createMockRequest("GET");
      const response = await GET(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Access denied. You are not a member of this group.",
      });
    });

    it("should return group details if user is a member", async () => {
      setAuth(mockMember, mockSessionMember);
      mockGroupFindUnique.mockResolvedValue(mockGroup); // Group exists
      mockGroupMemberFindUnique.mockResolvedValue(mockMemberRecord); // Is a member
      const req = createMockRequest("GET");
      const response = await GET(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.id).toBe(mockGroupId);
      expect(mockGroupFindUnique).toHaveBeenCalledWith({
        where: { id: mockGroupId },
        select: expect.any(Object),
      });
      expect(mockGroupMemberFindUnique).toHaveBeenCalledWith({
        where: {
          userId_groupId: { userId: mockMember.id, groupId: mockGroupId },
        },
      });
    });

    it("should return 500 on prisma error (group find)", async () => {
      setAuth(mockMember, mockSessionMember);
      mockGroupFindUnique.mockRejectedValue(new Error("DB Error"));
      const req = createMockRequest("GET");
      const response = await GET(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(500);
    });

    it("should return 500 on prisma error (member find)", async () => {
      setAuth(mockMember, mockSessionMember);
      mockGroupMemberFindUnique.mockRejectedValue(new Error("DB Error"));
      const req = createMockRequest("GET");
      const response = await GET(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(500);
    });
  });

  // --- DELETE Tests ---
  describe("DELETE", () => {
    it("should return 401 if not authenticated", async () => {
      setAuth(null, null);
      const req = createMockRequest("DELETE");
      const response = await DELETE(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(401);
      expect(mockGroupDelete).not.toHaveBeenCalled();
    });

    it("should return 404 if group not found", async () => {
      setAuth(mockUser, mockSessionOwner);
      mockGroupFindUnique.mockResolvedValue(null);
      const req = createMockRequest("DELETE");
      const response = await DELETE(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(404);
      expect(mockGroupDelete).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not owner", async () => {
      setAuth(mockMember, mockSessionMember); // Logged in as member, not owner
      mockGroupFindUnique.mockResolvedValue(mockGroup);
      const req = createMockRequest("DELETE");
      const response = await DELETE(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Access denied. Only the group owner can delete this group.",
      });
      expect(mockGroupDelete).not.toHaveBeenCalled();
    });

    it("should delete group successfully if user is owner", async () => {
      setAuth(mockUser, mockSessionOwner); // Logged in as owner
      mockGroupFindUnique.mockResolvedValue(mockGroup);
      const req = createMockRequest("DELETE");
      const response = await DELETE(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(200);
      expect(mockGroupFindUnique).toHaveBeenCalledWith({
        where: { id: mockGroupId },
        select: expect.any(Object),
      });
      expect(mockGroupDelete).toHaveBeenCalledWith({
        where: { id: mockGroupId },
      });
      expect(await response.json()).toEqual({
        message: "Group deleted successfully",
      });
    });

    it("should return 500 on prisma error (group find)", async () => {
      setAuth(mockUser, mockSessionOwner);
      mockGroupFindUnique.mockRejectedValue(new Error("DB Error"));
      const req = createMockRequest("DELETE");
      const response = await DELETE(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(500);
    });

    it("should return 500 on prisma error (group delete)", async () => {
      setAuth(mockUser, mockSessionOwner);
      mockGroupDelete.mockRejectedValue(new Error("DB Error"));
      const req = createMockRequest("DELETE");
      const response = await DELETE(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(500);
    });
  });

  // --- PUT Tests (Currently mirrors GET) ---
  describe("PUT", () => {
    it("should return 401 if not authenticated", async () => {
      setAuth(null, null);
      const req = createMockRequest("PUT");
      const response = await PUT(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(401);
    });

    it("should return 404 if group not found", async () => {
      setAuth(mockMember, mockSessionMember);
      mockGroupFindUnique.mockResolvedValue(null);
      const req = createMockRequest("PUT");
      const response = await PUT(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(404);
    });

    it("should return 403 if authenticated user is not a member", async () => {
      setAuth(mockNonMember, mockSessionNonMember);
      mockGroupMemberFindUnique.mockResolvedValue(null);
      const req = createMockRequest("PUT");
      const response = await PUT(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(403);
    });

    // Test the current successful (GET-like) behavior
    it("should return group details if user is a member (current PUT behavior)", async () => {
      setAuth(mockMember, mockSessionMember);
      mockGroupFindUnique.mockResolvedValue(mockGroup);
      mockGroupMemberFindUnique.mockResolvedValue(mockMemberRecord);
      const req = createMockRequest("PUT");
      const response = await PUT(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.id).toBe(mockGroupId);
      expect(mockGroupFindUnique).toHaveBeenCalledTimes(1);
      expect(mockGroupMemberFindUnique).toHaveBeenCalledTimes(1);
    });

    it("should return 500 on prisma error", async () => {
      setAuth(mockMember, mockSessionMember);
      mockGroupFindUnique.mockRejectedValue(new Error("DB Error"));
      const req = createMockRequest("PUT");
      const response = await PUT(req, { params: Promise.resolve({ groupId: mockGroupId }) });
      expect(response.status).toBe(500);
    });
  });
});
