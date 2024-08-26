"use client";
import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
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

const EventCalendar: React.FC<CalendarProps> = ({ events, currentDate }) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState(events);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editStates, setEditStates] = useState<Record<number, EditState>>({});

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

  return (
    <div className="container mx-auto p-4">
      <h2 className="m-3 mx-auto inline-flex h-12 w-full items-center justify-center gap-1 rounded-md bg-card p-1 text-muted-foreground shadow-sm">
        {format(currentDate, "MMMM yyyy")}
      </h2>
      <CalendarGrid
        currentDate={currentDate}
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
              <Link href="/events/edit" passHref>
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
