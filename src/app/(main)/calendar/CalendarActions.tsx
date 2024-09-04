"use client";
import React, { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  set,
  addMonths,
  subMonths,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarProps, EditState, Event } from "@/lib/types";
import CalendarGrid from "./CalendarGrid";
import EventRow from "@/components/events/eventRow";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { validateRequest } from "@/auth";
import { User } from "@prisma/client";
import { useSession } from "../SessionProvider";
import { Input } from "@/components/ui/input";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";

type CalendarPropsWithUsername = CalendarProps & { username: string };

const EventCalendar: React.FC<CalendarPropsWithUsername> = ({
  events,
  currentDate,
  username,
}) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState(events);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editStates, setEditStates] = useState<Record<number, EditState>>({});
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [userInfo, setUserInfo] = useState<UserState>(null);
  const [viewDate, setViewDate] = useState(currentDate); // New state to handle current displayed month
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false); // Control date picker modal
  const [loading, setLoading] = useState(true);

  type User = {
    id: string;
    username: string;
    displayName: string;
    googleId: string | null;
    avatarUrl: string | null;
  };

  type UserState = {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
    passwordHash: string | null;
    googleId: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date;
  } | null;

  const { user: loggedInUser } = useSession(); // Get the logged-in user info from context or custom hook

  const handleDateInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value);
    if (!isNaN(selectedDate.getTime())) {
      setViewDate(selectedDate);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!username) {
        setUserInfo(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/username/${username}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user info");
        }
        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error("Error fetching user info:", error);
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [username]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const handleDayClick = (day: Date, events: typeof selectedEvents) => {
    setSelectedDay(day);
    setSelectedEvents(events);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetEditStates();
  };

  const resetEditStates = () => {
    setEditingIndex(null);
    setEditStates({});
  };

  const handleRowClick = (index: number, event: Event) => {
    setEditStates((prev) => {
      if (index === null) return prev;

      const isCurrentlyEditing = prev[index]?.isEditing;

      return {
        ...prev,
        [index]: {
          ...prev[index],
          isEditing: !isCurrentlyEditing,
          title: isCurrentlyEditing ? prev[index].title : event.title,
          startTime: isCurrentlyEditing
            ? prev[index].startTime
            : event.startTime,
          endTime: isCurrentlyEditing ? prev[index].endTime : event.endTime,
        },
      };
    });

    setEditingIndex((prev) => (prev === index ? null : index));
  };

  // Handlers for Next/Previous buttons
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
  const handlePreviousMonth = () => setViewDate(subMonths(viewDate, 1));

  // Open/Close Date Picker
  const handleOpenDatePicker = () => setIsDatePickerOpen(true);
  const handleDateChange = (date: Date | null) => {
    if (date) setViewDate(date);
    setIsDatePickerOpen(false);
  };

  if (loading) {
    return <PostsLoadingSkeleton />;
  }

  console.log("userInfo", userInfo);
  return (
    <div className="container mx-auto p-4">
      <h2 className="justify-left mx-auto inline-flex h-12 w-full items-center gap-3 rounded-md bg-card p-4 text-xl font-bold text-muted-foreground shadow-sm">
        {userInfo ? (
          <>
            <div className="flex items-center px-3">
              <UserAvatar avatarUrl={userInfo.avatarUrl} />
            </div>
            <span>{userInfo.displayName}&apos;s Events</span>
          </>
        ) : (
          <>
            <div className="flex items-center px-3">
              <UserAvatar avatarUrl={loggedInUser?.avatarUrl} />
            </div>
            <span>Your Events</span>
          </>
        )}
      </h2>
      <div className="m-3 mx-auto flex items-center justify-center gap-8 rounded-md bg-card p-1 text-muted-foreground shadow-sm">
        <Button onClick={handlePreviousMonth}>{"<"}</Button>
        <Input
          type="date"
          value={format(viewDate, "yyyy-MM-dd")}
          onChange={handleDateInput}
          className="w-auto text-center"
        />
        <Button onClick={handleNextMonth}>{">"}</Button>
      </div>

      <CalendarGrid
        currentDate={viewDate}
        events={events}
        onSelectDay={handleDayClick}
      />

      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent>
            <div className="space-y-5">
              <DialogTitle>Events on {format(selectedDay!, "PP")}</DialogTitle>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event, index) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isEditing={!!editStates[index]?.isEditing}
                    onRowClick={() => handleRowClick(index, event)}
                  />
                ))
              ) : (
                <div className="rounded-md bg-muted p-2 text-center">
                  No events.
                </div>
              )}
              <Link href={`/events/edit?date=${selectedDay}`} passHref>
                <Button className="mt-4 h-10 w-full bg-primary text-foreground">
                  Create New Event
                </Button>
              </Link>
              <DialogFooter className="pt-4">
                <Button
                  onClick={closeModal}
                  className="h-10 bg-primary text-foreground"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventCalendar;
