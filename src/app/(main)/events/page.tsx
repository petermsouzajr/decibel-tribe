"use client";
import { validateRequest } from "@/auth";
import EventDetails from "@/components/events/Event";
import Linkify from "@/components/Linkify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserAvatar from "@/components/UserAvatar";
import UserTooltip from "@/components/UserTooltip";
import prisma from "@/lib/prisma";
import { Event, getEventDataInclude } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense, useEffect, useState } from "react";
import EventsFollowingFeed from "../EventsFollowingFeed";
import EventsForYouFeed from "../EventsForYouFeed";
import EventCalendar from "../calendar/CalendarActions";

export default function Page() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events", {
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
      } catch (err) {}
    };

    fetchEvents();
  }, []);

  const currentDate = new Date();

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="text-center text-2xl font-bold">Events</h1>
        </div>
        <Tabs defaultValue="events-for-you">
          <TabsList className="z-9 sticky top-0">
            <TabsTrigger value="events-for-you">For you</TabsTrigger>
            <TabsTrigger value="events-following">Following</TabsTrigger>
          </TabsList>
          <TabsContent value="events-for-you">
            <EventsForYouFeed />
          </TabsContent>
          <TabsContent value="events-following">
            <EventsFollowingFeed />
          </TabsContent>
        </Tabs>
      </div>
      <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
        <EventCalendar
          events={events}
          currentDate={currentDate}
          username={""}
        />
      </div>
    </main>
  );
}
