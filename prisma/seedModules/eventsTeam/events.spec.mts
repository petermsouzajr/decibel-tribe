import { describe, it, expect, vi, beforeEach, Mock, afterEach } from "vitest";
import { Prisma } from "@prisma/client";

// --- Mocks ---
const mockFakerLoremWords = vi.fn();
const mockFakerLoremParagraph = vi.fn();
const mockFakerLocationCity = vi.fn();
const mockFakerInternetUrl = vi.fn();
// Use a single mock for date.between
const mockFakerDateBetween = vi.fn();
const mockFakerDatatypeBoolean = vi.fn();
const mockFakerHelpersShuffle = vi.fn((arr) => arr);
const mockFakerHelpersArrayElement = vi.fn();
const mockGenerateId = vi.fn();
const mockAccountDataGenerator = vi.fn();

// Mock seedUtils dependencies
vi.mock("../../seedUtils.mjs", () => ({
  faker: {
    lorem: {
      words: mockFakerLoremWords,
      paragraph: mockFakerLoremParagraph,
    },
    location: { city: mockFakerLocationCity },
    internet: { url: mockFakerInternetUrl },
    // Point to the single mock
    date: { between: mockFakerDateBetween },
    datatype: { boolean: mockFakerDatatypeBoolean },
    helpers: {
      shuffle: mockFakerHelpersShuffle,
      arrayElement: mockFakerHelpersArrayElement,
    },
  },
  generateIdFromEntropySize: mockGenerateId,
  accountDataGenerator: mockAccountDataGenerator,
}));

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  event: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import the function to test *after* mocks are set up
const { seedEvents } = await import("./events.mjs");

