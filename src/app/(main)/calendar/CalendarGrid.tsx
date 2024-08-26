import React, { useState } from "react";
import CalendarDay from "./CalendarDay";
import { Event } from "@/lib/types";
import { eachDayOfInterval, getDay, startOfMonth, endOfMonth } from "date-fns";
import { CalendarGridProps } from "@/lib/types";

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  events,
  onSelectDay,
}) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDayClick = (day: Date, events: Event[]) => {
    onSelectDay(day, events); // This will be passed down to CalendarDay
  };

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });
  const startingDayIndex = getDay(firstDayOfMonth);

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAYS.map((weekday) => (
        <div key={weekday} className="text-center font-bold">
          {weekday}
        </div>
      ))}
      {Array.from({ length: startingDayIndex }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="rounded-md border p-2 text-center"
        />
      ))}
      {daysInMonth.map((day, index) => (
        <CalendarDay
          key={index}
          day={day}
          events={events}
          onClick={handleDayClick}
        />
      ))}
    </div>
  );
};

export default CalendarGrid;
