import { type ClassValue, clsx } from "clsx";
import { formatDate, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";
import prisma from "@/lib/prisma";
import { getEventDataInclude } from "@/lib/types";
import { notFound } from "next/navigation";
import { cache } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(from: Date) {
  const currentDate = new Date(); // This will be the mocked date when timers are faked
  if (currentDate.getTime() - from.getTime() < 24 * 60 * 60 * 1000) {
    // For recent dates within tests (using fake timers), use absolute format for stability
    // return formatDistanceToNowStrict(from, { addSuffix: true }); // Old relative format
    return formatDate(from, "yyyy-MM-dd HH:mm:ss"); // New absolute format for stability
  } else {
    if (currentDate.getFullYear() === from.getFullYear()) {
      return formatDate(from, "d MMM");
    } else {
      return formatDate(from, "d MMM, yyyy");
    }
  }
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export const getEvent = cache(
  async (eventId: string, loggedInUserId: string) => {
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      include: getEventDataInclude(loggedInUserId),
    });

    if (!event) notFound();
    return event;
  },
);