describe("EventsTeam - seedEvents Module", () => {
  const mockUsers = [
    { id: "user1", username: "UserOne", createdAt: new Date("2023-01-01") },
    { id: "user2", username: "UserTwo", createdAt: new Date("2023-01-05") },
    { id: "user3", username: "UserThree", createdAt: new Date("2023-01-10") },
    { id: "user4", username: "UserFour", createdAt: new Date("2023-01-15") },
    { id: "user5", username: "UserFive", createdAt: new Date("2023-01-20") },
  ];
  const mockEventId = "mock_event_id";
  const mockEventWhenDate = new Date("2023-04-15T00:00:00.000Z");
  const mockEventStartDate = new Date("2023-04-15T10:00:00.000Z");
  const mockEventEndDate = new Date("2023-04-15T14:00:00.000Z");
  const mockEventCreatedDate = new Date("2023-02-20T00:00:00.000Z");
  const mockStartTimeString = "10:00";
  const mockEndTimeString = "14:00";

  beforeEach(() => {
    vi.clearAllMocks();

    (mockPrismaClient.event.createMany as Mock).mockResolvedValue({
      count: 10,
    });
    mockAccountDataGenerator.mockReturnValue(5); // 5 events per user
    mockGenerateId.mockReturnValue(mockEventId);
    mockFakerLoremWords.mockReturnValue("Mock Event Title");
    mockFakerLocationCity.mockReturnValue("Mock City");
    mockFakerLoremParagraph.mockReturnValue("Mock description.");
    mockFakerInternetUrl.mockReturnValue("http://mock.url");
    mockFakerDatatypeBoolean.mockReturnValue(false); // isCancelled

    // Mock date.between calls sequentially for each event generation
    // Loop runs twice (user1, user5), generating 5 events each time (10 total)
    // Each event generation calls date.between 4 times (when, start, end, createdAt)
    (mockFakerDateBetween as Mock)
      // User 1, Event 1
      .mockReturnValueOnce(mockEventWhenDate) // when
      .mockReturnValueOnce(mockEventStartDate) // startTime
      .mockReturnValueOnce(mockEventEndDate) // endTime
      .mockReturnValueOnce(mockEventCreatedDate) // createdAt
      // User 1, Event 2
      .mockReturnValueOnce(mockEventWhenDate)
      .mockReturnValueOnce(mockEventStartDate)
      .mockReturnValueOnce(mockEventEndDate)
      .mockReturnValueOnce(mockEventCreatedDate)
      // User 1, Event 3
      .mockReturnValueOnce(mockEventWhenDate)
      .mockReturnValueOnce(mockEventStartDate)
      .mockReturnValueOnce(mockEventEndDate)
      .mockReturnValueOnce(mockEventCreatedDate)
      // User 1, Event 4
      .mockReturnValueOnce(mockEventWhenDate)
      .mockReturnValueOnce(mockEventStartDate)
      .mockReturnValueOnce(mockEventEndDate)
      .mockReturnValueOnce(mockEventCreatedDate)
      // User 1, Event 5
      .mockReturnValueOnce(mockEventWhenDate)
      .mockReturnValueOnce(mockEventStartDate)
      .mockReturnValueOnce(mockEventEndDate)
      .mockReturnValueOnce(mockEventCreatedDate)
      // User 5, Event 1
      .mockReturnValueOnce(mockEventWhenDate)
      .mockReturnValueOnce(mockEventStartDate)
      .mockReturnValueOnce(mockEventEndDate)
      .mockReturnValueOnce(mockEventCreatedDate)
      // User 5, Event 2
      .mockReturnValueOnce(mockEventWhenDate)
      .mockReturnValueOnce(mockEventStartDate)
      .mockReturnValueOnce(mockEventEndDate)
      .mockReturnValueOnce(mockEventCreatedDate)
      // User 5, Event 3
      .mockReturnValueOnce(mockEventWhenDate)
      .mockReturnValueOnce(mockEventStartDate)
      .mockReturnValueOnce(mockEventEndDate)
      .mockReturnValueOnce(mockEventCreatedDate)
      // User 5, Event 4
      .mockReturnValueOnce(mockEventWhenDate)
      .mockReturnValueOnce(mockEventStartDate)
      .mockReturnValueOnce(mockEventEndDate)
      .mockReturnValueOnce(mockEventCreatedDate)
      // User 5, Event 5
      .mockReturnValueOnce(mockEventWhenDate)
      .mockReturnValueOnce(mockEventStartDate)
      .mockReturnValueOnce(mockEventEndDate)
      .mockReturnValueOnce(mockEventCreatedDate);

    // Mock arrayElement to return specific values matching implementation calls
    // Needs 5 status/visibility pairs for user1, 5 for user5 = 20 calls total
    (mockFakerHelpersArrayElement as Mock)
      // User 1
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC") // Event 1
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC") // Event 2
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC") // Event 3
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC") // Event 4
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC") // Event 5
      // User 5
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC") // Event 6
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC") // Event 7
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC") // Event 8
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC") // Event 9
      .mockReturnValueOnce("DRAFT")
      .mockReturnValueOnce("PUBLIC"); // Event 10

    // Mock shuffle to return a predictable order for performers
    mockFakerHelpersShuffle.mockImplementation((arr) => arr.slice(0, 2)); // Return first 2
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call prisma.event.createMany with correct data structure", async () => {
    await seedEvents(mockPrismaClient as any, mockUsers);

    expect(mockPrismaClient.event.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.event.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.EventCreateManyInput[] = createArgs.data;

    expect(createdData.length).toBe(10);

    // Check structure matching implementation output & updated mocks
    expect(createdData[0]).toEqual({
      id: mockEventId,
      title: "Mock Event Title",
      location: "Mock City",
      description: "Mock description.",
      url: "http://mock.url",
      when: mockEventWhenDate,
      startTime: mockStartTimeString,
      endTime: mockEndTimeString,
      performers: ["Performer1", "Performer2"],
      createdById: "user1",
      isCancelled: false,
      status: "DRAFT", // Now correctly mocked
      visibility: "PUBLIC", // Now correctly mocked
      createdAt: mockEventCreatedDate, // Now correctly mocked
    });
  });

  it("should call accountDataGenerator with correct arguments", async () => {
    await seedEvents(mockPrismaClient as any, mockUsers);

    expect(mockAccountDataGenerator).toHaveBeenCalledTimes(2);
    // Corrected assertion arguments
    expect(mockAccountDataGenerator).toHaveBeenCalledWith(
      "random",
      1, // userQuantity is 1 in implementation
      50, // factor is 50 in implementation
    );
    expect(mockAccountDataGenerator).toHaveBeenNthCalledWith(
      2,
      "random",
      1,
      50,
    );
  });

  it("should return created event data matching implementation", async () => {
    const result = await seedEvents(mockPrismaClient as any, mockUsers);

    expect(result.length).toBe(10);
    expect(result[0]).toEqual({
      id: mockEventId,
      createdById: "user1",
      isCancelled: false,
      createdAt: mockEventCreatedDate, // Expect correct date
    });
  });

  it("should return empty array if no users provided", async () => {
    const result = await seedEvents(mockPrismaClient as any, []);
    expect(result).toEqual([]);
    expect(mockPrismaClient.event.createMany).not.toHaveBeenCalled();
  });

  it("should return empty array and log error if prisma create fails", async () => {
    const dbError = new Error("DB Event Write Failed");
    (mockPrismaClient.event.createMany as Mock).mockRejectedValue(dbError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await seedEvents(mockPrismaClient as any, mockUsers);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating events in DB:",
      dbError,
    );
    consoleErrorSpy.mockRestore();
  });
});
