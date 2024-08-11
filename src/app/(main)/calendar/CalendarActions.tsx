"use client";
import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  addDays,
  isSameDay,
  isToday,
  eachDayOfInterval,
  getDay,
  parse,
  format as formatDate,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarDayProps, Event, CalendarProps } from "@/lib/types";
import clsx from "clsx";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Define CalendarDay component
const CalendarDay: React.FC<CalendarDayProps> = ({ day, events, onClick }) => {
  const dayEvents: Event[] = events.reduce((acc: Event[], event) => {
    const filteredDetails = event.details.filter((detail) =>
      isSameDay(detail.date, day),
    );

    if (filteredDetails.length > 0) {
      acc.push({
        title: event.title,
        who: event.who,
        where: event.where,
        details: filteredDetails,
      });
    }
    return acc;
  }, []);

  return (
    <div
      className={`cursor-pointer rounded-md border bg-card p-1 text-center text-muted-foreground ${
        isToday(day) ? "bg-primary-foreground" : ""
      }`}
      onClick={() => onClick(day, dayEvents)}
    >
      {format(day, "d")}
      {dayEvents.length > 0 && (
        <div className="overflow-hidden">
          {dayEvents.map((event, index) => (
            <div
              key={index}
              className="mt-1 line-clamp-1 overflow-hidden text-ellipsis break-all rounded-sm bg-primary p-1 text-background"
              title={`${event.details
                .map((detail) => `${detail.startTime} - ${detail.endTime}`)
                .join(", ")}`}
            >
              {event.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Define EventCalendar component
const EventCalendar: React.FC<CalendarProps> = ({ events, currentDate }) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{
    event: Event;
    detailIndex: number;
  } | null>(null);

  const handleDayClick = (day: Date, events: Event[]) => {
    setSelectedDay(day);
    setSelectedEvents(events);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    handleCancel();
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      const { event, detailIndex } = eventToDelete;
      const updatedEvents = selectedEvents
        .map((e) => {
          if (e.title === event.title) {
            return {
              ...e,
              details: e.details.filter((_, index) => index !== detailIndex),
            };
          }
          return e;
        })
        .filter((e) => e.details.length > 0);

      setSelectedEvents(updatedEvents);
      setEventToDelete(null);
      closeConfirmModal();
    }
  };

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [originalTitle, setOriginalTitle] = useState<string>("");
  const [editedStartTime, setEditedStartTime] = useState<string>("");
  const [editedEndTime, setEditedEndTime] = useState<string>("");
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const handleRowClick = (
    index: number,
    title: string,
    detail: { startTime: string; endTime: string },
  ) => {
    setEditingIndex(index);
    setOriginalTitle(title);
    setEditedTitle(title);
    setEditedStartTime(detail.startTime);
    setEditedEndTime(detail.endTime);
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      // Logic to save changes
      console.log("Saved:", editedTitle);
      setEditingIndex(null);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditedTitle(originalTitle);
    setEditedStartTime("");
    setEditedEndTime("");
  };

  const startingDayIndex = getDay(firstDayOfMonth);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  return (
    <div className="container mx-auto p-4">
      <h2 className="m-3 mx-auto inline-flex h-12 w-full items-center justify-center gap-1 rounded-md bg-card p-1 text-muted-foreground shadow-sm">
        {format(currentDate, "MMMM yyyy")}
      </h2>
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="text-center text-muted-foreground">
            {weekday}
          </div>
        ))}
        {Array.from({ length: startingDayIndex }).map((_, index) => {
          return (
            <div
              key={`empty-${index}`}
              className="rounded-md border p-2 text-center"
            />
          );
        })}
        {daysInMonth.map((day, index) => (
          <CalendarDay
            key={index}
            day={day}
            events={events}
            onClick={handleDayClick}
          />
        ))}
      </div>
      {isModalOpen && (
        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              handleCancel();
            }
          }}
        >
          <DialogContent>
            <div className="space-y-5">
              <h3 className="text-center text-lg font-bold">
                {editingIndex !== null ? "Editing " : ""}Events on{" "}
                {format(selectedDay!, "PP")}
              </h3>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event, index) =>
                  event.details.map((detail, detailIndex) => (
                    <div
                      key={`${index}-${detailIndex}`}
                      className="rounded-md bg-accent-foreground p-2 text-background"
                      onClick={() =>
                        editingIndex === null &&
                        handleRowClick(index, event.title, detail)
                      }
                    >
                      {editingIndex === index ? (
                        <>
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="mb-2 w-full rounded-md border bg-secondary-foreground p-1"
                          />
                          <div className="flex w-full justify-between gap-2">
                            <input
                              type="time"
                              value={editedStartTime}
                              onChange={(e) =>
                                setEditedStartTime(e.target.value)
                              }
                              className="mb-2 w-full rounded-md border bg-secondary-foreground p-1"
                            />
                            <input
                              type="time"
                              value={editedEndTime}
                              onChange={(e) => setEditedEndTime(e.target.value)}
                              className="mb-2 w-full rounded-md border bg-secondary-foreground p-1"
                            />
                          </div>
                          <div className="mt-8 flex w-full justify-between">
                            <button
                              onClick={handleCancel}
                              className="rounded-md bg-background px-4 py-2 text-white"
                            >
                              Close
                            </button>
                            <button
                              onClick={() => {
                                setEventToDelete({ event, detailIndex });
                                setIsConfirmModalOpen(true);
                              }}
                              className="rounded-md bg-red-500 px-4 py-2 text-white"
                            >
                              Delete Event
                            </button>
                            <button
                              onClick={handleSave}
                              className="rounded-md bg-green-500 px-4 py-2 text-white"
                            >
                              Save
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex w-full justify-between">
                          <div className="max-w-64 flex-1 text-left">
                            {event.title}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            {formatDate(
                              parse(detail.startTime, "HH:mm", new Date()),
                              "hh:mm a",
                            )}{" "}
                            {" to "}
                            {formatDate(
                              parse(detail.endTime, "HH:mm", new Date()),
                              "hh:mm a",
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )),
                )
              ) : (
                <div className="rounded-md bg-muted p-2 text-center">
                  No events.
                </div>
              )}
              <button
                onClick={() => {
                  /* Logic to open the event adding form or modal */
                }}
                className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-white"
              >
                Add Event
              </button>
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isConfirmModalOpen && (
        <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p>
                Are you sure you want to delete event:
                <br />
                {eventToDelete?.event.title}
                <br /> {format(selectedDay!, "PP")}
                <br />
                {" from "}
                {eventToDelete &&
                  formatDate(
                    parse(
                      eventToDelete.event.details[eventToDelete.detailIndex]
                        .startTime,
                      "HH:mm",
                      new Date(),
                    ),
                    "hh:mm a",
                  )}{" "}
                to{" "}
                {eventToDelete &&
                  formatDate(
                    parse(
                      eventToDelete.event.details[eventToDelete.detailIndex]
                        .endTime,
                      "HH:mm",
                      new Date(),
                    ),
                    "hh:mm a",
                  )}
              </p>
            </div>
            <DialogFooter>
              <div className="mt-8 flex w-full justify-between">
                <button
                  onClick={handleDeleteConfirm}
                  className="rounded-md bg-red-500 px-4 py-2 text-white"
                >
                  Confirm
                </button>
                <button
                  onClick={closeConfirmModal}
                  className="rounded-md bg-primary px-4 py-2 text-white"
                >
                  Cancel
                </button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventCalendar;
