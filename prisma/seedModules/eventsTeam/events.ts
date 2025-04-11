import { PrismaClient, Prisma } from "@prisma/client";
import {
  faker,
  random,
  generateIdFromEntropySize,
  accountDataGenerator,
  // prisma is passed as an argument
} from "../../seedUtils.js";

// Interface for the user data expected
interface UserInput {
  id: string;
  username: string; // Keep if needed for filtering
  createdAt: Date;
}

// Interface for the data returned by this module
export interface CreatedEvent {
  id: string;
  createdById: string;
  isCancelled: boolean;
  createdAt: Date;
}

const userQuantity = 1; // Consider moving to seedUtils

export async function seedEvents(
  prismaClient: PrismaClient,
  createdUsers: UserInput[],
): Promise<CreatedEvent[]> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedEvents.");
    return [];
  }
  if (!createdUsers || createdUsers.length === 0) {
    console.log("No users provided for event creation. Skipping.");
    return [];
  }

  console.log("Creating events...");
  const eventsData: Prisma.EventCreateManyInput[] = [];
  const createdEventsForReturn: CreatedEvent[] = [];

  // Assuming all users can create events for now
  // Filter if needed: e.g., only verified users
  const eligibleUsers = createdUsers;

  // Original logic iterated every 4 users, let's keep that for simplicity
  for (let i = 0; i < eligibleUsers.length; i += 4) {
    const user = eligibleUsers[i];
    const eventQuantity = accountDataGenerator("random", userQuantity, 50);

    for (let j = 0; j < eventQuantity; j++) {
      const eventId = generateIdFromEntropySize(10);

      // Generate event date range
      const randomDate = faker.date.between({
        from: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000), // 2 months ago
        to: new Date(Date.now() + 14 * 30 * 24 * 60 * 60 * 1000), // 14 months future
      });

      // Generate start/end times within that day
      const startTime = faker.date.between({
        from: new Date(randomDate.setHours(0, 0, 0, 0)),
        to: new Date(randomDate.setHours(23, 59, 59, 999)),
      });
      const endTime = faker.date.between({
        from: new Date(startTime.getTime() + 1 * 60 * 60 * 1000), // At least 1hr later
        to: new Date(startTime.getTime() + 10 * 60 * 60 * 1000),
      });

      const createdAt = faker.date.between({
        from: new Date(user.createdAt),
        to: new Date(),
      });

      const isCancelled = faker.datatype.boolean();

      const eventInput: Prisma.EventCreateManyInput = {
        id: eventId,
        title: faker.lorem.words(),
        location: faker.location.city(),
        description: faker.lorem.paragraph(),
        url: faker.internet.url(),
        when: randomDate,
        startTime: startTime.toISOString().slice(11, 16),
        endTime: endTime.toISOString().slice(11, 16),
        performers: faker.helpers
          .shuffle(["Performer1", "Performer2", "Performer3"])
          .slice(0, 2),
        createdById: user.id,
        isCancelled: isCancelled,
        status: faker.helpers.arrayElement(["DRAFT", "PUBLISHED"]),
        visibility: faker.helpers.arrayElement(["PUBLIC", "PRIVATE"]),
        createdAt: createdAt,
      };
      eventsData.push(eventInput);

      createdEventsForReturn.push({
        id: eventId,
        createdById: user.id,
        isCancelled: isCancelled,
        createdAt: createdAt,
      });
    }
  }

  if (eventsData.length === 0) {
    console.log("...No events generated to create.");
    return [];
  }

  try {
    await prismaClient.event.createMany({
      data: eventsData,
      skipDuplicates: true,
    });
    console.log(`...${eventsData.length} events created!`);
  } catch (error) {
    console.error("Error creating events in DB:", error);
    return []; // Return empty on DB error
  }

  return createdEventsForReturn;
}
