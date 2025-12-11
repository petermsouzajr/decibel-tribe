#!/usr/bin/env tsx
/**
 * Script to clean up orphaned media records (media with postId: null)
 * 
 * Usage:
 *   npx tsx scripts/cleanup-orphaned-media.ts [--all] [--older-than-hours=24]
 * 
 * Options:
 *   --all: Delete all orphaned media regardless of age (use with caution)
 *   --older-than-hours: Only delete media older than specified hours (default: 24)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOrphanedMedia() {
  const args = process.argv.slice(2);
  const deleteAll = args.includes("--all");
  const olderThanHoursArg = args.find((arg) => arg.startsWith("--older-than-hours="));
  const olderThanHours = olderThanHoursArg
    ? parseInt(olderThanHoursArg.split("=")[1] || "24")
    : 24;

  try {
    console.log("Checking for orphaned media records...");

    // Count orphaned media
    const whereClause: any = {
      postId: null,
    };

    if (!deleteAll) {
      const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      whereClause.createdAt = {
        lte: cutoffDate,
      };
      console.log(
        `Looking for orphaned media older than ${olderThanHours} hours...`,
      );
    } else {
      console.log("WARNING: Will delete ALL orphaned media regardless of age!");
    }

    const orphanedMedia = await prisma.media.findMany({
      where: whereClause,
      select: {
        id: true,
        url: true,
        createdAt: true,
      },
    });

    console.log(`Found ${orphanedMedia.length} orphaned media records.`);

    if (orphanedMedia.length === 0) {
      console.log("No orphaned media to clean up.");
      return;
    }

    if (!deleteAll) {
      console.log(
        `\nTo delete all orphaned media (including recent ones), run with --all flag.`,
      );
    }

    // Delete orphaned media
    const deleteResult = await prisma.media.deleteMany({
      where: whereClause,
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.count} orphaned media records.`);

    // Show some examples of what was deleted
    if (orphanedMedia.length > 0 && orphanedMedia.length <= 10) {
      console.log("\nDeleted media examples:");
      orphanedMedia.slice(0, 5).forEach((media) => {
        console.log(`  - ${media.id}: ${media.url} (created: ${media.createdAt})`);
      });
    } else if (orphanedMedia.length > 10) {
      console.log("\nDeleted media examples (first 5):");
      orphanedMedia.slice(0, 5).forEach((media) => {
        console.log(`  - ${media.id}: ${media.url} (created: ${media.createdAt})`);
      });
      console.log(`  ... and ${orphanedMedia.length - 5} more`);
    }
  } catch (error) {
    console.error("Error cleaning up orphaned media:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedMedia();
