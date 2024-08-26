// actions.ts

export async function createEvent({
  title,
  where,
  description,
  url,
  details,
}: {
  title: string;
  where: string;
  description?: string;
  url?: string;
  details: {
    date: Date;
    startTime: string;
    endTime: string;
    performers: string[];
  }[];
}) {
  const response = await fetch("/api/events/eventId", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      where,
      description,
      url,
      details,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create event");
  }

  return response.json(); // This will return the newly created event, including its ID
}
