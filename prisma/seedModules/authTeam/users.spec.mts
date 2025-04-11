import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockCypressEnv = {
  password: "mockPassword1!",
  testUserEmailDomain: "@mockdomain.com", // Add mock domain
  verifiedUser: "testUserVerified",
  googleLoginUser: "testUserGoogleLogin",
  noAvatarUser: "testUserNoAvatar",
  noBioUser: "testUserNoBio",
  // NOTE: Keep this mock aligned with the keys actually used to derive characteristics
  // in the seedUsers function and tested below.
};
const MOCK_USER_COUNT = 4; // Number of user keys in mockCypressEnv above (excluding password/domain)

vi.mock("../../seedUtils.mts", async (importOriginal) => {
  // ... existing faker mocks ...
  const original = await importOriginal(); // Import original if needed for non-mocked parts
  return {
    ...(original as any), // Spread original exports first
    faker: {
      // Your existing faker mocks...
      string: {
        numeric: vi.fn(() => "1234567890"),
        alphanumeric: vi.fn(() => "abcdefghij"),
      },
      image: {
        avatarLegacy: vi.fn(() => "https://pravatar.cc/mock-avatar.jpg"),
      },
      number: {
        int: vi.fn(() => 42),
        float: vi.fn(),
      },
      lorem: {
        sentence: vi.fn(() => "mock bio sentence"),
      },
      date: {
        between: vi.fn(() => new Date("2023-01-01T12:00:00.000Z")),
      },
      helpers: { arrayElement: vi.fn(), shuffle: vi.fn() },
    },
    generateIdFromEntropySize: vi.fn((size) => `mockId_${size}`),
    cypressEnv: mockCypressEnv, // Use the updated mock env
    prisma: mockPrismaClient, // Mock Prisma dependency within seedUtils
    streamChatClient: mockStreamClient, // Mock Stream dependency within seedUtils
    // Mock passwordHash or let it be mocked by the hasher argument if seedUsers uses it directly
    // passwordHash: vi.fn(async (pw) => `hashed_${pw}`), // Example if needed
  };
});

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
// Note: These imports might now be redundant if fully mocked via vi.mock above,
// but keep them if the test setup relies on specific instances from the mock factory.
const { prisma, streamChatClient } = await import("../../seedUtils.mts");
const { seedUsers } = await import("./users.mts"); // Use .mts extension

