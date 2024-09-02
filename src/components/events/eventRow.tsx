import React from "react";
import { format as formatDate, parse, isValid } from "date-fns";
import { Event } from "@/lib/types";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "@/app/(main)/SessionProvider";

interface EventRowProps {
  event: Event;
  isEditing: boolean;
  onRowClick: (event: Event) => void;
}

const EventRow: React.FC<EventRowProps> = ({
  event,
  isEditing,
  onRowClick,
}) => {
  const formatTime = (time: string) => {
    const parsedTime = parse(time, "HH:mm", new Date());
    return isValid(parsedTime) ? formatDate(parsedTime, "hh:mm a") : "N/A";
  };

  const isDraft = event.status === "DRAFT";
  const { user } = useSession();
  const eventTitle = event.title ? event.title : event.location;
  const eventClass = isDraft
    ? "rounded-md bg-muted-foreground p-2 text-background"
    : "rounded-md bg-accent-foreground p-2 text-background";

  return (
    <div
      key={event.id}
      className={eventClass}
      onClick={() => onRowClick(event)}
    >
      <div className="flex w-full items-center justify-between">
        <div className="max-w-64 flex-1 text-left">{eventTitle}</div>
        <div className="flex-shrink-0 text-right">
          {formatTime(event.startTime)} {" to "} {formatTime(event.endTime)}
        </div>
      </div>
      {isEditing && (
        <div className="mt-8 flex w-full justify-between">
          {user.id === event.createdById && (
            <Button className={cn("mt-4 h-10 bg-primary text-foreground")}>
              <Link href={`/events/edit?id=${event.id}`}>Edit Event</Link>
            </Button>
          )}
          <Button className={cn("mt-4 h-10 bg-primary text-foreground")}>
            <Link href={`/events/${event.id}`}>Details</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventRow;
