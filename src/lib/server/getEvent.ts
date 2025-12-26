import "server-only";

import prisma from "@/lib/prisma";
import { getEventDataInclude } from "@/lib/types";
import { notFound } from "next/navigation";
import { cache } from "react";

export const getEvent = cache(async (eventId: string, loggedInUserId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: getEventDataInclude(loggedInUserId),
  });

  if (!event) notFound();
  // Never expose event zip/coords to clients (used only for proximity search)
  return {
    ...event,
    zipCode: null,
    latitude: null,
    longitude: null,
  } as typeof event;
});

