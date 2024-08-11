import { PageProps, Event } from "@/lib/types";
import EventCalendar from "./CalendarActions";

const events: Event[] = [
  {
    title: "Music Festival with james jamesly and the spookers",
    who: "james jamesly and the spookers",
    where: "The Park",
    details: [
      { date: new Date(2024, 7, 6), startTime: "20:00", endTime: "23:00" },
      { date: new Date(2024, 7, 7), startTime: "17:00", endTime: "21:00" },
      { date: new Date(2024, 7, 8), startTime: "15:00", endTime: "19:00" },
    ],
  },
  {
    title: "Theater Concert",
    who: "winston slim and the destroyers",
    where: "The Park",
    details: [
      { date: new Date(2024, 7, 2), startTime: "19:00", endTime: "22:00" },
    ],
  },
  {
    title: "Park Concert",
    who: "caveman in space",
    where: "The Park",
    details: [
      { date: new Date(2024, 7, 2), startTime: "15:00", endTime: "18:00" },
    ],
  },
  // Add more events as needed
];

const Page: React.FC<PageProps> = ({ searchParams: { q } }) => {
  const currentDate = new Date(); // You can dynamically set this based on your application needs

  return (
    <main className="flex w-full min-w-0 gap-5">
      <EventCalendar events={events} currentDate={currentDate} />
    </main>
  );
};

export default Page;
