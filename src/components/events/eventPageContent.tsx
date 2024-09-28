"use client";
import React from "react";
import EventDetails from "@/components/events/Event";

interface EventPageContentProps {
  event: any;
}

const EventPageContent: React.FC<EventPageContentProps> = ({ event }) => (
  <main className="flex w-full min-w-0 gap-5">
    <div className="w-full min-w-0 space-y-5">
      <EventDetails event={event} />
    </div>
    <div className="sticky top-[5.25rem] hidden h-fit w-80 flex-none lg:block"></div>
  </main>
);

export default EventPageContent;
