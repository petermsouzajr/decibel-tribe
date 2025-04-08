import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

// --- Pre-emptive Mocks (Run before module imports) ---
const mockCypressEnv = {
  verifiedUsername: "testUserVerified",
  unverifiedUsername: "testUserUnverified",
  noPostsUsername: "testUserNoPosts",
};
vi.mock("fs", () => ({
  readFileSync: vi.fn().mockReturnValue(JSON.stringify(mockCypressEnv)), // Mock fs readFileSync globally first
}));

// Mock env vars needed by seedUtils during import
process.env.NEXT_PUBLIC_STREAM_KEY = "test_key";
process.env.STREAM_SECRET = "test_secret";

// --- Regular Mocks ---
vi.mock("@prisma/client", () => {
  // Mock all necessary deleteMany and findMany methods
  const mockPrisma = {
    user: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    event: { deleteMany: vi.fn() },
    post: { deleteMany: vi.fn() },
    comment: { deleteMany: vi.fn() },
    like: { deleteMany: vi.fn() },
    dislike: { deleteMany: vi.fn() },
    bookmark: { deleteMany: vi.fn() },
    groupMember: { deleteMany: vi.fn() },
    eventAttendee: { deleteMany: vi.fn() },
    notification: { deleteMany: vi.fn() },
    follow: { deleteMany: vi.fn() },
    $disconnect: vi.fn(),
  };
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

// Define the mock instance for StreamChat
const mockStreamChatInstance = {
  queryUsers: vi.fn(),
  deleteUser: vi.fn(),
};
vi.mock("stream-chat", () => ({
  StreamChat: {
    getInstance: vi.fn(() => mockStreamChatInstance),
  },
}));

vi.mock("dotenv", () => ({ config: vi.fn() }));

vi.mock("path", () => ({
  resolve: (...args: any[]) => args.join("/"), // Simple mock
  dirname: (p: string) => p.substring(0, p.lastIndexOf("/")),
}));

// --- Test Suite --- //

// Dynamically import the module *after* mocks are set up
const { deleteTestUsers, deleteTestUsersFromStreamChat } = await import(
  "./seedDeletion.mjs"
);
// Don't need to import fs again as it's mocked
const { PrismaClient } = await import("@prisma/client");

// Get mock instances
const prismaMock = new PrismaClient();
// Use the mock instance variable directly
const streamChatMock = mockStreamChatInstance;

describe("prisma/seedDeletion", () => {
  // Use the same mock env data defined above
  const mockUserIds = ["id_verified", "id_unverified", "id_noposts"];

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Reset mocks to default *successful* states
    (prismaMock.user.findMany as Mock).mockResolvedValue([
      { id: mockUserIds[0] },
      { id: mockUserIds[1] },
      { id: mockUserIds[2] },
    ]);
    Object.values(prismaMock).forEach((model: any) => {
      if (model && typeof model.deleteMany === "function") {
        (model.deleteMany as Mock).mockResolvedValue({ count: 1 });
      }
    });

    (streamChatMock.queryUsers as Mock).mockResolvedValue({
      users: mockUserIds.map((id) => ({ id })),
    });
    (streamChatMock.deleteUser as Mock).mockResolvedValue({});

    // Ensure env vars are set for tests that might clear them
    process.env.NEXT_PUBLIC_STREAM_KEY = "test_key";
    process.env.STREAM_SECRET = "test_secret";
  });

  // No afterEach needed now as env vars are set before import

  // --- deleteTestUsers Tests --- //
  describe("deleteTestUsers", () => {
    it("should call findMany with correct username patterns", async () => {
      await deleteTestUsers(prismaMock); // Pass prismaMock
      expect(prismaMock.user.findMany).toHaveBeenCalledOnce();
      const findArgs = (prismaMock.user.findMany as Mock).mock.calls[0][0];
      expect(findArgs.where.OR).toEqual(
        expect.arrayContaining([
          { username: { contains: "testUserVerified" } },
          { username: { contains: "testUserUnverified" } },
          { username: { contains: "testUserNoPosts" } },
        ]),
      );
      expect(findArgs.select).toEqual({ id: true });
    });

    it("should call deleteMany for all related entities and users if users found", async () => {
      await deleteTestUsers(prismaMock); // Pass prismaMock

      const expectedWhere = { where: { id: { in: mockUserIds } } };
      const expectedRelatedWhereUser = {
        where: { userId: { in: mockUserIds } },
      };
      const expectedRelatedWhereCreator = {
        where: { createdById: { in: mockUserIds } },
      };
      const expectedRelatedWhereNotification = {
        where: {
          OR: [
            { recipientId: { in: mockUserIds } },
            { issuerId: { in: mockUserIds } },
          ],
        },
      };
      const expectedRelatedWhereFollow = {
        where: {
          OR: [
            { followerId: { in: mockUserIds } },
            { followingId: { in: mockUserIds } },
          ],
        },
      };

      expect(prismaMock.event.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereCreator,
      );
      expect(prismaMock.post.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereUser,
      );
      expect(prismaMock.comment.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereUser,
      );
      expect(prismaMock.like.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereUser,
      );
      expect(prismaMock.dislike.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereUser,
      );
      expect(prismaMock.bookmark.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereUser,
      );
      expect(prismaMock.groupMember.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereUser,
      );
      expect(prismaMock.eventAttendee.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereUser,
      );
      expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereNotification,
      );
      expect(prismaMock.follow.deleteMany).toHaveBeenCalledWith(
        expectedRelatedWhereFollow,
      );
      // Check user deleteMany is called last (or at least after others)
      expect(prismaMock.user.deleteMany).toHaveBeenCalledWith(expectedWhere);
    });

    it("should return the list of deleted user IDs", async () => {
      const result = await deleteTestUsers(prismaMock); // Pass prismaMock
      expect(result).toEqual(mockUserIds);
    });

    it("should not call deleteMany if no users are found", async () => {
      (prismaMock.user.findMany as Mock).mockResolvedValue([]);
      await deleteTestUsers(prismaMock); // Pass prismaMock

      expect(prismaMock.event.deleteMany).not.toHaveBeenCalled();
      expect(prismaMock.post.deleteMany).not.toHaveBeenCalled();
      expect(prismaMock.user.deleteMany).not.toHaveBeenCalled();
      // ... check other deleteMany calls ...
    });

    it("should return an empty array if no users are found", async () => {
      (prismaMock.user.findMany as Mock).mockResolvedValue([]);
      const result = await deleteTestUsers(prismaMock); // Pass prismaMock
      expect(result).toEqual([]);
    });
  });

  // --- deleteTestUsersFromStreamChat Tests --- //
  describe("deleteTestUsersFromStreamChat", () => {
    it("should call queryUsers with the provided user IDs", async () => {
      await deleteTestUsersFromStreamChat(streamChatMock, mockUserIds); // Pass streamChatMock
      expect(streamChatMock.queryUsers).toHaveBeenCalledWith({
        id: { $in: mockUserIds },
      });
    });

    it("should call deleteUser for each user found in StreamChat", async () => {
      await deleteTestUsersFromStreamChat(streamChatMock, mockUserIds); // Pass streamChatMock
      expect(streamChatMock.deleteUser).toHaveBeenCalledTimes(
        mockUserIds.length,
      );
      expect(streamChatMock.deleteUser).toHaveBeenCalledWith(mockUserIds[0], {
        hardDelete: true,
      });
      expect(streamChatMock.deleteUser).toHaveBeenCalledWith(mockUserIds[1], {
        hardDelete: true,
      });
      expect(streamChatMock.deleteUser).toHaveBeenCalledWith(mockUserIds[2], {
        hardDelete: true,
      });
    });

    it("should not call queryUsers or deleteUser if no IDs are provided", async () => {
      await deleteTestUsersFromStreamChat(streamChatMock, []); // Pass streamChatMock
      expect(streamChatMock.queryUsers).not.toHaveBeenCalled();
      expect(streamChatMock.deleteUser).not.toHaveBeenCalled();
    });

    it("should not call deleteUser if queryUsers finds no users", async () => {
      (streamChatMock.queryUsers as Mock).mockResolvedValue({ users: [] });
      await deleteTestUsersFromStreamChat(streamChatMock, mockUserIds); // Pass streamChatMock
      expect(streamChatMock.queryUsers).toHaveBeenCalledOnce();
      expect(streamChatMock.deleteUser).not.toHaveBeenCalled();
    });

    it("should skip deletion and warn if Stream client is null (keys were missing)", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      // Simulate streamChatClient being null by passing null
      await deleteTestUsersFromStreamChat(null, mockUserIds);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Stream Chat client is not available. Skipping Stream Chat user deletion.",
      );
      // No streamChatMock methods should be called if client is null
      expect(streamChatMock.queryUsers).not.toHaveBeenCalled();
      expect(streamChatMock.deleteUser).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
