import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/groups/my-groups/route";
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
type MockPrismaGroupMember = {
  findMany: any; // MockedFunction<typeof prisma.groupMember.findMany>;
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
    groupMember: { findMany: vi.fn() },
  },
}));

// --- Test Suite ---
describe("[Groups][API] GET /api/groups/my-groups", () => {
  let mockValidateSession: MockedFunction<typeof lucia.validateSession>;
  let mockCookiesGet: MockedFunction<MockCookies["get"]>;
  let mockCookiesSet: MockedFunction<MockCookies["set"]>;
  let mockGroupMemberFindMany: MockPrismaGroupMember["findMany"];

  const mockUser: User = { id: "user1", username: "testuser" } as User;
  const mockSession: Session = {
    id: "session1",
    userId: mockUser.id,
    fresh: false,
    expiresAt: new Date(Date.now() + 3600000),
  } as Session;

  // Helper to create GET request
  const createMockRequest = (
    searchParams: Record<string, string> = {},
  ): NextRequest => {
    const url = new URL("http://localhost/api/groups/my-groups");
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  };

  // Helper to generate mock memberships
  const generateMockMemberships = (count: number, prefix = "group") => {
    return Array.from({ length: count }, (_, i) => ({
      group: {
        id: `${prefix}${i + 1}`,
        name: `Group ${prefix} ${i + 1}`,
        description: `Description ${i + 1}`,
      },
    }));
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
    mockGroupMemberFindMany = vi.mocked(prisma.groupMember.findMany);

    // Default Mocks (Successful Auth)
    mockCookiesGet.mockReturnValue({ value: "valid-session-id" });
    mockValidateSession.mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });
    // Default empty results
    mockGroupMemberFindMany.mockResolvedValue([]);
  });

  it("should return 401 if not authenticated", async () => {
    // Arrange
    mockCookiesGet.mockReturnValue(undefined);
    mockValidateSession.mockResolvedValue({ user: null, session: null });
    const req = createMockRequest();

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockGroupMemberFindMany).not.toHaveBeenCalled();
  });

  it("should return first page of user's groups successfully", async () => {
    // Arrange
    const pageSize = 10;
    const mockMemberships = generateMockMemberships(pageSize + 1);
    mockGroupMemberFindMany.mockResolvedValue(mockMemberships);
    const req = createMockRequest();

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockGroupMemberFindMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id, acceptedInvite: true },
      select: {
        group: { select: { id: true, name: true, description: true } },
      },
      take: pageSize + 1,
      skip: 0,
      // Cursor should not be defined here
    });
    expect(mockGroupMemberFindMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ cursor: expect.any(Object) }),
    );
    expect(body.groups).toHaveLength(pageSize);
    expect(body.groups[0].id).toBe("group1");
    expect(body.nextCursor).toBe(mockMemberships[pageSize].group.id); // The ID of the 11th group
  });

  it("should return next page of user's groups using cursor", async () => {
    // Arrange
    const pageSize = 10;
    const cursorId = "group10";
    const mockMemberships = generateMockMemberships(5, "nextpage");
    mockGroupMemberFindMany.mockResolvedValue(mockMemberships);
    const req = createMockRequest({ cursor: cursorId });

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockGroupMemberFindMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id, acceptedInvite: true },
      select: {
        group: { select: { id: true, name: true, description: true } },
      },
      take: pageSize + 1,
      skip: 1,
      cursor: {
        userId_groupId: {
          userId: mockUser.id,
          groupId: cursorId,
        },
      },
    });
    expect(body.groups).toHaveLength(5);
    expect(body.groups[0].id).toBe("nextpage1");
    expect(body.nextCursor).toBeNull(); // Less than pageSize+1 fetched
  });

  it("should return empty list if user has no groups", async () => {
    // Arrange
    mockGroupMemberFindMany.mockResolvedValue([]); // Default beforeEach already does this, but explicit is fine
    const req = createMockRequest();

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.groups).toEqual([]);
    expect(body.nextCursor).toBeNull();
  });

  it("should return 500 on prisma error", async () => {
    // Arrange
    mockGroupMemberFindMany.mockRejectedValue(new Error("DB Error"));
    const req = createMockRequest();

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
