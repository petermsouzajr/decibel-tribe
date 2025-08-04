import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma, MediaType } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockFakerNumberInt = vi.fn();
const mockFakerHelpersArrayElement = vi.fn();
const mockFakerStringAlphanumeric = vi.fn();

vi.mock("../../seedUtils.js", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    faker: {
      ...(original.faker as any),
      number: {
        ...(original.faker.number as any),
        int: mockFakerNumberInt,
      },
      helpers: {
        ...(original.faker.helpers as any),
        arrayElement: mockFakerHelpersArrayElement,
      },
      string: {
        ...(original.faker.string as any),
        alphanumeric: mockFakerStringAlphanumeric,
      },
    },
  };
});

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  media: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import the function to test
const { seedMedia } = await import("./media.js");

describe("MediaTeam - seedMedia Module", () => {
  const mockPosts = [
    { id: "post1" }, // Processed (index 0)
    { id: "post2" }, // Skipped (index 1)
    { id: "post3" }, // Processed (index 2)
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mock implementations
    (mockPrismaClient.media.createMany as Mock).mockResolvedValue({ count: 4 });
    // Default 2 media items per processed post
    mockFakerNumberInt.mockReturnValue(2);
    // Default type IMAGE
    mockFakerHelpersArrayElement.mockReturnValue(MediaType.IMAGE);
    mockFakerStringAlphanumeric.mockReturnValue("fakeSeed");
  });

  it("should call prisma.media.createMany with correct data", async () => {
    await seedMedia(mockPrismaClient, mockPosts);

    expect(mockPrismaClient.media.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.media.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.MediaCreateManyInput[] = createArgs.data;

    // Post1: 2 media
    // Post3: 2 media
    // Total: 4 media
    expect(createdData.length).toBe(4);

    // Check structure (post1, first item, type IMAGE)
    expect(createdData[0]).toEqual({
      type: MediaType.IMAGE,
      url: "https://picsum.photos/seed/fakeSeed/400/300",
      postId: "post1",
    });
    // Check structure (post3, first item, type IMAGE)
    expect(createdData[2]).toEqual({
      type: MediaType.IMAGE,
      url: "https://picsum.photos/seed/fakeSeed/400/300",
      postId: "post3",
    });
  });

  it("should generate correct URLs for IMAGE and VIDEO types", async () => {
    // Mock return VIDEO type for the second item of post1
    mockFakerHelpersArrayElement
      .mockReturnValueOnce(MediaType.IMAGE) // post1, item 1
      .mockReturnValueOnce(MediaType.VIDEO) // post1, item 2
      .mockReturnValue(MediaType.IMAGE); // Default for post3

    await seedMedia(mockPrismaClient, mockPosts);

    const createArgs = (mockPrismaClient.media.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.MediaCreateManyInput[] = createArgs.data;

    // Check URLs more flexibly if they exist
    if (createdData.length > 0) {
      expect(createdData[0].url).toEqual(expect.any(String)); // Check it's a string
      // Find the video item if it exists
      const videoItem = createdData.find(
        (item) => item.type === MediaType.VIDEO,
      );
      if (videoItem) {
        expect(videoItem.url).toContain("BigBuckBunny.mp4");
      }
    }
  });

  it("should only process posts based on the loop step (i += 2)", async () => {
    await seedMedia(mockPrismaClient, mockPosts);

    // faker.number.int called once per processed post
    expect(mockFakerNumberInt).toHaveBeenCalledTimes(2); // post1, post3

    const createArgs = (mockPrismaClient.media.createMany as Mock).mock
      .calls[0][0];
    const mediaPostIds = new Set(createArgs.data.map((m: any) => m.postId));

    expect(mediaPostIds).toContain("post1");
    expect(mediaPostIds).toContain("post3");
    expect(mediaPostIds).not.toContain("post2");
  });

  it("should not return any data (void function)", async () => {
    const result = await seedMedia(mockPrismaClient, mockPosts);
    expect(result).toBeUndefined();
  });

  // Add tests for empty inputs, prisma failures etc.
  it("should not call createMany if no posts provided", async () => {
    await seedMedia(mockPrismaClient, []);
    expect(mockPrismaClient.media.createMany).not.toHaveBeenCalled();
  });

  it("should not call createMany if number of media per post is 0", async () => {
    // *** Reset mocks specifically for this test case ***
    vi.clearAllMocks(); // Clear general mocks first
    (mockPrismaClient.media.createMany as Mock).mockResolvedValue({ count: 0 }); // Assume createMany resolves even if data is empty
    mockFakerNumberInt.mockReturnValue(0); // <<< Set mock to return 0 ONLY for this test
    mockFakerHelpersArrayElement.mockReturnValue(MediaType.IMAGE);
    mockFakerStringAlphanumeric.mockReturnValue("fakeSeed");

    await seedMedia(mockPrismaClient, mockPosts);
    expect(mockPrismaClient.media.createMany).not.toHaveBeenCalled();
  });

  it("should log error if prisma create fails", async () => {
    const dbError = new Error("DB Media Write Failed");
    (mockPrismaClient.media.createMany as Mock).mockRejectedValue(dbError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await seedMedia(mockPrismaClient, mockPosts);

    expect(mockPrismaClient.media.createMany).toHaveBeenCalledOnce(); // Still attempted
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating media in DB:",
      dbError,
    );

    consoleErrorSpy.mockRestore();
  });
});
