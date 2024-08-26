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

  useEffect(() => {
    checkContentSize();
    window.addEventListener("resize", checkContentSize);
    return () => {
      window.removeEventListener("resize", checkContentSize);
    };
  }, []);

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
            <div className="block text-sm text-muted-foreground">
              Status: {event.status}
            </div>
            <div className="block text-sm text-muted-foreground">
              Attendees: {event._count.attendees}
            </div>
            <Link
              href={`/events/${event.id}`}
              className="block text-sm text-muted-foreground hover:underline"
              suppressHydrationWarning
            >
              {formatRelativeDate(event.createdAt)}
            </Link>
          </div>
          {event.createdBy.id === user.id ? "Edit Event" : ""}
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
        <h3 className="text-lg font-semibold">Event Details:</h3>
        <div key={event.id} className="rounded-md bg-accent-foreground p-3">
          <p>
            Date: {event.when} {event.startTime} - {event.endTime}
          </p>
          <p>Performers:</p>
          <ul className="ml-4 list-disc">
            {event.performers.map((performer) => (
              <li key={performer}>
                <Link href={`/users/${performer}`}>{performer}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
