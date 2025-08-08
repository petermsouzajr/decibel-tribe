import { describe, it, expect, vi, beforeEach, beforeAll, Mock } from "vitest";
import { ReportReason, ReportStatus } from "@prisma/client";

// --- Mocks ---
const mockCreateMany = vi.fn();
const mockFindMany = vi.fn();
const mockPrismaClient = {
  report: {
    createMany: mockCreateMany,
    findMany: mockFindMany,
  },
};

// Mock seedUtils faker to be deterministic-ish where necessary
vi.mock("../../seedUtils.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../seedUtils.js")>();
  return {
    ...original,
    faker: {
      number: { int: vi.fn().mockReturnValue(0) }, // always pick first content type
      lorem: { sentence: vi.fn().mockReturnValue("seeded description") },
      datatype: { boolean: vi.fn().mockReturnValue(true) },
      date: { recent: vi.fn().mockReturnValue(new Date("2024-01-01T00:00:00Z")) },
      helpers: {
        weightedArrayElement: vi
          .fn()
          .mockReturnValue("PENDING" satisfies ReportStatus),
      },
    },
  } as any;
});

describe("AdminTeam - seedReports Module", () => {
  let seedReports: (typeof import("./reports.js")) ["seedReports"]; 

  beforeAll(async () => {
    ({ seedReports } = await import("./reports.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMany.mockResolvedValue({ count: 3 });
    mockFindMany.mockResolvedValue([
      { id: "r1" },
      { id: "r2" },
      { id: "r3" },
    ]);
  });

  it("should call prisma.report.createMany with properly structured data", async () => {
    const adminUserIds = ["admin-1"];
    const regularUserIds = ["u1", "u2", "u3"];
    const postIds = ["p1", "p2"]; 
    const groupIds = ["g1"]; 
    const eventIds = ["e1"]; 

    const result = await seedReports(mockPrismaClient as any, {
      adminUserIds,
      regularUserIds,
      postIds,
      groupIds,
      eventIds,
    });

    expect(mockCreateMany).toHaveBeenCalledTimes(1);
    const arg = mockCreateMany.mock.calls[0][0];
    expect(Array.isArray(arg.data)).toBe(true);
    expect(arg.data.length).toBeGreaterThan(0);
    // All generated reports should include base fields
    for (const r of arg.data) {
      expect(r).toHaveProperty("reporterId");
      expect(r).toHaveProperty("reason");
      expect(Object.values(ReportReason)).toContain(r.reason);
      expect(r).toHaveProperty("status");
      expect(Object.values(ReportStatus)).toContain(r.status);
    }
    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" }, take: 25, select: { id: true } });
    expect(result).toEqual(["r1", "r2", "r3"]);
  });
});



