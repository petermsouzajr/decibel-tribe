import React from "react";
import { format, isToday, isSameDay, formatDate, parse } from "date-fns";
import { Event, CalendarDayProps } from "@/lib/types";

const CalendarDay: React.FC<CalendarDayProps> = ({ day, events, onClick }) => {
  const dayEvents: Event[] = events.filter((event) =>
    isSameDay(parse(event.when, "yyyy-MM-dd", new Date()), day),
  );

  const formatTime = (time: string) => {
    return time ? format(parse(time, "HH:mm", new Date()), "hh:mm a") : "N/A";
  };

  return (
    <div
      className={`cursor-pointer rounded-md border bg-card p-2 text-center text-muted-foreground ${
        isToday(day) ? "bg-primary-foreground" : ""
      }`}
      onClick={() => onClick(day, dayEvents)}
    >
      {format(day, "d")}
      {dayEvents.length > 0 && (
        <div className="overflow-hidden">
          {dayEvents.map((event, index) => {
            const isDraft = event.status === "DRAFT";
            const eventTitle = event.title ? event.title : event.location;
            const eventClass = isDraft
              ? "mt-1 line-clamp-1 overflow-hidden text-ellipsis break-all rounded-sm bg-muted-foreground p-1 text-background hover:bg-white transition-colors duration-300"
              : "mt-1 line-clamp-1 overflow-hidden text-ellipsis break-all rounded-sm bg-primary p-1 text-background hover:bg-white transition-colors duration-300";

            return (
              <div key={index} className={eventClass} title={eventTitle}>
                {eventTitle}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CalendarDay;
