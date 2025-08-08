import { ReportReason, ReportStatus } from "@prisma/client";
import { faker } from "../../seedUtils.js";

interface SeedReportsInput {
  adminUserIds: string[]; // users with isAdmin true to act as resolvers
  regularUserIds: string[]; // pool for reporters and reported users
  postIds: string[]; // optional links
  groupIds: string[];
  eventIds: string[];
}

export async function seedReports(
  prismaClient: any,
  { adminUserIds, regularUserIds, postIds, groupIds, eventIds }: SeedReportsInput,
) {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedReports.");
    return [] as string[];
  }

  // Create a small, realistic dataset of reports
  const reasons: ReportReason[] = [
    "HARASSMENT",
    "SPAM",
    "INAPPROPRIATE_CONTENT",
    "FAKE_PROFILE",
    "OTHER",
  ];

  const pick = <T,>(arr: T[]) => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined);

  const reportsData = Array.from({ length: 25 }).map(() => {
    const contentType = faker.number.int({ min: 0, max: 3 });
    const reporterId = pick(regularUserIds)!;
    const reason = pick(reasons)!;
    const status: ReportStatus = faker.helpers.weightedArrayElement<ReportStatus>([
      { weight: 6, value: "PENDING" },
      { weight: 2, value: "INVESTIGATING" },
      { weight: 1, value: "RESOLVED_ACTION_TAKEN" },
      { weight: 1, value: "RESOLVED_NO_ACTION" },
    ]);

    const base: any = {
      reporterId,
      reason,
      description: faker.lorem.sentence(),
      status,
      adminNotes: status === "PENDING" ? null : faker.lorem.sentence(),
    };

    if (status !== "PENDING") {
      base.resolvedAt = faker.date.recent({ days: 14 });
      base.resolvedBy = pick(adminUserIds);
    }

    // Randomize target type
    if (contentType === 0) {
      base.reportedId = pick(regularUserIds);
    } else if (contentType === 1) {
      base.postId = pick(postIds);
    } else if (contentType === 2) {
      base.groupId = pick(groupIds);
    } else if (contentType === 3) {
      base.eventId = pick(eventIds);
    }

    return base;
  });

  try {
    const created = await prismaClient.report.createMany({ data: reportsData, skipDuplicates: true });
    console.log(`adminTeam: created ${created.count} reports`);
  } catch (error) {
    console.error("adminTeam: error creating reports:", error);
  }

  // Return the ids of the created reports (fetch last N to keep simple)
  const latest = await prismaClient.report.findMany({ orderBy: { createdAt: "desc" }, take: 25, select: { id: true } });
  return latest.map((r: any) => r.id);
}


