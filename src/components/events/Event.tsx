"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { EventData } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import { format as formatDate, parse, isValid, format } from "date-fns";
import { Button } from "../ui/button";
import Linkify from "../Linkify";
import { useToast } from "@/components/ui/use-toast";
import ReportModal from "@/components/reports/ReportModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Share2 } from "lucide-react";
import PostDialog from "@/app/(main)/PostDialogue";

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
  const { toast } = useToast();
  const [showReportModal, setShowReportModal] = useState(false);

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

    const fetchAttendees = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${event.id}/attendees`, {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setIsAttendee(data.some((att: any) => att.user.id === user?.id));
        } else {
          console.error("Failed to fetch attendees:", response.status);
          toast({
            variant: "destructive",
            description: "Failed to check attendance. Please try again.",
          });
          setIsAttendee(false);
        }
      } catch (error) {
        console.error("Failed to fetch attendees:", error);
        setIsAttendee(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAttendees();
    }
  }, [event.id, user, toast]);

  const handleAddAttendee = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/attendees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        toast({
          variant: "destructive",
          description: "Failed to add event to calendar. Please try again.",
        });
        return;
      }

      toast({
        description: "Event added to your Calendar",
      });
      setIsAttendee(true);
    } catch (error) {
      console.error("Failed to add attendee:", error);
      toast({
        variant: "destructive",
        description: "An error occurred. Please try again.",
      });
    }
  };

  const handleRemoveAttendee = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/attendees`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast({
          variant: "destructive",
          description:
            "Failed to remove event from calendar. Please try again.",
        });
        return;
      }
      toast({
        description: "Event removed from your Calendar",
      });
      setIsAttendee(false);
    } catch (error) {
      console.error("Failed to remove attendee:", error);
      toast({
        variant: "destructive",
        description: "An error occurred. Please try again.",
      });
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
      return null;
    }
  };

  const [shareOpen, setShareOpen] = useState(false);
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
              {" "}
              Updated: {formatRelativeDate(event.updatedAt)}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {renderEventActionButton()}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded p-2 hover:bg-gray-100">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {event.createdBy.id !== user.id && (
                  <DropdownMenuItem
                    onSelect={() => {
                      setShowReportModal(true);
                    }}
                  >
                    Report Event
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => setShareOpen(true)}>
                  Share as Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
          {event.isCancelled && (
            <p className="font-bold text-red-500">
              This event has been Cancelled
            </p>
          )}
          {event.title && <p className="pb-8 text-xl">{event.title}</p>}
          <p>
            <span className="text-lg underline">Location:</span>{" "}
            {event.location}
          </p>
          <p>
            <span className="text-lg underline"></span>
            <Linkify>{event.url}</Linkify>
          </p>
          <p>
            <span className="text-lg underline">Date:</span>{" "}
            {format(event.when, "MMMM d, yyyy")}
          </p>
          <p>
            <span className="text-lg underline">Time:</span>{" "}
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </p>
          <p>
            <span className="text-lg underline">Performers:</span>
          </p>
          <ul className="ml-4 list-disc">
            {event.performers.map((performer) => (
              <li key={performer}>
                <Linkify>{performer}</Linkify>
              </li>
            ))}
          </ul>

          {Array.isArray((event as any).helpWantedSkills) &&
            (event as any).helpWantedSkills.length > 0 && (
              <>
                <p className="mt-4">
                  <span className="text-lg underline">Help Wanted:</span>
                </p>
                <ul className="ml-4 list-disc">
                  {(event as any).helpWantedSkills
                    .map((h: any) => h?.skill?.name)
                    .filter(Boolean)
                    .map((skillName: string) => (
                      <li key={skillName}>{skillName}</li>
                    ))}
                </ul>
              </>
            )}
        </div>
      </div>
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="event"
        targetId={event.id}
      />
      <PostDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        quote={`Event: ${event.title}\nWhen: ${format(event.when, "MMMM d, yyyy")} ${formatTime(event.startTime)} - ${formatTime(event.endTime)}\nWhere: ${event.location}${event.url ? "\n" + event.url : ""}`}
      />
    </article>
  );
}
