"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { EventData } from "@/lib/types";
import { cn, formatRelativeDate } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import FollowButton from "../FollowButton";
import { format as formatDate, parse, isValid } from "date-fns";
import prisma from "@/lib/prisma";
import { Button } from "../ui/button";
import Linkify from "../Linkify";

//http://localhost:3000/events/cm008i31b0001488hptjh2f7i
//http://localhost:3000/events/cm009aq6b0001w17tx6l865sz
//http://localhost:3000/events/cm009i0mr0003w17tq3qdf2hr
interface EventDetailsProps {
  event: EventData;
}

export default function EventDetails({ event }: EventDetailsProps) {
  const { user } = useSession();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const contentRef = useRef(null);
  const [isAttendee, setIsAttendee] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const checkContentSize = () => {
    if (contentRef.current) {
      const maxHeight = window.innerHeight * 0.9;
      setShowToggle(
        (contentRef.current as HTMLElement).scrollHeight > maxHeight,
      );
    }
  };

  const formatTime = (time: string) => {
    const parsedTime = parse(time, "HH:mm", new Date());
    return isValid(parsedTime) ? formatDate(parsedTime, "hh:mm a") : "N/A";
  };

  useEffect(() => {
    checkContentSize();
    // window.addEventListener("resize", checkContentSize);
    // return () => {
    //   window.removeEventListener("resize", checkContentSize);
    // };

    const fetchAttendees = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/events/${event.id}/attendees`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch attendees");
        }
        const attendees = await response.json();

        // Check if the logged-in user is an attendee
        const isUserAttendee = attendees.some(
          (attendee: { userId: string }) => attendee.userId === user.id,
        );
        setIsAttendee(isUserAttendee);
      } catch (error) {
        console.error("Error fetching attendees:", error);
      }
      setLoading(false); // Set to false once data is fetched
    };

    fetchAttendees();
  }, [event.id, user.id]);

  const handleAddAttendee = async () => {
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

  const handleRemoveAttendee = async () => {
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

  const isEventCreator = (eventCreatedById: string, userId: string) => {
    return eventCreatedById === userId;
  };

  const shouldShowAddButton = (isAttendee: boolean) => {
    return !isAttendee;
  };

  const shouldShowRemoveButton = (isAttendee: boolean) => {
    return isAttendee;
  };

  const renderEventActionButton = () => {
    if (loading) {
      // Render a placeholder button while loading
      return <Button className="bg-primary text-primary-foreground"></Button>;
    }
    if (isEventCreator(event.createdBy.id, user.id)) {
      return (
        <Button className="bg-muted-foreground text-background">
          {" "}
          <Link href={`/events/edit?id=${event.id}`}>Edit Event</Link>
        </Button>
      );
    } else if (shouldShowAddButton(isAttendee)) {
      return <Button onClick={handleAddAttendee}>Add to Calendar</Button>;
    } else if (shouldShowRemoveButton(isAttendee)) {
      return (
        <Button onClick={handleRemoveAttendee}>Remove from Calendar</Button>
      );
    } else {
      return null; // This should never happen, but just in case.
    }
  };

  console.log("EventDetailsProps", event);
  console.log("attendees", event.attendees);
  return (
    <article className="group/event space-y-3 rounded-2xl border-2 bg-card p-3 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="flex w-full flex-wrap gap-3">
          <UserTooltip user={event.createdBy}>
            <Link href={`/users/${event.createdBy.username}`}>
              <UserAvatar avatarUrl={event.createdBy.avatarUrl} />
            </Link>
          </UserTooltip>
          <div className="min-w-0 flex-1">
            <UserTooltip user={event.createdBy}>
              <Link
                href={`/users/${event.createdBy.username}`}
                className="block font-medium hover:underline"
              >
                <div className="flex w-full flex-wrap items-center">
                  <span className="max-w-[75%] flex-shrink truncate">
                    {event.createdBy.displayName}
                  </span>
                  <span className="max-w-[25%] flex-shrink truncate pl-2 text-muted-foreground">
                    @{event.createdBy.username}
                  </span>
                </div>
              </Link>
            </UserTooltip>
            {event.createdBy.id === user.id ? (
              <>
                <div className="text-md fotn-bold block text-muted-foreground">
                  Status: {event.status}
                </div>
                <div className="text-md fotn-bold block text-muted-foreground">
                  Visibility: {event.visibility}
                </div>
                <div className="block text-sm text-muted-foreground">
                  Attendees: {event._count.attendees}
                </div>
              </>
            ) : (
              ""
            )}
            <div
              className="block text-sm text-muted-foreground"
              suppressHydrationWarning
            >
              {formatRelativeDate(event.createdAt)}
            </div>
          </div>
          {renderEventActionButton()}
        </div>
      </div>

      {event.description && (
        <div
          className="cursor-pointer pb-3 pt-3"
          onClick={() => (window.location.href = `/events/${event.id}`)}
        >
          <div
            ref={contentRef}
            className={`whitespace-pre-line break-words transition-all duration-300 ${
              isExpanded ? "" : "overflow-hidden"
            }`}
          >
            {isExpanded
              ? event.description
              : `${event.description.substring(0, 300)}${event.description.length > 300 ? "..." : ""}`}
          </div>
        </div>
      )}

      {event.description!.length > 300 && (
        <div
          className="cursor-pointer text-center text-sm text-primary"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand();
          }}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </div>
      )}

      <hr className="text-muted-foreground" />
      <div className="flex flex-col gap-3">
        <div key={event.id} className="rounded-md p-3">
          <p className="text-lg">{event.title}</p>
          <p>Location: {event.location}</p>
          <p>Date: {event.when}</p>
          <p>
            Time: {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </p>
          <p>Performers:</p>
          <ul className="ml-4 list-disc">
            {event.performers.map((performer) => (
              <li key={performer}>
                <Linkify>{performer}</Linkify>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
