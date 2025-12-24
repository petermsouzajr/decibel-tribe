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
  return event;
});

