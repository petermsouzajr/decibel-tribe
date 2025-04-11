import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/clear-uploads/route";
import prisma from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

// --- Mocks ---
// Define mocks used across multiple modules/tests if needed, but initialize prisma mocks inside its factory
// const mockUtapiDeleteFiles = vi.fn(); // Moved inside its mock factory

vi.mock("@/lib/prisma", () => {
  // Define mocks specific to this module inside the factory
  const mockMediaFindMany = vi.fn();
  const mockMediaDeleteMany = vi.fn();
  return {
    __esModule: true, // Required for ES modules
    default: {
      media: {
        findMany: mockMediaFindMany,
        deleteMany: mockMediaDeleteMany,
      },
      // Add other prisma models/methods if needed by the route, mocked similarly
    },
    // Export the mocks so they can be referenced in tests if necessary
    _mockMediaFindMany: mockMediaFindMany,
    _mockMediaDeleteMany: mockMediaDeleteMany,
  };
});

// Mock UTApi constructor and its deleteFiles method
vi.mock("uploadthing/server", () => {
  const mockUtapiDeleteFiles = vi.fn();
  return {
    __esModule: true,
    UTApi: vi.fn(() => ({
      deleteFiles: mockUtapiDeleteFiles,
    })),
    _mockUtapiDeleteFiles: mockUtapiDeleteFiles,
  };
});

