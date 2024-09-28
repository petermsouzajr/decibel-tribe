"use client";
import { PageProps, Event } from "@/lib/types";
import EventCalendar from "./CalendarActions";
import { useEffect, useState } from "react";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { useSearchParams } from "next/navigation";

const Page: React.FC<PageProps> = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const username = searchParams.get("user") ?? "";

  useEffect(() => {
    const fetchEvents = async () => {
      const url = username ? `/api/events?user=${username}` : "/api/events";
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [username]);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (loading) {
    return <PostsLoadingSkeleton />;
  }

  const currentDate = new Date();
  return (
    <main className="flex w-full min-w-0 gap-5">
      <EventCalendar
        events={events}
        currentDate={currentDate}
        username={username}
      />
    </main>
  );
};

export default Page;
