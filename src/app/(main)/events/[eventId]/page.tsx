import { validateRequest } from "@/auth";
import EventDetails from "@/components/events/Event";
import Linkify from "@/components/Linkify";
import UserAvatar from "@/components/UserAvatar";
import UserTooltip from "@/components/UserTooltip";
import prisma from "@/lib/prisma";
import { getEventDataInclude } from "@/lib/types";
import { getEvent } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

interface PageProps {
  params: { eventId: string };
}

export async function generateMetadata({
  params: { eventId },
}: PageProps): Promise<Metadata> {
  const { user } = await validateRequest();

  if (!user) return {};

  const event = await getEvent(eventId, user.id);
  console.log("Event found and user authorized:", event);
  return {
    title: `${event.title}`,
  };
}

export default async function Page({ params: { eventId } }: PageProps) {
  const { user } = await validateRequest();

  if (!user) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const event = await getEvent(eventId, user.id);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <EventDetails event={event} />
      </div>
      <div className="sticky top-[5.25rem] hidden h-fit w-80 flex-none lg:block"></div>
    </main>
  );
}