// --- Test Suite ---
describe("API Route: GET /api/clear-uploads", () => {
  const cronSecret = "test-cron-secret";
  const correctAuthHeader = `Bearer ${cronSecret}`;
  const incorrectAuthHeader = "Bearer wrong-secret";
  const uploadthingAppId = "test_app_id";
  const twentyFourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);

  beforeEach(async () => {
    // Import the mocks *after* vi.mock has run
    const { _mockMediaFindMany, _mockMediaDeleteMany } = (await import(
      "@/lib/prisma"
    )) as any;
    const { _mockUtapiDeleteFiles } = (await import(
      "uploadthing/server"
    )) as any;

    vi.useFakeTimers();
    vi.setSystemTime(new Date());

    vi.resetAllMocks();
    // Need to reset the imported mocks as well
    _mockMediaFindMany.mockClear();
    _mockMediaDeleteMany.mockClear();
    _mockUtapiDeleteFiles.mockClear(); // Clear this mock too

    process.env.CRON_SECRET = cronSecret;
    process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID = uploadthingAppId;

    // Reset UTApi mock constructor calls
    // We now mock the module, so need to get the constructor from the mock
    const { UTApi } = (await import("uploadthing/server")) as any;
    (UTApi as ReturnType<typeof vi.fn>).mockClear();

    // Default mocks (no unused media)
    _mockMediaFindMany.mockResolvedValue([]);
    _mockUtapiDeleteFiles.mockResolvedValue({ success: true }); // Mock success
    _mockMediaDeleteMany.mockResolvedValue({ count: 0 });
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID;
    vi.unstubAllEnvs(); // Unstub any environment variables mocked in tests
    vi.useRealTimers();
  });

  // Helper to create request
  const createRequest = (authHeader?: string) => {
    const headers = new Headers();
    if (authHeader) {
      headers.set("Authorization", authHeader);
    }
    return new NextRequest("http://localhost/api/clear-uploads", { headers });
  };

  // --- Authentication Tests ---
  it("should return 401 if Authorization header is missing", async () => {
    const { _mockMediaFindMany } = (await import("@/lib/prisma")) as any;
    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Invalid authorization header");
    expect(_mockMediaFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 if Authorization header is incorrect", async () => {
    const { _mockMediaFindMany } = (await import("@/lib/prisma")) as any;
    const request = createRequest(incorrectAuthHeader);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Invalid authorization header");
    expect(_mockMediaFindMany).not.toHaveBeenCalled();
  });

  // --- Functionality Tests ---
  it("should query media with only postId: null when NODE_ENV is not production", async () => {
    const { _mockMediaFindMany } = (await import("@/lib/prisma")) as any;
    vi.stubEnv("NODE_ENV", "development"); // Stub NODE_ENV for this test
    const request = createRequest(correctAuthHeader);
    await GET(request);

    expect(_mockMediaFindMany).toHaveBeenCalledTimes(1);
    expect(_mockMediaFindMany).toHaveBeenCalledWith({
      where: {
        postId: null,
      },
      select: {
        id: true,
        url: true,
      },
    });
  });

  it("should query media with postId: null and createdAt filter when NODE_ENV is production", async () => {
    const { _mockMediaFindMany } = (await import("@/lib/prisma")) as any;
    vi.stubEnv("NODE_ENV", "production"); // Stub NODE_ENV for this test
    const request = createRequest(correctAuthHeader);
    await GET(request);

    expect(_mockMediaFindMany).toHaveBeenCalledTimes(1);
    expect(_mockMediaFindMany).toHaveBeenCalledWith({
      where: {
        postId: null,
        createdAt: {
          lte: expect.any(Date), // Check it's a date
          // lte: expect.closeToTime(twentyFourHoursAgo) // Optional: More precise check
        },
      },
      select: {
        id: true,
        url: true,
      },
    });
  });

  it("should not call deleteFiles or deleteMany if no unused media found", async () => {
    const { _mockMediaFindMany, _mockMediaDeleteMany } = (await import(
      "@/lib/prisma"
    )) as any;
    const { _mockUtapiDeleteFiles } = (await import(
      "uploadthing/server"
    )) as any;
    const { UTApi } = (await import("uploadthing/server")) as any; // Import mocked UTApi
    _mockMediaFindMany.mockResolvedValue([]);
    const request = createRequest(correctAuthHeader);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(""); // Expect empty body for `new Response()`
    expect(_mockUtapiDeleteFiles).not.toHaveBeenCalled();
    expect(_mockMediaDeleteMany).not.toHaveBeenCalled();
  });

  it("should call deleteFiles and deleteMany with correct args if unused media found", async () => {
    const { _mockMediaFindMany, _mockMediaDeleteMany } = (await import(
      "@/lib/prisma"
    )) as any;
    const { _mockUtapiDeleteFiles } = (await import(
      "uploadthing/server"
    )) as any;
    const { UTApi } = (await import("uploadthing/server")) as any; // Import mocked UTApi
    const unusedMedia = [
      {
        id: "media1",
        url: `https://uploadthing.com/a/${uploadthingAppId}/file_key_1.jpg`,
      },
      {
        id: "media2",
        url: `https://uploadthing.com/a/${uploadthingAppId}/file_key_2.png`,
      }, // Test different URL format
    ];
    const expectedKeys = ["file_key_1.jpg", "file_key_2.png"];
    const expectedIds = ["media1", "media2"];

    _mockMediaFindMany.mockResolvedValue(unusedMedia);
    _mockUtapiDeleteFiles.mockResolvedValue({ success: true }); // Mock UTApi success
    _mockMediaDeleteMany.mockResolvedValue({ count: unusedMedia.length }); // Mock Prisma success

    const request = createRequest(correctAuthHeader);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");

    // Verify UTApi call
    // expect(UTApi).toHaveBeenCalledTimes(1); // Constructor called at module load, not here
    expect(_mockUtapiDeleteFiles).toHaveBeenCalledTimes(1);
    expect(_mockUtapiDeleteFiles).toHaveBeenCalledWith(expectedKeys);

    // Verify Prisma delete call
    expect(_mockMediaDeleteMany).toHaveBeenCalledTimes(1);
    expect(_mockMediaDeleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: expectedIds,
        },
      },
    });
  });

  // --- Error Handling ---
  it("should return 500 if prisma.media.findMany fails", async () => {
    const { _mockMediaFindMany, _mockMediaDeleteMany } = (await import(
      "@/lib/prisma"
    )) as any;
    const { UTApi } = (await import("uploadthing/server")) as any; // Import mocked UTApi
    const dbError = new Error("FindMany failed");
    _mockMediaFindMany.mockRejectedValue(dbError);
    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(UTApi).not.toHaveBeenCalled();
    expect(_mockMediaDeleteMany).not.toHaveBeenCalled();
  });

  it("should return 500 if utapi.deleteFiles fails", async () => {
    const { _mockMediaFindMany, _mockMediaDeleteMany } = (await import(
      "@/lib/prisma"
    )) as any;
    const { _mockUtapiDeleteFiles } = (await import(
      "uploadthing/server"
    )) as any;
    const { UTApi } = (await import("uploadthing/server")) as any; // Import mocked UTApi
    const unusedMedia = [
      {
        id: "media1",
        url: `https://uploadthing.com/a/${uploadthingAppId}/file_key_1.jpg`,
      },
    ];
    _mockMediaFindMany.mockResolvedValue(unusedMedia);
    const uploadError = new Error("UTApi failed");
    _mockUtapiDeleteFiles.mockRejectedValue(uploadError);

    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    // expect(UTApi).toHaveBeenCalledTimes(1); // Constructor called at module load
    expect(_mockUtapiDeleteFiles).toHaveBeenCalledTimes(1); // Check if the method was called
    expect(_mockMediaDeleteMany).not.toHaveBeenCalled(); // Should not attempt DB delete if UT fails
  });

  it("should return 500 if prisma.media.deleteMany fails", async () => {
    const { _mockMediaFindMany, _mockMediaDeleteMany } = (await import(
      "@/lib/prisma"
    )) as any;
    const { _mockUtapiDeleteFiles } = (await import(
      "uploadthing/server"
    )) as any;
    const unusedMedia = [
      {
        id: "media1",
        url: `https://uploadthing.com/a/${uploadthingAppId}/file_key_1.jpg`,
      },
    ];
    _mockMediaFindMany.mockResolvedValue(unusedMedia);
    _mockUtapiDeleteFiles.mockResolvedValue({ success: true });
    const dbError = new Error("DeleteMany failed");
    _mockMediaDeleteMany.mockRejectedValue(dbError);

    const request = createRequest(correctAuthHeader);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
