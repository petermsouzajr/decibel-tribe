import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma } from "@prisma/client";
import { faker, cypressEnv } from "../../seedUtils.mjs";

// Define UserInput at the top level
interface UserInput {
  id: string;
  username: string;
  createdAt: Date;
  isVerified: boolean;
  // add other fields if necessary for the test context
}

// --- Mocks ---

// Mock seedUtils dependencies
const mockFakerHelpersShuffle = vi.fn((arr) => [...arr]); // Simple passthrough shuffle
const mockAccountDataGenerator = vi.fn();

vi.mock("../../seedUtils.mjs", () => ({
  faker: {
    helpers: {
      shuffle: mockFakerHelpersShuffle,
    },
  },
  cypressEnv: {
    /* mock cypress env if needed */
  },
  accountDataGenerator: mockAccountDataGenerator,
}));

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  follow: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import the function to test *after* mocks are set up
const { seedFollows } = await import("./follows.mjs");

describe("SocialTeam - seedFollows Module", () => {
  const mockUsers: UserInput[] = [
    {
      id: "user1",
      username: "UserOne",
      createdAt: new Date("2023-01-01"),
      isVerified: true,
    },
    {
      id: "user2",
      username: "UserTwo",
      createdAt: new Date("2023-01-02"),
      isVerified: true,
    },
    {
      id: "user3",
      username: "UserThree",
      createdAt: new Date("2023-01-03"),
      isVerified: false,
    },
    {
      id: "userNF",
      username: "noFollowers",
      createdAt: new Date("2023-01-04"),
      isVerified: true,
    },
  ];

  // Define the expected result of the shuffle/filter outside
  // Ensure type annotation here is correct
  const expectedShuffledFilteredUsers: UserInput[] = mockUsers.filter(
    (u: UserInput) => u.id !== "user1",
  );

  beforeEach(() => {
    vi.clearAllMocks();
    (mockPrismaClient.follow.createMany as Mock).mockResolvedValue({
      count: 4,
    });
    mockAccountDataGenerator.mockReturnValue(2); // Each eligible user gets 2 followers

    // Correct the shuffle mock: it should shuffle the *actual* input array
    mockFakerHelpersShuffle.mockImplementation((arr: UserInput[]) => {
      // Simple mock: return a copy of the input array (order doesn't strictly matter for these tests)
      // or implement a basic shuffle if order becomes important later.
      return [...arr];
    });
  });

  it("should call prisma.follow.createMany with correct data structure", async () => {
    await seedFollows(mockPrismaClient, mockUsers);

    expect(mockPrismaClient.follow.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.follow.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.FollowCreateManyInput[] = createArgs.data;

    // Expected: user1 gets 2 followers, user2 gets 2 followers = 4 total
    expect(createdData.length).toBe(4);

    // Check structure for one follow relationship (e.g., user1 following user2)
    // Now depends on the corrected shuffle mock returning input array
    // When user1 is followed, potential followers = [user2, userNF, userNV]
    // Mock shuffle returns [user2, userNF, userNV]
    // First follower taken is user2.
    const followUser1 = createdData.find((f) => f.followingId === "user1");
    expect(followUser1).toEqual({
      followerId: "user2", // First from the *correctly filtered* shuffled list
      followingId: "user1",
    });

    // When user2 is followed, potential followers = [user1, userNF, userNV]
    // Mock shuffle returns [user1, userNF, userNV]
    // First follower taken is user1.
    const followUser2 = createdData.find((f) => f.followingId === "user2");
    expect(followUser2).toEqual({
      followerId: "user1", // First from the *correctly filtered* shuffled list
      followingId: "user2",
    });
  });

  it("should only create follows for verified users not named 'noFollowers'", async () => {
    await seedFollows(mockPrismaClient, mockUsers);
    // Called for user1 and user2
    expect(mockAccountDataGenerator).toHaveBeenCalledTimes(2);
    expect(mockAccountDataGenerator).toHaveBeenCalledWith("random", 1, 30);

    const createArgs = (mockPrismaClient.follow.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.FollowCreateManyInput[] = createArgs.data;
    const followedUserIds = new Set(createdData.map((f) => f.followingId));
    expect(followedUserIds).toContain("user1");
    expect(followedUserIds).toContain("user2");
    expect(followedUserIds).not.toContain("userNF");
    expect(followedUserIds).not.toContain("userNV");
  });

  it("should not allow a user to follow themselves", async () => {
    await seedFollows(mockPrismaClient, mockUsers);
    const createArgs = (mockPrismaClient.follow.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.FollowCreateManyInput[] = createArgs.data;

    createdData.forEach((follow) => {
      expect(follow.followerId).not.toBe(follow.followingId);
    });

    // Check shuffle calls more precisely
    expect(mockFakerHelpersShuffle).toHaveBeenCalledTimes(2);

    // 1st call: following user1, input array should exclude user1
    expect(mockFakerHelpersShuffle).toHaveBeenNthCalledWith(
      1,
      expect.not.arrayContaining([expect.objectContaining({ id: "user1" })]),
    );
    expect(mockFakerHelpersShuffle).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([expect.objectContaining({ id: "user2" })]), // Should contain others
    );

    // 2nd call: following user2, input array should exclude user2
    expect(mockFakerHelpersShuffle).toHaveBeenNthCalledWith(
      2,
      expect.not.arrayContaining([expect.objectContaining({ id: "user2" })]),
    );
    expect(mockFakerHelpersShuffle).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([expect.objectContaining({ id: "user1" })]), // Should contain others
    );
  });

  it("should return created follow data", async () => {
    const result = await seedFollows(mockPrismaClient, mockUsers);
    // Expect 4 based on default mock (2 followers for user1, 2 for user2)
    expect(result.length).toBe(4);

    // Check first follow (depends on shuffle)
    const firstFollow = result[0];
    expect(firstFollow).toEqual({
      followerId: expect.any(String), // Specific ID depends on shuffle
      followingId: "user1", // First followable user
    });
    expect(firstFollow.followerId).not.toBe("user1");
  });

  // Add tests for empty users, prisma failure etc.
  it("should return empty array if no users provided", async () => {
    const result = await seedFollows(mockPrismaClient, []);
    expect(result).toEqual([]);
    expect(mockPrismaClient.follow.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array if no followable users found", async () => {
    const nonFollowableUsers = [mockUsers[2], mockUsers[3]]; // noFollowers and NotVerified
    const result = await seedFollows(mockPrismaClient, nonFollowableUsers);
    expect(result).toEqual([]);
    expect(mockPrismaClient.follow.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array and log error if prisma create fails", async () => {
    const dbError = new Error("DB Follow Write Failed");
    (mockPrismaClient.follow.createMany as Mock).mockRejectedValue(dbError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedFollows(mockPrismaClient, mockUsers);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating follows in DB:",
      dbError,
    );

    consoleErrorSpy.mockRestore();
  });
});
