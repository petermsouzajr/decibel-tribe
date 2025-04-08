import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockFakerHelpersShuffle = vi.fn((arr) => [...arr]);
const mockFakerHelpersArrayElement = vi.fn();
const mockAccountDataGenerator = vi.fn();

vi.mock("../../seedUtils.mjs", () => ({
  faker: {
    helpers: {
      shuffle: mockFakerHelpersShuffle,
      arrayElement: mockFakerHelpersArrayElement,
    },
  },
  accountDataGenerator: mockAccountDataGenerator,
}));

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  like: {
    createMany: vi.fn(),
  },
  dislike: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import the function to test *after* mocks are set up
const { seedLikesDislikes } = await import("./likesDislikes.mjs");

describe("SocialTeam - seedLikesDislikes Module", () => {
  const mockUsers = [
    { id: "user1", username: "UserOne", createdAt: new Date() },
    { id: "user2", username: "UserTwo", createdAt: new Date() },
    { id: "user3", username: "UserThree", createdAt: new Date() },
  ];
  const mockPosts = [
    { id: "post1", userId: "userA", createdAt: new Date() },
    { id: "post2", userId: "userB", createdAt: new Date() },
    { id: "post3", userId: "userC", createdAt: new Date() },
    { id: "post4", userId: "userD", createdAt: new Date() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock implementations
    (mockPrismaClient.like.createMany as Mock).mockResolvedValue({ count: 2 });
    (mockPrismaClient.dislike.createMany as Mock).mockResolvedValue({
      count: 2,
    });

    // Mock accountDataGenerator
    (mockAccountDataGenerator as Mock)
      .mockReturnValueOnce(2) // Limit for post1
      .mockReturnValueOnce(1) // Unused limit for post1 (can be anything)
      .mockReturnValueOnce(2) // Limit for post3
      .mockReturnValueOnce(1); // Unused limit for post3

    // Modify arrayElement mock to cycle through actions
    (mockFakerHelpersArrayElement as Mock)
      .mockReturnValueOnce("LIKE") // User1, Post1
      .mockReturnValueOnce("DISLIKE") // User2, Post1
      .mockReturnValueOnce(null) // User3, Post1
      .mockReturnValueOnce("LIKE") // User1, Post3
      .mockReturnValueOnce("DISLIKE") // User2, Post3
      .mockReturnValueOnce(null); // User3, Post3
  });

  it("should call prisma.like.createMany and prisma.dislike.createMany with correct data", async () => {
    await seedLikesDislikes(mockPrismaClient as any, mockUsers, mockPosts);

    expect(mockPrismaClient.like.createMany).toHaveBeenCalledOnce();
    expect(mockPrismaClient.dislike.createMany).toHaveBeenCalledOnce();

    const likeArgs = (mockPrismaClient.like.createMany as Mock).mock
      .calls[0][0];
    const dislikeArgs = (mockPrismaClient.dislike.createMany as Mock).mock
      .calls[0][0];
    const createdLikeData: Prisma.LikeCreateManyInput[] = likeArgs.data;
    const createdDislikeData: Prisma.DislikeCreateManyInput[] =
      dislikeArgs.data;

    // Based on new mock: Post1 (1 like, 1 dislike), Post3 (1 like, 1 dislike)
    // Total: 2 likes, 2 dislikes
    expect(createdLikeData.length).toBe(2);
    expect(createdDislikeData.length).toBe(2);

    // Check structure of a like (on post1, by user1)
    expect(createdLikeData[0]).toEqual({
      userId: "user1",
      postId: "post1",
    });
    // Check structure of a dislike (on post1, by user2)
    expect(createdDislikeData[0]).toEqual({
      userId: "user2",
      postId: "post1",
    });
  });

  it("should return created like and dislike data", async () => {
    const result = await seedLikesDislikes(
      mockPrismaClient as any,
      mockUsers,
      mockPosts,
    );

    // Expect 2 likes, 2 dislikes based on new mock setup
    expect(result.createdLikes.length).toBe(2);
    expect(result.createdDislikes.length).toBe(2);

    // Check structure of first like returned (User1, Post1)
    expect(result.createdLikes[0]).toEqual({
      userId: "user1",
      postId: "post1",
    });
    // Check structure of first dislike returned (User2, Post1)
    expect(result.createdDislikes[0]).toEqual({
      userId: "user2",
      postId: "post1",
    });
  });

  // Add tests for empty inputs, prisma failures etc.
  it("should return empty arrays if no posts provided", async () => {
    const result = await seedLikesDislikes(
      mockPrismaClient as any,
      mockUsers,
      [],
    );
    expect(result).toEqual({ createdLikes: [], createdDislikes: [] });
    expect(mockPrismaClient.like.createMany).not.toHaveBeenCalled();
    expect(mockPrismaClient.dislike.createMany).not.toHaveBeenCalled();
  });

  it("should return empty arrays if no users provided", async () => {
    const result = await seedLikesDislikes(
      mockPrismaClient as any,
      [],
      mockPosts,
    );
    expect(result).toEqual({ createdLikes: [], createdDislikes: [] });
    expect(mockPrismaClient.like.createMany).not.toHaveBeenCalled();
    expect(mockPrismaClient.dislike.createMany).not.toHaveBeenCalled();
  });

  it("should continue creating dislikes even if likes fail", async () => {
    const likeError = new Error("DB Like Write Failed");
    (mockPrismaClient.like.createMany as Mock).mockRejectedValue(likeError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedLikesDislikes(
      mockPrismaClient as any,
      mockUsers,
      mockPosts,
    );

    expect(mockPrismaClient.like.createMany).toHaveBeenCalledOnce();
    expect(mockPrismaClient.dislike.createMany).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating likes in DB:",
      likeError,
    );
    // Result still contains potential likes/dislikes based on generation
    expect(result.createdLikes.length).toBe(2);
    expect(result.createdDislikes.length).toBe(2);

    consoleErrorSpy.mockRestore();
  });

  it("should handle dislike creation failure", async () => {
    const dislikeError = new Error("DB Dislike Write Failed");
    (mockPrismaClient.dislike.createMany as Mock).mockRejectedValue(
      dislikeError,
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedLikesDislikes(
      mockPrismaClient as any,
      mockUsers,
      mockPosts,
    );

    expect(mockPrismaClient.like.createMany).toHaveBeenCalledOnce();
    expect(mockPrismaClient.dislike.createMany).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating dislikes in DB:",
      dislikeError,
    );
    // Result still contains potential likes/dislikes based on generation
    expect(result.createdLikes.length).toBe(2);
    expect(result.createdDislikes.length).toBe(2);

    consoleErrorSpy.mockRestore();
  });
});
