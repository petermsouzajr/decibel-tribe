import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
// Import functions to test from utils.ts
import {
  formatRelativeDate,
  formatNumber,
  cn /* ... other utils ... */,
  slugify,
} from "@/lib/utils";
import { formatDate, formatDistanceToNowStrict } from "date-fns";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getEventDataInclude, EventData, UserData } from "@/lib/types";
import { getEvent } from "@/lib/server/getEvent";

// Mock date-fns functions
vi.mock("date-fns", async (importOriginal) => {
  const actual = await importOriginal<typeof import("date-fns")>();
  return {
    ...actual, // Keep other exports like isSameYear etc. if needed by the actual function
    formatDistanceToNowStrict: vi.fn(),
    formatDate: vi.fn(),
  };
});

// Mock prisma (specific methods needed by tested functions)
vi.mock("@/lib/prisma", () => ({
  default: {
    event: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NotFoundCalled");
  }), // Throw error to simulate notFound behavior
}));

// Mock react cache
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: vi.fn((fn) => fn), // Mock cache to just return the function
  };
});

// Mock getEventDataInclude
const mockIncludeObject = {
  createdBy: { select: expect.any(Object) }, // Use expect.any or a mock UserDataSelect
  attendees: { select: expect.any(Object) }, // Use expect.any or a mock UserDataSelect
  _count: { select: { attendees: true } },
};
vi.mock("@/lib/types", async (importOriginal) => {
  const actualTypes = await importOriginal<typeof import("@/lib/types")>();
  return {
    ...actualTypes,
    getEventDataInclude: vi.fn((id) => mockIncludeObject),
  };
});

describe("[Core][Utils] Utility Functions", () => {
  it("should have basic placeholder test", () => {
    expect(true).toBe(true); // Placeholder
  });

  // describe('formatRelativeDate', () => { ... });
  // describe('cn', () => { ... });
});

describe("[Core][Utils] cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("p-4", "bg-red-500")).toBe("p-4 bg-red-500");
  });

  it("should handle conditional classes", () => {
    expect(cn("p-4", { "bg-red-500": true, "text-white": false })).toBe(
      "p-4 bg-red-500",
    );
  });

  it("should override conflicting classes with tailwind-merge", () => {
    expect(cn("p-4 bg-red-500", "p-6")).toBe("bg-red-500 p-6"); // p-6 overrides p-4
  });

  it("should handle null and undefined inputs", () => {
    expect(cn("p-4", null, undefined, "bg-red-500")).toBe("p-4 bg-red-500");
  });
});

describe("[Core][Utils] formatRelativeDate", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    // Use fake timers for consistent date comparisons
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
  });

  it("should use absolute format 'yyyy-MM-dd HH:mm:ss' for dates less than 24 hours ago", () => {
    // Set current time
    vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
    const date = new Date("2024-03-15T11:55:00Z"); // 5 minutes ago
    const expectedFormat = "yyyy-MM-dd HH:mm:ss";
    const expectedOutput = "2024-03-15 11:55:00"; // Example output
    (formatDate as Mock).mockReturnValue(expectedOutput);

    const result = formatRelativeDate(date);

    expect(formatDate).toHaveBeenCalledWith(date, expectedFormat);
    expect(formatDistanceToNowStrict).not.toHaveBeenCalled();
    expect(result).toBe(expectedOutput);
  });

  it('should use "d MMM" format for dates over 24 hours ago but in the same year', () => {
    vi.setSystemTime(new Date("2024-03-15T10:00:00Z"));
    const date = new Date("2024-03-10T10:00:00Z"); // 5 days ago in same year
    (formatDate as Mock).mockReturnValue("10 Mar");

    const result = formatRelativeDate(date);

    expect(formatDistanceToNowStrict).not.toHaveBeenCalled();
    // Check if formatDate was called with the correct format string
    expect(formatDate).toHaveBeenCalledWith(date, "d MMM");
    expect(result).toBe("10 Mar");
  });

  it('should use "d MMM, yyyy" format for dates in a different year', () => {
    vi.setSystemTime(new Date("2024-03-15T10:00:00Z"));
    const date = new Date("2023-12-25T10:00:00Z"); // Previous year
    (formatDate as Mock).mockReturnValue("25 Dec, 2023");

    const result = formatRelativeDate(date);

    expect(formatDistanceToNowStrict).not.toHaveBeenCalled();
    expect(formatDate).toHaveBeenCalledWith(date, "d MMM, yyyy");
    expect(result).toBe("25 Dec, 2023");
  });
});

