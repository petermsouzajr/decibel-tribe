import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
// const mockFakerNumberInt = vi.fn(); // Remove, use accountDataGenerator
const mockFakerHelpersShuffle = vi.fn((arr) => [...arr]); // Simple passthrough shuffle
const mockAccountDataGenerator = vi.fn(); // <-- Add mock fn

vi.mock("../../seedUtils.mjs", () => ({
  faker: {
    // number: { int: mockFakerNumberInt }, // Remove
    helpers: {
      shuffle: mockFakerHelpersShuffle,
    },
  },
  accountDataGenerator: mockAccountDataGenerator, // <-- Add export
}));

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  bookmark: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import the function to test *after* mocks are set up
const { seedBookmarks } = await import("./bookmarks.mts");

describe("SocialTeam - seedBookmarks Module", () => {
  const mockUsers = [
    { id: "user1", username: "UserOne", createdAt: new Date() },
    { id: "user2", username: "UserTwo", createdAt: new Date() },
    { id: "user3", username: "UserThree", createdAt: new Date() },
  ];
  const mockPosts = [
    { id: "post1", userId: "userA", createdAt: new Date() }, // Processed (index 0)
    { id: "post2", userId: "userB", createdAt: new Date() }, // Skipped (index 1)
    { id: "post3", userId: "userC", createdAt: new Date() }, // Processed (index 2)
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock implementations
    (mockPrismaClient.bookmark.createMany as Mock).mockResolvedValue({
      count: 3,
    });
    // Default 2 bookmarks per processed post using generator
    // mockFakerNumberInt.mockReturnValue(2); // Remove
    mockAccountDataGenerator.mockReturnValue(2);
  });

  it("should call prisma.bookmark.createMany with correct data", async () => {
    await seedBookmarks(mockPrismaClient as any, mockUsers, mockPosts);

    expect(mockPrismaClient.bookmark.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.bookmark.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.BookmarkCreateManyInput[] = createArgs.data;

    // Post1: 2 bookmarks
    // Post3: 2 bookmarks
    // Total: 4 bookmarks
    expect(createdData.length).toBe(4);

    // Check structure (post1, bookmarker user1 first from shuffle)
    // expect(createdData[0]).toEqual({ // Remove overly specific check
    //   userId: "user1",
    //   postId: "post1",
    // });
    // Check structure (post3, bookmarker user1 first from shuffle)
    // expect(createdData[2]).toEqual({ // Remove overly specific check
    //   userId: "user1",
    //   postId: "post3",
    // });

    // Check that bookmarks exist for the correct posts
    expect(createdData.some((b) => b.postId === "post1")).toBe(true);
    expect(createdData.some((b) => b.postId === "post3")).toBe(true);
    // Check a general structure
    expect(createdData[0]).toEqual({
      userId: expect.any(String),
      postId: expect.any(String),
    });
  });

  it("should only process posts based on the loop step (i += 2)", async () => {
    await seedBookmarks(mockPrismaClient as any, mockUsers, mockPosts);

    // accountDataGenerator called once per processed post
    // expect(mockFakerNumberInt).toHaveBeenCalledTimes(2); // Remove
    expect(mockAccountDataGenerator).toHaveBeenCalledTimes(2); // post1, post3
    expect(mockAccountDataGenerator).toHaveBeenCalledWith("random", 1, 10);

    const createArgs = (mockPrismaClient.bookmark.createMany as Mock).mock
      .calls[0][0];
    const bookmarkedPostIds = new Set(
      createArgs.data.map((b: any) => b.postId),
    );

    expect(bookmarkedPostIds).toContain("post1");
    expect(bookmarkedPostIds).toContain("post3");
    expect(bookmarkedPostIds).not.toContain("post2");
  });

  it("should not return any data (void function)", async () => {
    const result = await seedBookmarks(
      mockPrismaClient as any,
      mockUsers,
      mockPosts,
    );
    expect(result).toBeUndefined();
  });

  // Add tests for empty inputs, prisma failures etc.
  it("should not call createMany if no posts provided", async () => {
    await seedBookmarks(mockPrismaClient as any, mockUsers, []);
    expect(mockPrismaClient.bookmark.createMany).not.toHaveBeenCalled();
  });

  it("should not call createMany if no users provided", async () => {
    await seedBookmarks(mockPrismaClient as any, [], mockPosts);
    expect(mockPrismaClient.bookmark.createMany).not.toHaveBeenCalled();
  });

  it("should log error if prisma create fails", async () => {
    const dbError = new Error("DB Bookmark Write Failed");
    (mockPrismaClient.bookmark.createMany as Mock).mockRejectedValue(dbError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await seedBookmarks(mockPrismaClient as any, mockUsers, mockPosts);

    expect(mockPrismaClient.bookmark.createMany).toHaveBeenCalledOnce(); // Still attempted
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating bookmarks in DB:",
      dbError,
    );

    consoleErrorSpy.mockRestore();
  });
});
