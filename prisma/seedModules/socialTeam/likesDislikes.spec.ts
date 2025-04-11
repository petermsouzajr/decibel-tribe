import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockFakerHelpersShuffle = vi.fn((arr) => [...arr]);
const mockFakerHelpersArrayElement = vi.fn();
const mockAccountDataGenerator = vi.fn();

vi.mock("../../seedUtils.js", () => ({
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
const { seedLikesDislikes } = await import("./likesDislikes.js");

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

    // Mock Prisma calls to resolve successfully (count doesn't matter here)
    (mockPrismaClient.like.createMany as Mock).mockResolvedValue({ count: 1 });
    (mockPrismaClient.dislike.createMany as Mock).mockResolvedValue({
      count: 1,
    });

    // Mock accountDataGenerator to return a consistent limit per post
    (mockAccountDataGenerator as Mock).mockReturnValue(2); // e.g., max 2 reactions per post

    // Mock arrayElement probabilistically
    (mockFakerHelpersArrayElement as Mock).mockImplementation(() => {
      const rand = Math.random();
      if (rand < 0.4) return "LIKE"; // ~40% chance of LIKE
      if (rand < 0.8) return "DISLIKE"; // ~40% chance of DISLIKE
      return null; // ~20% chance of NO reaction
    });
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

    // With probabilistic mocks, we can't assert exact length easily.
    // Instead, check that *some* were likely created and check structure.
    // Or check that the total length is within a reasonable range based on posts * users * probability.
    // For now, let's just check if the arrays have *some* content expected.
    expect(createdLikeData.length).toBeGreaterThan(0); // Expect at least one like
    expect(createdDislikeData.length).toBeGreaterThan(0); // Expect at least one dislike

    // Check structure of the first like/dislike found, if they exist
    if (createdLikeData.length > 0) {
      expect(createdLikeData[0]).toEqual({
        userId: expect.any(String),
        postId: expect.any(String),
      });
    }
    if (createdDislikeData.length > 0) {
      expect(createdDislikeData[0]).toEqual({
        userId: expect.any(String),
        postId: expect.any(String),
      });
    }
  });

  it("should return created like and dislike data", async () => {
    const result = await seedLikesDislikes(
      mockPrismaClient as any,
      mockUsers,
      mockPosts,
    );

    // Assert based on probabilistic generation - expect *some* results
    expect(result.createdLikes.length).toBeGreaterThan(0);
    expect(result.createdDislikes.length).toBeGreaterThan(0);

    // Check structure of first returned like/dislike, if they exist
    if (result.createdLikes.length > 0) {
      expect(result.createdLikes[0]).toEqual({
        userId: expect.any(String),
        postId: expect.any(String),
      });
    }
    if (result.createdDislikes.length > 0) {
      expect(result.createdDislikes[0]).toEqual({
        userId: expect.any(String),
        postId: expect.any(String),
      });
    }
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
    // Check probabilistically again
    expect(result.createdLikes.length).toBeGreaterThan(0);
    expect(result.createdDislikes.length).toBeGreaterThan(0);

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
    // Check probabilistically again
    expect(result.createdLikes.length).toBeGreaterThan(0);
    expect(result.createdDislikes.length).toBeGreaterThan(0);

    consoleErrorSpy.mockRestore();
  });
});
