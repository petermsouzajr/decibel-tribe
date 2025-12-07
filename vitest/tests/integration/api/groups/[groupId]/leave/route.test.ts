import { POST } from "@/app/api/groups/[groupId]/leave/route";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { lucia } from "@/auth";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { User, Session, Cookie } from "lucia";

// Mock lucia and cookies
vi.mock("@/auth");
vi.mock("next/headers");

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    groupMember: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    group: {
      findUnique: vi.fn(),
    },
  },
}));

// Import mocked versions *after* vi.mock calls
const mockedLuciaValidateSession = vi.mocked(lucia.validateSession);
const mockedCookies = vi.mocked(cookies);
const mockedLuciaCreateSessionCookie = vi.mocked(lucia.createSessionCookie);
const mockedPrismaGroupMemberFindUnique = vi.mocked(
  prisma.groupMember.findUnique,
);
const mockedPrismaGroupFindUnique = vi.mocked(prisma.group.findUnique);
const mockedPrismaGroupMemberDelete = vi.mocked(prisma.groupMember.delete);

// Helper functions for test data setup
const createGroup = async (prismaClient: any, ownerId = "owner1") => {
  const groupData = {
    id: "group1",
    name: "Test Group",
    ownerId: ownerId,
    // Add other necessary group fields as needed for tests
  };
  // Simulate finding or creating the group if mocks need it
  // For this test, we mainly need the id and ownerId
  return groupData;
};

const createGroupMember = async (
  prismaClient: any,
  memberData: { userId: string; groupId: string },
) => {
  const groupMemberData = {
    ...memberData,
    // Add other necessary group member fields as needed
  };
  // Simulate finding or creating the member if mocks need it
  return groupMemberData;
};

