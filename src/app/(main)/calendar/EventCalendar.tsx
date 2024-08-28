"use client";
import React, { useState } from "react";
import { format } from "date-fns";
import CalendarGrid from "./CalendarGrid";
// import EventDetailsModal from "./EventDetailsModal";
import ConfirmDeletionModal from "./ConfirmDeleteModal";
import { CalendarProps, Event, EventDetailsModalProps } from "@/lib/types";

const EventCalendar: React.FC<CalendarProps> = ({ events, currentDate }) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const handleDayClick = (day: Date, events: Event[]) => {
    setSelectedDay(day);
    setSelectedEvents(events);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    // Implement delete logic here
    setIsConfirmModalOpen(false);
    console.log("Event deleted:", eventToDelete);
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
      {/* {isModalOpen && (
        <EventDetailsModal
          isOpen={isModalOpen}
          events={selectedEvents}
          onClose={handleCloseModal}
          onDeleteEvent={handleDeleteEvent}
        />
      )} */}
      {isConfirmModalOpen && (
        <ConfirmDeletionModal
          isOpen={isConfirmModalOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmModalOpen(false)}
          title="Confirm Event Deletion"
          message="Are you sure you want to delete this event? This action cannot be undone."
        />
      )}
    </div>
  );
};

export default EventCalendar;
