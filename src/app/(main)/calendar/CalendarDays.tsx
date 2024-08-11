import React from "react";
import { format, isToday, isSameDay } from "date-fns";
import { Event, CalendarDayProps } from "@/lib/types";

const CalendarDay: React.FC<CalendarDayProps> = ({ day, events, onClick }) => {
  const dayEvents = events.filter((event) =>
    event.details.some((detail) => isSameDay(detail.date, day)),
  );

  return (
    <div
      className={`cursor-pointer rounded-md border bg-card p-1 text-center text-muted-foreground ${isToday(day) ? "bg-primary-foreground" : ""}`}
      onClick={() => onClick(day, dayEvents)}
    >
      {format(day, "d")}
      {dayEvents.length > 0 &&
        dayEvents.map((event, index) => (
          <div
            key={index}
            className="mt-1 line-clamp-1 overflow-hidden text-ellipsis break-all rounded-sm bg-primary p-1 text-background"
            title={event.title}
          >
            {event.title}
          </div>
        ))}
    </div>
  );
};

export default CalendarDay;