describe("AuthTeam - seedUsers Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use MOCK_USER_COUNT for expected counts
    (mockPrismaClient.user.createMany as Mock).mockResolvedValue({
      count: MOCK_USER_COUNT,
    });
    (mockStreamClient.upsertUsers as Mock).mockResolvedValue({});
    (mockHasher as Mock).mockResolvedValue("mockHashedPassword");
  });

  it("should generate correct user data based on cypressEnv", async () => {
    await seedUsers(mockPrismaClient, mockStreamClient, mockHasher);
    expect(mockPrismaClient.user.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.user.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.UserCreateInput[] = createArgs.data;

    // Use MOCK_USER_COUNT
    expect(createdData).toHaveLength(MOCK_USER_COUNT);

    // --- Check characteristics based on KEY logic used in seedUsers --- //

    // Verified User (key: 'verifiedUser')
    const verifiedUser = createdData.find(
      (u) => u.username === mockCypressEnv.verifiedUser,
    );
    expect(verifiedUser?.passwordHash).toBe("mockHashedPassword");
    expect(verifiedUser?.isVerified).toBe(true); // Key does not contain 'unverified'
    expect(verifiedUser?.googleId).toBeNull(); // Key is not 'googleLoginUser'
    expect(verifiedUser?.email).toBe(
      `${mockCypressEnv.verifiedUser.toLowerCase()}${mockCypressEnv.testUserEmailDomain}`,
    );
    if (verifiedUser?.avatarUrl !== null) {
      // Avatar is random, check if not null
      expect(verifiedUser?.avatarUrl).toEqual(
        expect.stringContaining("pravatar.cc"),
      );
    }
    expect(verifiedUser?.bio).toBe("mock bio sentence"); // Key does not contain 'noBio'

    // Google Login User (key: 'googleLoginUser')
    const googleUser = createdData.find(
      (u) => u.username === mockCypressEnv.googleLoginUser,
    );
    expect(googleUser?.passwordHash).toBeNull(); // Key is 'googleLoginUser'
    expect(googleUser?.isVerified).toBe(true); // Key does not contain 'unverified'
    expect(googleUser?.googleId).toBe("1234567890abcdefghij"); // Key is 'googleLoginUser'
    expect(googleUser?.email).toBe(
      `${mockCypressEnv.googleLoginUser.toLowerCase()}${mockCypressEnv.testUserEmailDomain}`,
    );

    // No Avatar User (key: 'noAvatarUser')
    const noAvatarUser = createdData.find(
      (u) => u.username === mockCypressEnv.noAvatarUser,
    );
    expect(noAvatarUser?.avatarUrl).toBeNull(); // Key contains 'noavatar'
    expect(noAvatarUser?.email).toBe(
      `${mockCypressEnv.noAvatarUser.toLowerCase()}${mockCypressEnv.testUserEmailDomain}`,
    );

    // No Bio User (key: 'noBioUser')
    const noBioUser = createdData.find(
      (u) => u.username === mockCypressEnv.noBioUser,
    );
    expect(noBioUser?.bio).toBeNull(); // Key contains 'nobio'
    expect(noBioUser?.email).toBe(
      `${mockCypressEnv.noBioUser.toLowerCase()}${mockCypressEnv.testUserEmailDomain}`,
    );
  });

  it("should call hasher for non-Google users", async () => {
    await seedUsers(mockPrismaClient, mockStreamClient, mockHasher);
    expect(mockHasher).toHaveBeenCalledTimes(1); // Called once before loop
    expect(mockHasher).toHaveBeenCalledWith(mockCypressEnv.password);
  });

  it("should call streamClient.upsertUsers with correct data", async () => {
    await seedUsers(mockPrismaClient, mockStreamClient, mockHasher);
    expect(mockStreamClient.upsertUsers).toHaveBeenCalledOnce();
    const streamArgs = (mockStreamClient.upsertUsers as Mock).mock.calls[0][0];
    // Use MOCK_USER_COUNT
    expect(streamArgs).toHaveLength(MOCK_USER_COUNT);

    const verifiedStreamUser = streamArgs.find(
      (u: any) => u.name === mockCypressEnv.verifiedUser,
    );
    expect(verifiedStreamUser?.id).toBeDefined();
    expect(verifiedStreamUser?.email).toBe(
      `${mockCypressEnv.verifiedUser.toLowerCase()}${mockCypressEnv.testUserEmailDomain}`,
    );
    if (verifiedStreamUser?.image !== null) {
      // Check if avatar exists
      expect(verifiedStreamUser?.image).toEqual(
        expect.stringContaining("pravatar.cc"),
      );
    }

    const noAvatarStreamUser = streamArgs.find(
      (u: any) => u.name === mockCypressEnv.noAvatarUser,
    );
    expect(noAvatarStreamUser?.image).toBeNull(); // Key 'noAvatarUser' means no image
  });

  it("should return correctly structured CreatedUser data", async () => {
    const result = await seedUsers(
      mockPrismaClient,
      mockStreamClient,
      mockHasher,
    );
    // Use MOCK_USER_COUNT
    expect(result).toHaveLength(MOCK_USER_COUNT);
    const verifiedResultUser = result.find(
      (u: any) => u.username === mockCypressEnv.verifiedUser,
    );
    expect(verifiedResultUser).toEqual({
      id: expect.any(String),
      username: mockCypressEnv.verifiedUser,
      email: `${mockCypressEnv.verifiedUser.toLowerCase()}${mockCypressEnv.testUserEmailDomain}`,
      isVerified: true,
      createdAt: expect.any(Date),
      displayName: mockCypressEnv.verifiedUser,
      avatarUrl:
        verifiedResultUser?.avatarUrl === null
          ? null
          : expect.stringContaining("pravatar.cc"),
      bio: "mock bio sentence",
      passwordHash: "mockHashedPassword",
      pendingEmail: null,
      googleId: null,
    });
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
    expect(mockStreamClient.upsertUsers).not.toHaveBeenCalled();
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
    expect(result).toHaveLength(MOCK_USER_COUNT);
    expect(mockPrismaClient.user.createMany).toHaveBeenCalledOnce();
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
    expect(result).toHaveLength(MOCK_USER_COUNT);
    expect(mockPrismaClient.user.createMany).toHaveBeenCalledOnce();
    expect(mockStreamClient.upsertUsers).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Stream Chat client not available. Skipping Stream Chat user upsert.",
    );
    consoleWarnSpy.mockRestore();
  });
});
