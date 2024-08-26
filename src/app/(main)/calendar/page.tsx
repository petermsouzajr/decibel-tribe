"use client";
import { PageProps, Event } from "@/lib/types";
import EventCalendar from "./CalendarActions";
import { useEffect, useState } from "react";

const Page: React.FC<PageProps> = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        console.log("fetched in Page:", data);
        setEvents(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <p>Loading events...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  const currentDate = new Date();
  console.log("Events in Page:", events);
  return (
    <main className="flex w-full min-w-0 gap-5">
      <EventCalendar events={events} currentDate={currentDate} />
    </main>
  );
};

export default Page;
/*
src/app/(main)/calendar/page.tsx
src/app/(main)/calendar/CalendarActions.tsx

*/