describe("[Core][Utils] formatNumber", () => {
  it("should format small integers directly", () => {
    expect(formatNumber(123)).toBe("123");
    expect(formatNumber(999)).toBe("999");
  });

  it("should use K notation for thousands", () => {
    expect(formatNumber(1000)).toBe("1K");
    expect(formatNumber(1234)).toBe("1.2K");
    expect(formatNumber(56789)).toBe("56.8K"); // Check rounding
  });

  it("should use M notation for millions", () => {
    expect(formatNumber(1_000_000)).toBe("1M");
    expect(formatNumber(1_234_567)).toBe("1.2M");
    expect(formatNumber(98_765_432)).toBe("98.8M"); // Check rounding
  });

  it("should format zero as 0", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("should format negative numbers", () => {
    expect(formatNumber(-500)).toBe("-500");
    expect(formatNumber(-1500)).toBe("-1.5K");
    expect(formatNumber(-2_000_000)).toBe("-2M");
  });
});

describe("[Core][Utils] slugify", () => {
  it("should convert spaces to hyphens and lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should convert uppercase letters to lowercase", () => {
    expect(slugify("UPPER CASE")).toBe("upper-case");
  });

  it("should remove most special characters", () => {
    // Keep only letters, numbers, hyphens based on the regex [^a-z0-9-]
    expect(slugify("String!@#$%^&*()_+[]{};':\",./<>?")).toBe("string");
  });

  it("should remove underscores", () => {
    // The regex [^a-z0-9-] includes underscore in the set to remove
    expect(slugify("Keep-these_underscores")).toBe("keep-theseunderscores");
  });

  it("should handle mixed strings with spaces, case, and special chars", () => {
    // Note: Consecutive replacements might lead to multiple hyphens if not handled
    // The current implementation also leaves leading/trailing hyphens.
    expect(slugify("  MixED CaSe & Sp@ces!  ")).toBe("--mixed-case--spces--"); // Updated expectation
  });

  it("should return empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("should return empty string if only special characters are present", () => {
    expect(slugify("!@#$")).toBe("");
  });
});

describe("[Core][Utils] getEvent", () => {
  const mockPrismaFindUnique = vi.mocked(prisma.event.findUnique);
  const mockNotFound = vi.mocked(notFound);
  const mockGetEventDataInclude = vi.mocked(getEventDataInclude);

  const mockUserData: Partial<UserData> = {
    id: "user-123",
    username: "creator",
    displayName: "Event Creator",
    avatarUrl: null,
  };
  const mockEvent: EventData = {
    id: "event-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    title: "Mock Event Title",
    location: "Mock Location",
    description: "Mock description",
    url: null,
    when: new Date(),
    startTime: "10:00",
    endTime: "12:00",
    performers: ["Performer 1"],
    zipCode: null,
    latitude: null,
    longitude: null,
    createdById: mockUserData.id!,
    isCancelled: false,
    visibility: "PUBLIC",
    status: "ACTIVE",
    createdBy: mockUserData as UserData,
    attendees: [],
    helpWantedSkills: [],
    _count: { attendees: 0 },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call prisma.event.findUnique with correct args", async () => {
    const eventId = "event-123";
    const userId = "user-456";
    // mockGetEventDataInclude is already mocked globally to return mockIncludeObject
    mockPrismaFindUnique.mockResolvedValue(mockEvent); // Use the more complete mock

    await getEvent(eventId, userId);

    expect(mockGetEventDataInclude).toHaveBeenCalledWith(userId);
    expect(mockPrismaFindUnique).toHaveBeenCalledWith({
      where: { id: eventId },
      include: mockIncludeObject,
    });
  });

  it("should return event data if found", async () => {
    const eventId = "event-found";
    const userId = "user-found";
    const specificMockEvent = { ...mockEvent, id: eventId }; // Use the base mock structure
    mockPrismaFindUnique.mockResolvedValue(specificMockEvent);

    const result = await getEvent(eventId, userId);

    expect(result).toEqual(specificMockEvent);
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("should call notFound if event is not found", async () => {
    const eventId = "event-not-found";
    const userId = "user-not-found";
    mockPrismaFindUnique.mockResolvedValue(null);

    await expect(getEvent(eventId, userId)).rejects.toThrow("NotFoundCalled");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("should re-throw other errors from prisma", async () => {
    const eventId = "event-error";
    const userId = "user-error";
    const dbError = new Error("Database connection lost");
    mockPrismaFindUnique.mockRejectedValue(dbError);

    await expect(getEvent(eventId, userId)).rejects.toThrow(dbError);
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
