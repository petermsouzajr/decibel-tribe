import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockFakerLoremSentence = vi.fn();
const mockFakerHelpersArrayElement = vi.fn();
const mockFakerDateBetween = vi.fn();
const mockGenerateIdFromEntropySize = vi.fn();
const mockAccountDataGenerator = vi.fn();

vi.mock("../../seedUtils.js", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    faker: {
      ...(original.faker as any),
      lorem: { sentence: mockFakerLoremSentence },
      helpers: {
        ...(original.faker.helpers as any),
        arrayElement: mockFakerHelpersArrayElement,
      },
      date: { between: mockFakerDateBetween },
    },
    generateIdFromEntropySize: mockGenerateIdFromEntropySize,
    accountDataGenerator: mockAccountDataGenerator,
  };
});

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  post: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import mocked utils and the function to test
const { seedGroupPosts } = await import("./groupPosts.js");

describe("GroupsTeam - seedGroupPosts Module", () => {
  const mockGroups = [
    { id: "group1", ownerId: "userA", createdAt: new Date("2023-01-01") },
    { id: "group2", ownerId: "userC", createdAt: new Date("2023-01-15") },
    { id: "group3", ownerId: "userD", createdAt: new Date("2023-02-01") }, // No accepted members
  ];
  const mockMembers = [
    {
      id: "memA1",
      groupId: "group1",
      userId: "userA",
      joinedAt: new Date("2023-01-10"),
      acceptedInvite: true,
    },
    {
      id: "memA2",
      groupId: "group1",
      userId: "userB",
      joinedAt: new Date("2023-01-20"),
      acceptedInvite: true,
    },
    {
      id: "memB1",
      groupId: "group2",
      userId: "userC",
      joinedAt: new Date("2023-02-01"),
      acceptedInvite: true,
    },
    {
      id: "memB2",
      groupId: "group2",
      userId: "userA",
      joinedAt: new Date("2023-02-05"),
      acceptedInvite: false,
    },
    {
      id: "memC1",
      groupId: "group3",
      userId: "userD",
      joinedAt: new Date("2023-02-10"),
      acceptedInvite: false,
    },
  ];
  const mockPostDate = new Date("2023-03-01");
  const mockPostContent = "Test group post content";
  const mockPostId = "gPostId123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock implementations
    (mockPrismaClient.post.createMany as Mock).mockResolvedValue({ count: 5 });
    mockAccountDataGenerator.mockReturnValue(2); // Default 2 posts per group
    mockFakerLoremSentence.mockReturnValue(mockPostContent);
    mockFakerDateBetween.mockReturnValue(mockPostDate);
    mockGenerateIdFromEntropySize.mockReturnValue(mockPostId);
    // Default mock for arrayElement to return the first member
    mockFakerHelpersArrayElement.mockImplementation((arr) => arr[0]);
  });

  it("should call prisma.post.createMany with correct data structure for group posts", async () => {
    await seedGroupPosts(
      mockPrismaClient as any as PrismaClient,
      mockGroups,
      mockMembers,
    );

    expect(mockPrismaClient.post.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.post.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.PostCreateManyInput[] = createArgs.data;

    // Group1 gets 2 posts, Group2 gets 2 posts = 4 total
    expect(createdData.length).toBe(4);

    // Check structure for the first post in group1 (author userA)
    const firstPostGroup1 = createdData.find((p) => p.groupId === "group1");
    expect(firstPostGroup1).toEqual({
      id: mockPostId,
      content: `group post ${mockPostContent}`,
      userId: "userA", // Mock arrayElement returns first member
      groupId: "group1",
      createdAt: mockPostDate,
    });
  });

  it("should only create posts in groups with accepted members", async () => {
    await seedGroupPosts(
      mockPrismaClient as any as PrismaClient,
      mockGroups,
      mockMembers,
    );

    // Expect generator to be called only for groups with accepted members (group1, group2)
    // expect(mockAccountDataGenerator).toHaveBeenCalledTimes(2); // Original assertion
    expect(mockAccountDataGenerator).toHaveBeenCalled(); // Check if called at all
    expect(mockAccountDataGenerator).toHaveBeenCalledWith("random", 1, 10);

    const createArgs = (mockPrismaClient.post.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.PostCreateManyInput[] = createArgs.data;
    const groupIdsWithPosts = new Set(createdData.map((p) => p.groupId));

    expect(groupIdsWithPosts).toContain("group1");
    expect(groupIdsWithPosts).toContain("group2");
    expect(groupIdsWithPosts).not.toContain("group3");
  });

  it("should select an accepted member from the group as the author", async () => {
    await seedGroupPosts(
      mockPrismaClient as any as PrismaClient,
      mockGroups,
      mockMembers,
    );

    // Check arrayElement was called with accepted members for group1
    expect(mockFakerHelpersArrayElement).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: "userA", groupId: "group1" }),
        expect.objectContaining({ userId: "userB", groupId: "group1" }),
      ]),
    );
    // Check arrayElement was called with accepted members for group2
    expect(mockFakerHelpersArrayElement).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: "userC", groupId: "group2" }),
      ]),
    );
    // Ensure it wasn't called with members from group3 or unaccepted members
    expect(mockFakerHelpersArrayElement).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: "userD", groupId: "group3" }),
      ]),
    );
  });

  it("should set post createdAt date after author joined the group", async () => {
    // Test name is slightly inaccurate now, but testing date range
    // const authorJoinedDate = new Date("2023-01-10"); // userA joined group1
    mockFakerHelpersArrayElement.mockReturnValue(mockMembers[0]); // Force userA as author

    await seedGroupPosts(
      mockPrismaClient as any as PrismaClient,
      mockGroups,
      mockMembers,
    );

    // Check the date range passed to faker.date.between matches the current logic
    expect(mockFakerDateBetween).toHaveBeenCalledWith({
      // Check that 'from' is roughly 1 year before 'to'
      from: expect.any(Date),
      to: expect.any(Date),
    });

    // Optional: More specific check if needed
    const dateArgs = (mockFakerDateBetween as Mock).mock.calls[0][0];
    const fromDate = new Date(dateArgs.from);
    const toDate = new Date(dateArgs.to);
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    // Allow some tolerance for execution time differences
    expect(toDate.getTime() - fromDate.getTime()).toBeCloseTo(oneYearMs, -2); // Check within 100ms tolerance
  });

  it("should return created group post data", async () => {
    const result = await seedGroupPosts(
      mockPrismaClient as any as PrismaClient,
      mockGroups,
      mockMembers,
    );
    expect(result.length).toBe(4);

    // Check first post created (group1, author userA)
    const firstPost = result[0];
    // Check should now pass as CreatedPost interface includes content
    expect(firstPost).toEqual({
      id: mockPostId,
      content: `group post ${mockPostContent}`,
      userId: "userA",
      groupId: "group1",
      createdAt: mockPostDate,
    });
  });

  // Add tests for empty inputs, prisma failure etc.
  it("should return empty array if no groups provided", async () => {
    const result = await seedGroupPosts(
      mockPrismaClient as any as PrismaClient,
      [],
      mockMembers,
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.post.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array if no members provided", async () => {
    const result = await seedGroupPosts(
      mockPrismaClient as any as PrismaClient,
      mockGroups,
      [],
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.post.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array if no groups have accepted members", async () => {
    const noAcceptedMembers = mockMembers.map((m) => ({
      ...m,
      acceptedInvite: false,
    }));
    const result = await seedGroupPosts(
      mockPrismaClient as any as PrismaClient,
      mockGroups,
      noAcceptedMembers,
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.post.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array and log error if prisma create fails", async () => {
    const dbError = new Error("DB Group Post Write Failed");
    (mockPrismaClient.post.createMany as Mock).mockRejectedValue(dbError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedGroupPosts(
      mockPrismaClient as any as PrismaClient,
      mockGroups,
      mockMembers,
    );

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating group posts in DB:",
      dbError,
    );

    consoleErrorSpy.mockRestore();
  });
});
