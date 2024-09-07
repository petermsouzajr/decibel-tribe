import React, { useEffect, useState } from "react";
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
  const [isAttendee, setIsAttendee] = useState(false);
  const [loadingAttendee, setLoadingAttendee] = useState(true);

  useEffect(() => {
    const fetchAttendeeStatus = async () => {
      try {
        const response = await fetch(`/api/events/${event.id}/attendees`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch attendee status");
        }

        const attendees = await response.json();
        const isUserAttendee = attendees.some(
          (attendee: { userId: string }) => attendee.userId === user.id,
        );
        setIsAttendee(isUserAttendee);
      } catch (error) {
        console.error("Failed to fetch attendee status:", error);
      } finally {
        setLoadingAttendee(false);
      }
    };

    fetchAttendeeStatus();
  }, [event.id, user.id]);

  const handleAddAttendee = async (event: Event) => {
    console.log("Adding attendee to event", event.id);
    try {
      const response = await fetch(`/api/events/${event.id}/attendees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to add attendee");
      }

      console.log("Attendee added successfully");
      // Optionally refresh or redirect
      // router.reload(); // or router.push("/some/path")
      setIsAttendee(true);
    } catch (error) {
      console.error("Failed to add attendee:", error);
    }
  };

  const handleRemoveAttendee = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event.id}/attendees`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to remove attendee");
      }
      setIsAttendee(false);
    } catch (error) {
      console.error("Failed to remove attendee:", error);
    }
  };

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
        <>
          <div>
            <ul className="ml-4 list-disc">
              {event.performers.map((performer) => (
                <li key={performer}>
                  <Link href={`/users/${performer}`}>{performer}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex w-full justify-between">
            {user.id === event.createdById && (
              <Button className={cn("mt-4 h-10 bg-primary text-foreground")}>
                <Link href={`/events/edit?id=${event.id}`}>Edit Event</Link>
              </Button>
            )}
            <Button className={cn("mt-4 h-10 bg-primary text-foreground")}>
              <Link href={`/events/${event.id}`}>Details</Link>
            </Button>
            {!isAttendee ? (
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // Suppress onRowClick for this button
                  handleAddAttendee(event);
                }}
                className={cn("mt-4 h-10 bg-primary text-foreground")}
              >
                Add to Calendar
              </Button>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // Suppress onRowClick for this button
                  handleRemoveAttendee(event);
                }}
                className={cn("mt-4 h-10 bg-primary text-foreground")}
              >
                Remove from Calendar
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EventRow;
