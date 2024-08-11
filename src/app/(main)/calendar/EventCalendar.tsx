"use client";
import React, { useState } from "react";
import CalendarGrid from "./CalendarGrid";
import EventDetailsModal from "./EventDetailsModal";
import ConfirmDeletionModal from "./ConfirmDeletionModal";
import { Event, CalendarProps } from "@/lib/types";
import { format } from "date-fns";

const EventCalendar: React.FC<CalendarProps> = ({ events, currentDate }) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDayClick = (day: Date, events: Event[]) => {
    setSelectedDay(day);
    setSelectedEvents(events);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h2>{format(currentDate, "MMMM yyyy")}</h2>
      <CalendarGrid
        currentDate={currentDate}
        events={events}
        onSelectDay={handleDayClick}
      />
      {isModalOpen && (
        <EventDetailsModal
          isOpen={isModalOpen}
          events={selectedEvents}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {/* ConfirmDeletionModal as needed */}
    </div>
  );
};

export default EventCalendar;
