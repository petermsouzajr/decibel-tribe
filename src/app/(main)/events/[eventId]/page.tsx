import { validateRequest } from "@/auth";
import EventPageContent from "@/components/events/eventPageContent";
import { getEvent } from "@/lib/utils";
import { Metadata } from "next";

interface PageProps {
  params: { eventId: string };
}

export async function generateMetadata({
  params: { eventId },
}: PageProps): Promise<Metadata> {
  const { user } = await validateRequest();
  if (!user) return {};
  const event = await getEvent(eventId, user.id);
  return { title: `${event.title}` };
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
  return <EventPageContent event={event} />;
}
