import { describe, it, expect, vi, beforeEach, beforeAll, Mock } from "vitest";
import { PrismaClient, User, Prisma, Post } from "@prisma/client";
import { faker } from "@faker-js/faker";

// Define PostInput locally (matching the one in comments.mts)
type PostInput = Pick<Post, "id" | "userId" | "createdAt" | "groupId">;

// --- Mocks ---

// Mock Prisma Client
const mockPrismaClient = {
  comment: {
    createMany: vi.fn(),
  },
};
// Mock the *implementation* of the ID generator
const mockGenerateIdImplementation = vi.fn();
const mockAccountDataGenerator = vi.fn();

// Mock faker library
vi.mock("@faker-js/faker", () => ({
  faker: {
    lorem: {
      sentence: vi.fn(),
    },
    helpers: {
      arrayElement: vi.fn(),
      shuffle: vi.fn((arr) => [...arr]),
    },
    date: {
      between: vi.fn(),
    },
  },
}));

// Restore top-level vi.mock for seedUtils.js
vi.mock("../../seedUtils.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../seedUtils.js")>();
  return {
    ...original,
    prisma: mockPrismaClient,
    // Mock the *export* generateIdFromEntropySize with our mock implementation
    generateIdFromEntropySize: mockGenerateIdImplementation,
    accountDataGenerator: mockAccountDataGenerator,
  };
});

// Helper variables for spies
let mockFakerLorem: any;
let mockFakerHelpersArrayElement: any;
let mockFakerDate: any;

// --- Test Suite ---

