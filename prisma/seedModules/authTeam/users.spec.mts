import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockCypressEnv = {
  verifiedUsername: "testUserVerified",
  googleLoginUsername: "testUserGoogleLogin",
  noAvatarUsername: "testUserNoAvatar",
  noBioUsername: "testUserNoBio",
  password: "mockPassword1!",
};
vi.mock("../../seedUtils.mjs", async (importOriginal) => ({
  faker: {
    string: {
      numeric: vi.fn(() => "1234567890"),
      alphanumeric: vi.fn(() => "abcdefghij"),
    },
    image: {
      avatarLegacy: vi.fn(() => "https://pravatar.cc/mock-avatar.jpg"),
    },
    number: {
      int: vi.fn(() => 42), // Mock image number
      float: vi.fn(), // Mock if needed elsewhere
    },
    lorem: {
      sentence: vi.fn(() => "mock bio sentence"),
    },
    date: {
      between: vi.fn(() => new Date("2023-01-01T12:00:00.000Z")),
    },
    helpers: { arrayElement: vi.fn(), shuffle: vi.fn() },
    // Add other faker mocks if used by other parts of seedUsers
  },
  generateIdFromEntropySize: vi.fn((size) => `mockId_${size}`),
  cypressEnv: mockCypressEnv,
  prisma: mockPrismaClient,
  streamChatClient: mockStreamClient,
}));

// Mock functions/clients passed as arguments
const mockPrismaClient = {
  user: {
    createMany: vi.fn(),
  },
  // Mock other models if needed by other modules interacting here (unlikely for users)
};
const mockStreamClient = {
  upsertUsers: vi.fn(),
};
const mockHasher = vi.fn();

// --- Test Suite ---

// Import mocked utils and the function to test
const { prisma, streamChatClient } = await import("../../seedUtils.mjs");
const { seedUsers } = await import("./users.mjs"); // Add .mjs extension

describe("AuthTeam - seedUsers Module", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Default successful mock implementations
    (mockPrismaClient.user.createMany as Mock).mockResolvedValue({ count: 4 });
    (mockStreamClient.upsertUsers as Mock).mockResolvedValue({});
    (mockHasher as Mock).mockResolvedValue("mockHashedPassword");
  });

  it("should generate correct user data based on cypressEnv", async () => {
    await seedUsers(mockPrismaClient, mockStreamClient, mockHasher);

    expect(mockPrismaClient.user.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.user.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.UserCreateInput[] = createArgs.data;

    expect(createdData).toHaveLength(4); // Based on mockCypressEnv keys

    // Check a regular verified user
    const verifiedUser = createdData.find(
      (u) => u.username === "testUserVerified",
    );
    expect(verifiedUser?.passwordHash).toBe("mockHashedPassword");
    expect(verifiedUser?.isVerified).toBe(true);
    expect(verifiedUser?.googleId).toBeNull();
    if (verifiedUser?.avatarUrl !== null) {
      expect(verifiedUser?.avatarUrl).toEqual(
        expect.stringContaining("pravatar.cc"),
      );
    }
    expect(verifiedUser?.bio).toBe("mock bio sentence");

    // Check Google login user
    const googleUser = createdData.find(
      (u) => u.username === "testUserGoogleLogin",
    );
    expect(googleUser?.passwordHash).toBeNull();
    expect(googleUser?.isVerified).toBe(true);
    expect(googleUser?.googleId).toBe("1234567890abcdefghij");

    // Check No Avatar user
    const noAvatarUser = createdData.find(
      (u) => u.username === "testUserNoAvatar",
    );
    expect(noAvatarUser?.avatarUrl).toBeNull();

    // Check No Bio user
    const noBioUser = createdData.find((u) => u.username === "testUserNoBio");
    expect(noBioUser?.bio).toBeNull();
  });

  it("should call hasher for non-Google users", async () => {
    await seedUsers(mockPrismaClient, mockStreamClient, mockHasher);
    // Hasher is called once before the loop for all non-Google users
    expect(mockHasher).toHaveBeenCalledTimes(1);
    expect(mockHasher).toHaveBeenCalledWith(mockCypressEnv.password);
  });

  it("should call streamClient.upsertUsers with correct data", async () => {
    await seedUsers(mockPrismaClient, mockStreamClient, mockHasher);

    expect(mockStreamClient.upsertUsers).toHaveBeenCalledOnce();
    const streamArgs = (mockStreamClient.upsertUsers as Mock).mock.calls[0][0];
    expect(streamArgs).toHaveLength(4);

    const verifiedStreamUser = streamArgs.find(
      (u: any) => u.name === "testUserVerified",
    );
    expect(verifiedStreamUser?.id).toBeDefined();
    expect(verifiedStreamUser?.email).toBe("testuserverified@example.com");
    expect(verifiedStreamUser?.image).toBeDefined(); // Should have avatar

    const noAvatarStreamUser = streamArgs.find(
      (u: any) => u.name === "testUserNoAvatar",
    );
    expect(noAvatarStreamUser?.image).toBeNull();
  });

  it("should return correctly structured CreatedUser data", async () => {
    const result = await seedUsers(
      mockPrismaClient,
      mockStreamClient,
      mockHasher,
    );

    expect(result).toHaveLength(4);
    const verifiedResultUser = result.find(
      (u: any) => u.username === "testUserVerified",
    );
    expect(verifiedResultUser).toEqual({
      id: expect.any(String),
      username: "testUserVerified",
      email: "testuserverified@example.com",
      isVerified: true,
      createdAt: expect.any(Date),
      displayName: "testUserVerified",
      avatarUrl:
        verifiedResultUser?.avatarUrl === null
          ? null
          : expect.stringContaining("pravatar.cc"),
      bio: "mock bio sentence",
      passwordHash: "mockHashedPassword",
      pendingEmail: null,
      googleId: null,
    });
    // Can add more checks for other user types in return value
  });

  it("should return empty array if prisma create fails", async () => {
    const dbError = new Error("DB Write Failed");
    (mockPrismaClient.user.createMany as Mock).mockRejectedValue(dbError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedUsers(
      mockPrismaClient,
      mockStreamClient,
      mockHasher,
    );

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating users in DB:",
      dbError,
    );
    expect(mockStreamClient.upsertUsers).not.toHaveBeenCalled(); // Should not proceed to Stream

    consoleErrorSpy.mockRestore();
  });

  it("should still return created users if stream upsert fails", async () => {
    const streamError = new Error("Stream API Failed");
    (mockStreamClient.upsertUsers as Mock).mockRejectedValue(streamError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedUsers(
      mockPrismaClient,
      mockStreamClient,
      mockHasher,
    );

    expect(result).toHaveLength(4); // DB creation succeeded
    expect(mockPrismaClient.user.createMany).toHaveBeenCalledOnce(); // DB call happened
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to add users to StreamChat:",
      streamError.message,
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return empty array if prisma client is unavailable", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = await seedUsers(null, mockStreamClient, mockHasher);
    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Prisma client is not available for seedUsers.",
    );
    consoleErrorSpy.mockRestore();
  });

  it("should proceed but warn if stream client is unavailable", async () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const result = await seedUsers(mockPrismaClient, null, mockHasher);

    expect(result).toHaveLength(4); // DB creation should still succeed
    expect(mockPrismaClient.user.createMany).toHaveBeenCalledOnce();
    expect(mockStreamClient.upsertUsers).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Stream Chat client not available. Skipping Stream Chat user upsert.",
    );

    consoleWarnSpy.mockRestore();
  });
});
