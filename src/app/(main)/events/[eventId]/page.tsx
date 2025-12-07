import { validateRequest } from "@/auth";
import EventPageContent from "@/components/events/eventPageContent";
import { getEvent } from "@/lib/utils";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;

  const {
    eventId
  } = params;

  const { user } = await validateRequest();
  if (!user) return {};
  const event = await getEvent(eventId, user.id);
  return { title: `${event.title}` };
}

export default async function Page(props: PageProps) {
  const params = await props.params;

  const {
    eventId
  } = params;

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