describe("SocialTeam - seedPublicComments Module", () => {
  // Import the function to test INSIDE describe block
  let seedPublicComments: (typeof import("./comments.js"))["seedPublicComments"];
  // Get the type for the *actual* generateId function if needed for casting
  let generateIdFromEntropySizeType: (typeof import("../../seedUtils.js"))["generateIdFromEntropySize"];

  beforeAll(async () => {
    ({ seedPublicComments } = await import("./comments.js"));
    // Get the actual type after mocks are set up
    const utils = await import("../../seedUtils.js");
    generateIdFromEntropySizeType = utils.generateIdFromEntropySize;
  });

  // Mock Data (User type is now imported)
  const mockUsers: User[] = [
    {
      id: "user1",
      username: "commenter1",
      createdAt: new Date("2023-01-01T10:00:00.000Z"),
      // Add required fields from Prisma User type
      displayName: "Commenter One",
      email: "commenter1@test.com",
      isBanned: false,
      bannedAt: null,
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isVerified: true,
      googleId: null,
      avatarUrl: null,
      bio: null,
      deletedAt: null,
      isAdmin: false,
      isDatingActive: false,
      preferredUnits: null,
    },
    {
      id: "user2",
      username: "commenter2",
      createdAt: new Date("2023-01-02T11:00:00.000Z"),
      // Add required fields
      displayName: "Commenter Two",
      email: "commenter2@test.com",
      isBanned: false,
      bannedAt: null,
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isVerified: true,
      googleId: null,
      avatarUrl: null,
      bio: null,
      deletedAt: null,
      isAdmin: false,
      isDatingActive: false,
      preferredUnits: null,
    },
    {
      id: "userNC",
      username: "noCommentsUser",
      createdAt: new Date("2023-01-03T12:00:00.000Z"),
      // Add required fields
      displayName: "No Comments User",
      email: "nocomments@test.com",
      isBanned: false,
      bannedAt: null,
      pendingEmail: null,
      passwordHash: "hashedpassword",
      isVerified: true,
      googleId: null,
      avatarUrl: null,
      bio: null,
      deletedAt: null,
      isAdmin: false,
      isDatingActive: false,
      preferredUnits: null,
    },
  ];

  // Mock Posts (Using locally defined PostInput type)
  const mockPosts: PostInput[] = [
    {
      id: "post1",
      userId: "user1",
      createdAt: new Date("2023-02-01T10:00:00.000Z"),
      groupId: null, // Public post
    },
    {
      id: "post2",
      userId: "userNC", // Author is the noCommentsUser
      createdAt: new Date("2023-02-02T11:00:00.000Z"),
      groupId: null, // Public post
    },
    {
      id: "post3",
      userId: "user2",
      createdAt: new Date("2023-02-03T12:00:00.000Z"),
      groupId: null, // Public post
    },
    {
      id: "post4",
      userId: "user1",
      createdAt: new Date("2023-02-04T13:00:00.000Z"),
      groupId: "group1", // Group post, should be ignored
    },
  ];

  const mockCommentId = "mock_comment_id";
  const mockCommentDate = new Date("2023-03-15T12:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();

    // Assign mock implementation for the ID generator
    mockGenerateIdImplementation.mockReturnValue(mockCommentId);

    // Set up spies on the mocked faker object's methods
    mockFakerLorem = vi.spyOn(faker.lorem, "sentence");
    mockFakerHelpersArrayElement = vi.spyOn(faker.helpers, "arrayElement");
    mockFakerDate = vi.spyOn(faker.date, "between");

    // Default successful mock implementations
    (mockPrismaClient.comment.createMany as Mock).mockResolvedValue({
      count: 6,
    });
    mockFakerLorem.mockReturnValue("mock content");
    mockFakerHelpersArrayElement.mockImplementation((arr: any[]) => arr[0]);
    mockFakerDate.mockReturnValue(mockCommentDate);
    mockAccountDataGenerator.mockReturnValue(3);
  });

  it("should call prisma.comment.createMany with correct data structure", async () => {
    await seedPublicComments(mockPrismaClient as any, mockUsers, mockPosts, {
      generateId: mockGenerateIdImplementation,
    });
    // Assertions expect mockCommentId
    expect(mockPrismaClient.comment.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.comment.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.CommentCreateManyInput[] = createArgs.data;
    expect(createdData.length).toBe(6); // Expecting 3 comments for post1 and 3 for post3
    const commentOnPost1 = createdData.find((c) => c.postId === "post1");
    expect(commentOnPost1).toEqual({
      id: mockCommentId, // Should now be correct due to DI
      content: `public comment mock content`,
      // Post1 author is user1, potential commenters are [user2, userNC].
      // Mock faker.helpers.arrayElement returns the first element (arr[0]).
      // So, the commenter should be user2.
      userId: mockUsers[1].id, // Expect user2 as commenter
      postId: "post1",
      createdAt: mockCommentDate,
    });
  });

  it("should not create comments for posts by 'noComments' user", async () => {
    await seedPublicComments(
      mockPrismaClient as any as PrismaClient,
      mockUsers,
      mockPosts,
      {
        generateId: mockGenerateIdImplementation,
      },
    );
    const createdData: Prisma.CommentCreateManyInput[] = (
      mockPrismaClient.comment.createMany as Mock
    ).mock.calls[0][0].data;

    const noCommentPost = mockPosts.find((p: any) => p.userId === "userNC");
    expect(
      createdData.every((comment) => comment.postId !== noCommentPost?.id),
    ).toBe(true);
  });

  it("should call accountDataGenerator for eligible post authors", async () => {
    await seedPublicComments(
      mockPrismaClient as any as PrismaClient,
      mockUsers,
      mockPosts,
      {
        generateId: mockGenerateIdImplementation,
      },
    );
    // Called for post1 (user1) and post3 (user2), but not post2 (userNC)
    expect(mockAccountDataGenerator).toHaveBeenCalledTimes(2);
    expect(mockAccountDataGenerator).toHaveBeenCalledWith("random", 1, 15);
  });

  it("should return created comment data", async () => {
    const result = await seedPublicComments(
      mockPrismaClient as any,
      mockUsers,
      mockPosts,
      {
        generateId: mockGenerateIdImplementation,
      },
    );
    expect(result.length).toBe(6);
    // The first comment created will be on post1, by user2 (based on mock setup)
    expect(result[0]).toEqual({
      id: mockCommentId, // Expect the exact mock ID
      // Post1 author is user1, potential commenters are [user2, userNC].
      // Mock faker.helpers.arrayElement returns the first element (arr[0]).
      // So, the commenter should be user2.
      userId: mockUsers[1].id, // Expect user2 as commenter
      postId: "post1",
    });
    // Optionally check another comment, e.g., the first on post3
    // Post3 author is user2, potential commenters are [user1, userNC].
    // Mock faker.helpers.arrayElement returns user1.
    const commentOnPost3 = result.find((c) => c.postId === "post3");
    expect(commentOnPost3).toBeDefined();
    expect(commentOnPost3?.userId).toEqual(mockUsers[0].id); // Expect user1 as commenter
  });

  // Add tests for empty users/posts, prisma failure etc.
  it("should return empty array if no posts provided", async () => {
    const result = await seedPublicComments(
      mockPrismaClient as any as PrismaClient,
      mockUsers,
      [],
      {
        generateId: mockGenerateIdImplementation,
      },
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.comment.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array if no users provided", async () => {
    // Although users are only needed to determine *if* comments are made and *who* comments,
    // the function checks for users early.
    const result = await seedPublicComments(
      mockPrismaClient as any as PrismaClient,
      [],
      mockPosts,
      {
        generateId: mockGenerateIdImplementation,
      },
    );
    expect(result).toEqual([]);
    expect(mockPrismaClient.comment.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array and log error if prisma create fails", async () => {
    (mockPrismaClient.comment.createMany as Mock).mockRejectedValue(
      new Error("DB Comment Write Failed"),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = await seedPublicComments(
      mockPrismaClient as any as PrismaClient,
      mockUsers,
      mockPosts,
      {
        generateId: mockGenerateIdImplementation,
      },
    );

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating public comments in DB:",
      new Error("DB Comment Write Failed"),
    );

    consoleErrorSpy.mockRestore();
  });
});
