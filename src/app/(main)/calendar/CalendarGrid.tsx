import React from "react";
import CalendarDay from "./CalendarDay";
import { Event } from "@/lib/types";
import { eachDayOfInterval, getDay, startOfMonth, endOfMonth } from "date-fns";

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  onSelectDay: (day: Date, events: Event[]) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  events,
  onSelectDay,
}) => {
  const firstDayOfMonth = startOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: endOfMonth(currentDate),
  });
  const startingDayIndex = getDay(firstDayOfMonth);

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Weekdays and blank days rendering logic here */}
    </div>
  );
};

export default CalendarGrid;
