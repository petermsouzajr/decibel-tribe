import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma, GroupRole } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockAccountDataGenerator = vi.fn();
const mockFakerShuffle = vi.fn((arr) => [...arr]); // Simple shuffle mock (returns copy)
const mockFakerHelpers = {
  arrayElement: vi.fn(),
  shuffle: mockFakerShuffle,
};
const mockFakerDate = vi.fn();
const mockFakerDatatype = {
  boolean: vi.fn(),
};
const mockGenerateId = vi.fn();

vi.mock("../../seedUtils.js", async (importOriginal) => {
  // Return the mock object containing faker, generateId, prisma, and accountDataGenerator
  return {
    faker: {
      helpers: mockFakerHelpers,
      date: { between: mockFakerDate }, // Use mockFakerDate for between
      datatype: mockFakerDatatype,
    },
    generateIdFromEntropySize: mockGenerateId,
    prisma: mockPrismaClient,
    accountDataGenerator: mockAccountDataGenerator,
  };
});

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  groupMember: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import mocked utils and the function to test
const { seedGroupMembers } = await import("./groupMembers.js");

describe("GroupsTeam - seedGroupMembers Module", () => {
  const mockUsers = [
    { id: "user1", username: "MemberUser", createdAt: new Date("2023-01-01") },
    {
      id: "user2",
      username: "AdminUserGroupAdmin",
      createdAt: new Date("2023-01-05"),
    },
    { id: "user3", username: "OwnerUser", createdAt: new Date("2023-01-10") },
    {
      id: "user4",
      username: "noGroupMembershipsUser",
      createdAt: new Date("2023-01-15"),
    },
  ];
  const mockGroups = [
    { id: "group1", ownerId: "user3", createdAt: new Date("2023-01-20") },
    { id: "group2", ownerId: "user1", createdAt: new Date("2023-02-01") },
  ];
  const mockMemberId = "mock_member_id";
  const mockJoinedDate = new Date("2023-03-15");

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock implementations
    (mockPrismaClient.groupMember.createMany as Mock).mockResolvedValue({
      count: 3,
    });
    mockAccountDataGenerator.mockReturnValue(2);
    mockFakerHelpers.arrayElement.mockReturnValue(GroupRole.MEMBER); // Default role
    mockGenerateId.mockReturnValue(mockMemberId);
    mockFakerDate.mockReturnValue(mockJoinedDate);
    mockFakerDatatype.boolean.mockReturnValue(true); // Default acceptedInvite
  });

  it("should call prisma.groupMember.createMany with correct data structure", async () => {
    await seedGroupMembers(mockPrismaClient as any, mockUsers, mockGroups);

    expect(mockPrismaClient.groupMember.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.groupMember.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.GroupMemberCreateManyInput[] = createArgs.data;

    // Check filtering: noGroupMembershipsUser should be excluded from created data
    expect(createdData.some((gm) => gm.userId === "user4")).toBe(false);

    // Check role assignment - group1 owner (user3) should be ADMIN
    const ownerMember = createdData.find(
      (gm) => gm.userId === "user3" && gm.groupId === "group1",
    );
    expect(ownerMember?.role).toBe(GroupRole.ADMIN);

    // Check role assignment - user2 (non-owner) should get default MEMBER role
    const regularMember = createdData.find(
      (gm) => gm.userId === "user2" && gm.groupId === "group1",
    );
    // User 2 might not be added if shuffle excludes them, so check conditionally
    if (regularMember) {
      expect(regularMember.role).toBe(GroupRole.MEMBER);
    }

    // Expect generator to be called for member quantity
    expect(mockAccountDataGenerator).toHaveBeenCalledWith("random", 1, 15);

    // Check basic structure - use expect.any(Date) for joinedAt
    expect(createdData[0]).toEqual({
      id: mockMemberId,
      userId: expect.any(String),
      groupId: expect.any(String),
      role: expect.any(String),
      acceptedInvite: true,
      joinedAt: expect.any(Date), // Use any Date due to owner vs member logic
    });
  });

  it("should calculate joinedAt based on user and group creation dates", async () => {
    await seedGroupMembers(mockPrismaClient as any, mockUsers, mockGroups);

    // Use createManyArgs from the mock call to check input data
    const createManyArgs = (mockPrismaClient.groupMember.createMany as Mock)
      .mock.calls[0][0].data;

    // Find a member of group 1 (e.g., user1 if they were added)
    const memberInGroup1 = createManyArgs.find(
      (d: any) => d.groupId === "group1" && d.userId === "user1",
    );
    const group1CreatedAt = mockGroups.find(
      (g) => g.id === "group1",
    )!.createdAt;
    const user1CreatedAt = mockUsers.find((u) => u.id === "user1")!.createdAt;

    if (memberInGroup1) {
      // User might not be selected by shuffle
      expect(memberInGroup1.joinedAt).toBeInstanceOf(Date);
      expect(memberInGroup1.joinedAt.getTime()).toBeGreaterThanOrEqual(
        group1CreatedAt.getTime(),
      );
      expect(memberInGroup1.joinedAt.getTime()).toBeGreaterThanOrEqual(
        user1CreatedAt.getTime(),
      );
      // Check the earliest possible date (later of user/group creation)
      const earliestGroup1JoinDate = new Date(
        Math.max(user1CreatedAt.getTime(), group1CreatedAt.getTime()),
      );
      expect(memberInGroup1.joinedAt.getTime()).toBeGreaterThanOrEqual(
        earliestGroup1JoinDate.getTime(),
      );
    } else {
      console.warn(
        "Test Warning: User1 was not added to Group1 in this test run, skipping joinedAt check for user1/group1.",
      );
    }

    // Find a member of group 2 (e.g., user2 if they were added)
    const memberInGroup2 = createManyArgs.find(
      (d: any) => d.groupId === "group2" && d.userId === "user2",
    );
    const group2CreatedAt = mockGroups.find(
      (g) => g.id === "group2",
    )!.createdAt;
    const user2CreatedAt = mockUsers.find((u) => u.id === "user2")!.createdAt;

    if (memberInGroup2) {
      // User might not be selected by shuffle
      expect(memberInGroup2.joinedAt).toBeInstanceOf(Date);
      expect(memberInGroup2.joinedAt.getTime()).toBeGreaterThanOrEqual(
        group2CreatedAt.getTime(),
      );
      expect(memberInGroup2.joinedAt.getTime()).toBeGreaterThanOrEqual(
        user2CreatedAt.getTime(),
      );
      // Check the earliest possible date (later of user/group creation)
      const earliestGroup2JoinDate = new Date(
        Math.max(user2CreatedAt.getTime(), group2CreatedAt.getTime()),
      );
      expect(memberInGroup2.joinedAt.getTime()).toBeGreaterThanOrEqual(
        earliestGroup2JoinDate.getTime(),
      );
    } else {
      console.warn(
        "Test Warning: User2 was not added to Group2 in this test run, skipping joinedAt check for user2/group2.",
      );
    }
  });

  it("should return created group member data", async () => {
    // Remove the first call
    // const result = await seedGroupMembers(
    //   mockPrismaClient as any,
    //   mockUsers,
    //   mockGroups,
    // );

    // Set the mock value BEFORE the call
    mockAccountDataGenerator.mockReturnValue(1);

    // Perform the single call to be tested
    const result = await seedGroupMembers(
      mockPrismaClient as any,
      mockUsers,
      mockGroups,
    );

    // Assert on the result of the single call
    expect(result.length).toBe(4);

    // Adjust subsequent assertions to use 'result' instead of 'resultAfterMockChange'
    expect(result[0]).toEqual({
      id: expect.any(String), // Owner of group1 (user3)
      userId: "user3",
      groupId: "group1",
      role: GroupRole.ADMIN,
      joinedAt: expect.any(Date),
      acceptedInvite: true,
    });
    // Check structure of a regular member (e.g., user1 added to group1? depends on shuffle)
    // This might be less deterministic, check only fields guaranteed to exist and their types
    expect(result[2]).toEqual(
      expect.objectContaining({
        id: mockMemberId, // Expect the default mock ID
        userId: expect.any(String),
        groupId: expect.any(String),
        role: expect.any(String), // Role can be MEMBER or ADMIN based on faker
        joinedAt: expect.any(Date),
        acceptedInvite: expect.any(Boolean), // acceptedInvite can be true/false based on faker
      }),
    );

    // Additional checks can be added here if needed
  });

  // Add tests for empty users/groups, prisma failure etc. similar to seedGroups.spec.ts
  it("should return empty array if no users provided", async () => {
    const result = await seedGroupMembers(
      mockPrismaClient as any,
      [],
      mockGroups,
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.groupMember.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array if no groups provided", async () => {
    const result = await seedGroupMembers(
      mockPrismaClient as any,
      mockUsers,
      [],
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.groupMember.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array if no eligible users found", async () => {
    const ineligibleUsers = [mockUsers[3]]; // Only the 'noGroupMembershipsUser'
    const result = await seedGroupMembers(
      mockPrismaClient as any,
      ineligibleUsers,
      mockGroups,
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.groupMember.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array and log error if prisma create fails", async () => {
    const dbError = new Error("DB GroupMember Write Failed");
    (mockPrismaClient.groupMember.createMany as Mock).mockRejectedValue(
      dbError,
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedGroupMembers(
      mockPrismaClient as any,
      mockUsers,
      mockGroups,
    );

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating group members in DB:",
      dbError,
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return empty array if prisma client is unavailable", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = await seedGroupMembers(null as any, mockUsers, mockGroups);
    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Prisma client is not available for seedGroupMembers.",
    );
    consoleErrorSpy.mockRestore();
  });
});
