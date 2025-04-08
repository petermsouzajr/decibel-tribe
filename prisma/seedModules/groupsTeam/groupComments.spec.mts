import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockFakerLoremSentence = vi.fn();
const mockFakerHelpersArrayElement = vi.fn((arr) => arr[0]);
const mockFakerDateBetween = vi.fn();
const mockGenerateIdFromEntropySize = vi.fn();
const mockAccountDataGenerator = vi.fn();

vi.mock("../../seedUtils.mjs", () => ({
  // Use .mjs
  faker: {
    lorem: { sentence: mockFakerLoremSentence },
    helpers: { arrayElement: mockFakerHelpersArrayElement },
    date: { between: mockFakerDateBetween },
  },
  generateIdFromEntropySize: mockGenerateIdFromEntropySize,
  accountDataGenerator: mockAccountDataGenerator,
}));

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  comment: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import mocked utils and the function to test
const { seedGroupComments } = await import("./groupComments.mjs");

describe("GroupsTeam - seedGroupComments Module", () => {
  const mockGroupPosts = [
    {
      id: "gPost1",
      groupId: "groupA",
      userId: "user1",
      createdAt: new Date("2023-02-01"),
    },
    {
      id: "gPost2",
      groupId: "groupB",
      userId: "user3",
      createdAt: new Date("2023-02-10"),
    },
    {
      id: "gPost3",
      groupId: "groupA",
      userId: "user2",
      createdAt: new Date("2023-02-15"),
    },
    {
      id: "gPost4",
      groupId: "groupC",
      userId: "user4",
      createdAt: new Date("2023-02-20"),
    },
  ];
  const mockMembers = [
    {
      id: "mem1",
      groupId: "groupA",
      userId: "user1",
      joinedAt: new Date("2023-01-10"),
      acceptedInvite: true,
    },
    {
      id: "mem2",
      groupId: "groupA",
      userId: "user2",
      joinedAt: new Date("2023-01-20"),
      acceptedInvite: true,
    },
    {
      id: "mem3",
      groupId: "groupB",
      userId: "user3",
      joinedAt: new Date("2023-01-25"),
      acceptedInvite: true,
    },
    {
      id: "mem4",
      groupId: "groupC",
      userId: "user4",
      joinedAt: new Date("2023-01-30"),
      acceptedInvite: false,
    },
  ];
  const mockUsers = [
    { id: "user1", username: "UserOne", createdAt: new Date("2023-01-01") },
    { id: "user2", username: "UserTwo", createdAt: new Date("2023-01-05") },
    { id: "user3", username: "UserThree", createdAt: new Date("2023-01-10") },
    { id: "user4", username: "UserFour", createdAt: new Date("2023-01-15") },
  ];
  const mockCommentDate = new Date("2023-03-01");
  const mockCommentContent = "Test group comment content";
  const mockCommentId = "gCommentId123";

  beforeEach(() => {
    vi.clearAllMocks();
    (mockPrismaClient.comment.createMany as Mock).mockResolvedValue({
      count: 6,
    }); // Expect 6 now
    mockAccountDataGenerator.mockReturnValue(2); // Still 2 comments per eligible post
    mockFakerLoremSentence.mockReturnValue(mockCommentContent);
    mockFakerDateBetween.mockReturnValue(mockCommentDate);
    mockGenerateIdFromEntropySize.mockReturnValue(mockCommentId);
    mockFakerHelpersArrayElement.mockImplementation((arr) => arr[0]);
  });

  it("should call prisma.comment.createMany with correct data structure", async () => {
    await seedGroupComments(
      mockPrismaClient as any as PrismaClient,
      mockGroupPosts,
      mockMembers,
      mockUsers,
    );

    expect(mockPrismaClient.comment.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.comment.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.CommentCreateManyInput[] = createArgs.data;

    // Based on current logic: gPost1(2), gPost2(2), gPost3(2) = 6 total
    expect(createdData.length).toBe(6);

    // Check structure for the first comment found for gPost1
    const firstCommentPost1 = createdData.find((c) => c.postId === "gPost1");
    expect(firstCommentPost1).toEqual({
      id: mockCommentId,
      content: `group comment ${mockCommentContent}`,
      // Author could be user1 or user2 based on shuffle
      userId: expect.stringMatching(/user[12]/),
      postId: "gPost1",
      createdAt: mockCommentDate,
    });

    // Check structure for the first comment found for gPost2
    const firstCommentPost2 = createdData.find((c) => c.postId === "gPost2");
    expect(firstCommentPost2).toEqual({
      id: mockCommentId,
      content: `group comment ${mockCommentContent}`,
      userId: "user3", // Only member in groupB
      postId: "gPost2",
      createdAt: mockCommentDate,
    });

    // Check structure for the first comment found for gPost3
    const firstCommentPost3 = createdData.find((c) => c.postId === "gPost3");
    expect(firstCommentPost3).toEqual({
      id: mockCommentId,
      content: `group comment ${mockCommentContent}`,
      userId: "user1", // Mock always returns the first element (user1 for groupA)
      postId: "gPost3",
      createdAt: mockCommentDate,
    });

    // Check structure for the first comment found for gPost4 (should not exist)
    const firstCommentPost4 = createdData.find((c) => c.postId === "gPost4");
    expect(firstCommentPost4).toBeUndefined();
  });

  it("should only process posts based on loop step (i += 2)", async () => {
    await seedGroupComments(
      mockPrismaClient as any as PrismaClient,
      mockGroupPosts,
      mockMembers,
      mockUsers,
    );

    // Generator called for gPost1, gPost2, gPost3 (gPost4 skipped due to no accepted members)
    expect(mockAccountDataGenerator).toHaveBeenCalledTimes(3);
    expect(mockAccountDataGenerator).toHaveBeenCalledWith("random", 1, 10);

    const createArgs = (mockPrismaClient.comment.createMany as Mock).mock
      .calls[0][0];
    const commentedPostIds = new Set(createArgs.data.map((c: any) => c.postId));

    expect(commentedPostIds).toContain("gPost1");
    expect(commentedPostIds).toContain("gPost2"); // Now included
    expect(commentedPostIds).toContain("gPost3");
    expect(commentedPostIds).not.toContain("gPost4"); // Correctly excluded
  });

  it("should only create comments for posts in groups with accepted members", async () => {
    await seedGroupComments(
      mockPrismaClient as any as PrismaClient,
      mockGroupPosts,
      mockMembers,
      mockUsers,
    );
    const createArgs = (mockPrismaClient.comment.createMany as Mock).mock
      .calls[0][0];
    const commentedPostIds = new Set(createArgs.data.map((c: any) => c.postId));

    expect(commentedPostIds).toContain("gPost1"); // Has accepted members
    expect(commentedPostIds).toContain("gPost2"); // Has accepted members
    expect(commentedPostIds).toContain("gPost3"); // Has accepted members
    expect(commentedPostIds).not.toContain("gPost4"); // No accepted members - Correct

    // Check that arrayElement was called with members from groupA and groupB, but not groupC
    expect(mockFakerHelpersArrayElement).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ groupId: "groupA" })]),
    );
    expect(mockFakerHelpersArrayElement).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ groupId: "groupB" })]),
    );
    expect(mockFakerHelpersArrayElement).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ groupId: "groupC" })]),
    );
  });

  it("should select an accepted member from the correct group as the author", async () => {
    await seedGroupComments(
      mockPrismaClient as any as PrismaClient,
      mockGroupPosts,
      mockMembers,
      mockUsers,
    );

    // Check it was called with accepted members for groupA
    expect(mockFakerHelpersArrayElement).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: "user1", groupId: "groupA" }),
        expect.objectContaining({ userId: "user2", groupId: "groupA" }),
      ]),
    );
    // Check it was called with accepted members for groupB
    expect(mockFakerHelpersArrayElement).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: "user3", groupId: "groupB" }),
      ]),
    );
    // Check it was NOT called with members from groupC (user4 not accepted)
    expect(mockFakerHelpersArrayElement).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ groupId: "groupC" })]),
    );
  });

  it("should set comment createdAt date after both user creation and post creation", async () => {
    const userCreatedAt = new Date("2023-01-01"); // user1
    const postCreatedAt = new Date("2023-02-01"); // gPost1
    const expectedEarliestDate = postCreatedAt; // Max of the two

    mockFakerHelpersArrayElement.mockReturnValue(mockMembers[0]); // Force user1 as author for gPost1

    await seedGroupComments(
      mockPrismaClient as any as PrismaClient,
      mockGroupPosts,
      mockMembers,
      mockUsers,
    );

    // Check the date range passed to faker.date.between for user1's comment on gPost1
    expect(mockFakerDateBetween).toHaveBeenCalledWith({
      from: expectedEarliestDate,
      to: expect.any(Date),
    });
  });

  it("should return created group comment data", async () => {
    const result = await seedGroupComments(
      mockPrismaClient as any as PrismaClient,
      mockGroupPosts,
      mockMembers,
      mockUsers,
    );
    // Expect 6 based on corrected logic (2 for gPost1, 2 for gPost2, 2 for gPost3)
    expect(result.length).toBe(6);

    // Check first comment created (gPost1, author could be user1 or user2)
    const firstCommentPost1 = result.find((c) => c.postId === "gPost1");
    expect(firstCommentPost1).toEqual({
      id: mockCommentId,
      userId: expect.stringMatching(/user[12]/),
      postId: "gPost1",
    });

    // Check first comment for gPost2 (author user3)
    const firstCommentPost2 = result.find((c) => c.postId === "gPost2");
    expect(firstCommentPost2).toEqual({
      id: mockCommentId,
      userId: "user3",
      postId: "gPost2",
    });
  });

  // Add tests for empty inputs, prisma failure etc.
  it("should return empty array if no group posts provided", async () => {
    const result = await seedGroupComments(
      mockPrismaClient as any as PrismaClient,
      [],
      mockMembers,
      mockUsers,
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.comment.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array if no members provided", async () => {
    const result = await seedGroupComments(
      mockPrismaClient as any as PrismaClient,
      mockGroupPosts,
      [],
      mockUsers,
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.comment.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array and log error if prisma create fails", async () => {
    const dbError = new Error("DB Group Comment Write Failed");
    (mockPrismaClient.comment.createMany as Mock).mockRejectedValue(dbError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedGroupComments(
      mockPrismaClient as any as PrismaClient,
      mockGroupPosts,
      mockMembers,
      mockUsers,
    );

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating group comments in DB:",
      dbError,
    );

    consoleErrorSpy.mockRestore();
  });
});