describe("POST /api/groups/{groupId}/leave", () => {
  let user: User;
  let session: Session;
  let group: any; // Simpler type for test setup
  let groupMember: any; // Simpler type for test setup
  let mockCookieStore: Awaited<ReturnType<typeof cookies>>; // Use inferred type

  beforeEach(async () => {
    vi.resetAllMocks();

    user = { id: "user1", username: "testuser" } as User;
    session = {
      id: "session1",
      userId: user.id,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      fresh: true,
    } as Session;

    mockedLuciaValidateSession.mockResolvedValue({ user, session });

    // Create a more complete mock Cookie store
    mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: session.id }),
      set: vi.fn(), // `set` is available on the mutable version from NextRequest, but Readonly doesn't have it. We mock it anyway for potential use elsewhere.
      getAll: vi
        .fn()
        .mockReturnValue([{ name: "auth_session", value: session.id }]), // Mock getAll
      has: vi.fn((name) => name === "auth_session"), // Mock has
      [Symbol.iterator]: vi.fn(() =>
        [{ name: "auth_session", value: session.id }][Symbol.iterator](),
      ), // Mock iterator
      size: 1,
      // Add dummy delete/clear if needed, though they aren't on ReadonlyRequestCookies
      delete: vi.fn(),
      clear: vi.fn(),
      // Needed for internal Next.js checks sometimes
      _parsed: new Map([
        ["auth_session", { name: "auth_session", value: session.id }],
      ]),
    } as any; // Use 'as any' for simplicity as crafting a perfect mock is complex

    mockedCookies.mockImplementation(() => mockCookieStore);

    mockedLuciaCreateSessionCookie.mockReturnValue({
      name: "auth_session",
      value: "new_session_id",
      attributes: { secure: true },
      serialize: () => "auth_session=new_session_id; Secure",
    } as Cookie);

    // Define a more complete mock Group
    const mockGroup = {
      id: "group1",
      name: "Test Group",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "owner1",
    };

    group = mockGroup; // Use the more complete mock
    groupMember = { userId: user.id, groupId: group.id };

    mockedPrismaGroupMemberFindUnique.mockResolvedValue(groupMember);
    // Update this mock to return a structure matching the select query
    // @ts-expect-error - Mocking only ownerId as that's what the route selects
    mockedPrismaGroupFindUnique.mockResolvedValue({
      ownerId: "otherUser",
    });
    mockedPrismaGroupMemberDelete.mockResolvedValue(groupMember);
  });

  afterEach(async () => {
    vi.resetAllMocks();
  });

  it("should allow a member to leave a group", async () => {
    const request = new NextRequest(
      "http://localhost/api/groups/group1/leave",
      {
        method: "POST",
      },
    );
    const response = await POST(request, { params: { groupId: group.id } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ message: "Successfully left group" });
    // Use prisma directly, assuming mocks work
    expect(mockedPrismaGroupMemberFindUnique).toHaveBeenCalledWith({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
    });
    expect(mockedPrismaGroupFindUnique).toHaveBeenCalledWith({
      where: { id: group.id },
      select: { ownerId: true },
    });
    expect(mockedPrismaGroupMemberDelete).toHaveBeenCalledWith({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
    });
  });

  it("should return 401 if user is not authenticated", async () => {
    mockedLuciaValidateSession.mockResolvedValue({
      user: null,
      session: null,
    });
    // Re-mock cookies for this specific test case
    const emptyMockCookieStore = {
      ...mockCookieStore, // Keep other methods
      get: vi.fn().mockReturnValue(null), // No cookie
      getAll: vi.fn().mockReturnValue([]),
      has: vi.fn().mockReturnValue(false),
      [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
      size: 0,
      _parsed: new Map(),
    } as any;
    mockedCookies.mockImplementation(() => emptyMockCookieStore);

    const request = new NextRequest(
      "http://localhost/api/groups/group1/leave",
      {
        method: "POST",
      },
    );
    const response = await POST(request, { params: { groupId: group.id } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockedPrismaGroupMemberDelete).not.toHaveBeenCalled();
  });

  it("should return 400 if user is not a member of the group", async () => {
    mockedPrismaGroupMemberFindUnique.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/groups/group1/leave",
      {
        method: "POST",
      },
    );
    const response = await POST(request, { params: { groupId: group.id } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "You are not a member of this group." });
    expect(mockedPrismaGroupMemberFindUnique).toHaveBeenCalledWith({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
    });
    expect(mockedPrismaGroupFindUnique).not.toHaveBeenCalled();
    expect(mockedPrismaGroupMemberDelete).not.toHaveBeenCalled();
  });

  it("should return 403 if the user is the owner of the group", async () => {
    // Use mockedPrismaGroupFindUnique directly
    // @ts-expect-error - Mocking only ownerId as that's what the route selects
    mockedPrismaGroupFindUnique.mockResolvedValue({
      ownerId: user.id, // Simulate user being the owner
    });

    const request = new NextRequest(
      "http://localhost/api/groups/group1/leave",
      {
        method: "POST",
      },
    );
    const response = await POST(request, { params: { groupId: group.id } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      error:
        "Group owners cannot leave the group. Consider deleting the group.",
    });
    expect(prisma.groupMember.findUnique).toHaveBeenCalledWith({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
    });
    expect(prisma.group.findUnique).toHaveBeenCalledWith({
      where: { id: group.id },
      select: { ownerId: true },
    });
    expect(prisma.groupMember.delete).not.toHaveBeenCalled();
  });

  it("should return 500 if there is a database error during deletion", async () => {
    // Use mockedPrismaGroupMemberDelete directly
    mockedPrismaGroupMemberDelete.mockRejectedValue(
      new Error("Database error"),
    );

    const request = new NextRequest(
      "http://localhost/api/groups/group1/leave",
      {
        method: "POST",
      },
    );
    const response = await POST(request, { params: { groupId: group.id } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
    expect(prisma.groupMember.findUnique).toHaveBeenCalled();
    expect(prisma.group.findUnique).toHaveBeenCalled();
    expect(prisma.groupMember.delete).toHaveBeenCalled();
  });
});
