import { faker } from "@faker-js/faker";

export interface EventData {
  name: string;
  description: string;
  location: string;
  url?: string | null;
  when: Date;
  startTime: string; // Format HH:MM
  endTime: string; // Format HH:MM
  performers?: string[]; // Optional array of performer names or IDs
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  isCancelled: boolean;
}

/**
 * Generates realistic event data using Faker.js.
 * Allows overriding specific fields.
 */
export function generateEventData(
  overrides: Partial<EventData> = {},
): EventData {
  const startDate = faker.date.soon({ days: 30 });
  // Ensure end date is after start date by default
  const endDate = faker.date.future({ refDate: startDate });

  // Format time as HH:MM (adjust logic if needed for specific ranges)
  const startTime = `${String(faker.number.int({ min: 8, max: 20 })).padStart(2, "0")}:${String(faker.number.int({ min: 0, max: 59 })).padStart(2, "0")}`;
  const endTime = `${String(faker.number.int({ min: parseInt(startTime.split(":")[0]) + 1, max: 23 })).padStart(2, "0")}:${String(faker.number.int({ min: 0, max: 59 })).padStart(2, "0")}`;

  return {
    name: faker.music.songName() + " Festival",
    description: faker.lorem.paragraph(),
    location: faker.location.streetAddress(),
    url: faker.internet.url(),
    // Use the generated dates ensuring logical order
    when: startDate,
    startTime: startTime,
    endTime: endTime,
    performers: Array.from(
      { length: faker.number.int({ min: 0, max: 3 }) },
      () => faker.person.fullName(),
    ),
    status: "PUBLISHED",
    visibility: "PUBLIC",
    isCancelled: false,
    ...overrides, // Apply overrides last
  };
}
