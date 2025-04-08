import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockFakerCompany = vi.fn();
const mockFakerLorem = vi.fn();
const mockFakerDate = vi.fn();
const mockAccountDataGenerator = vi.fn();
const mockGenerateId = vi.fn();
const mockFakerNumberInt = vi.fn();

vi.mock("../../seedUtils.mjs", () => ({
  faker: {
    company: { name: mockFakerCompany },
    lorem: { sentence: mockFakerLorem },
    date: { between: mockFakerDate },
    number: { int: mockFakerNumberInt },
  },
  generateIdFromEntropySize: mockGenerateId,
  accountDataGenerator: mockAccountDataGenerator,
}));

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  group: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import the function to test *after* mocks are set up
const { seedGroups } = await import("./groups.mjs");

describe("GroupsTeam - seedGroups Module", () => {
  const mockUsers = [
    { id: "user1", username: "UserOne", createdAt: new Date("2023-01-01") },
    { id: "user2", username: "UserTwo", createdAt: new Date("2023-02-01") },
  ];
  const mockGroupId = "mock_group_id";
  const mockGroupName = "Mock Group Inc.";
  const mockGroupDesc = "A mock group description.";
  const mockGroupDate = new Date("2023-03-01");

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock implementations
    (mockPrismaClient.group.createMany as Mock).mockResolvedValue({ count: 2 });
    mockFakerCompany.mockReturnValue(mockGroupName);
    mockFakerLorem.mockReturnValue(mockGroupDesc);
    mockFakerDate.mockReturnValue(mockGroupDate);
    mockGenerateId.mockReturnValue(mockGroupId);
    mockFakerNumberInt.mockReturnValue(1);
  });

  it("should call prisma.group.createMany with correct data structure", async () => {
    await seedGroups(mockPrismaClient as any, mockUsers);

    expect(mockPrismaClient.group.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.group.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.GroupCreateManyInput[] = createArgs.data;

    expect(createdData).toHaveLength(mockUsers.length);

    // Check structure for the first user
    expect(createdData[0]).toEqual({
      id: mockGroupId,
      name: mockGroupName,
      description: mockGroupDesc,
      ownerId: mockUsers[0].id,
      createdAt: mockGroupDate,
    });

    // Check owner for the second user
    expect(createdData[1].ownerId).toBe(mockUsers[1].id);
  });

  it("should call accountDataGenerator for each eligible user", async () => {
    await seedGroups(mockPrismaClient as any, mockUsers);
    expect(mockAccountDataGenerator).not.toHaveBeenCalled();
    expect(mockFakerNumberInt).toHaveBeenCalledTimes(mockUsers.length);
    expect(mockFakerNumberInt).toHaveBeenCalledWith({ min: 0, max: 3 });
  });

  it("should generate multiple groups if faker.number.int returns > 1", async () => {
    mockFakerNumberInt.mockReturnValue(3);
    await seedGroups(mockPrismaClient as any, mockUsers);

    expect(mockPrismaClient.group.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.group.createMany as Mock).mock
      .calls[0][0];
    expect(createArgs.data).toHaveLength(mockUsers.length * 3);
    expect(mockGenerateId).toHaveBeenCalledTimes(mockUsers.length * 3);
  });

  it("should return created group data", async () => {
    const result = await seedGroups(mockPrismaClient as any, mockUsers);

    expect(result).toHaveLength(mockUsers.length);
    expect(result[0]).toEqual({
      id: mockGroupId,
      ownerId: mockUsers[0].id,
      createdAt: mockGroupDate,
    });
  });

  it("should return empty array and not call createMany if no users provided", async () => {
    const result = await seedGroups(mockPrismaClient as any, []);
    expect(result).toEqual([]);
    expect(mockPrismaClient.group.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array and log error if prisma create fails", async () => {
    const dbError = new Error("DB Group Write Failed");
    (mockPrismaClient.group.createMany as Mock).mockRejectedValue(dbError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedGroups(mockPrismaClient as any, mockUsers);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating groups in DB:",
      dbError,
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return empty array if prisma client is unavailable", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = await seedGroups(null as any, mockUsers);
    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Prisma client is not available for seedGroups.",
    );
    consoleErrorSpy.mockRestore();
  });
});
