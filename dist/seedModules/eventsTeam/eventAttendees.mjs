import { faker, accountDataGenerator, } from "../../seedUtils.mjs";
export async function seedEventAttendees(prismaClient, createdUsers, createdEvents) {
    if (!prismaClient) {
        console.error("Prisma client is not available for seedEventAttendees.");
        return [];
    }
    if (!createdUsers || createdUsers.length === 0) {
        console.log("No users provided for event attendee creation. Skipping.");
        return [];
    }
    if (!createdEvents || createdEvents.length === 0) {
        console.log("No events provided for event attendee creation. Skipping.");
        return [];
    }
    console.log("Creating event attendees...");
    const attendeesData = [];
    const createdAttendeesForReturn = [];
    // Only consider non-cancelled events
    const eligibleEvents = createdEvents.filter((e) => !e.isCancelled);
    if (eligibleEvents.length === 0) {
        console.log("...No non-cancelled events found to add attendees to.");
        return [];
    }
    for (const event of eligibleEvents) {
        // Add Creator First
        const creatorUser = createdUsers.find((u) => u.id === event.createdById);
        if (creatorUser) {
            const earliestCreatorJoinDate = new Date(Math.max(new Date(creatorUser.createdAt).getTime(), new Date(event.createdAt).getTime()));
            const creatorCreatedAt = faker.date.between({
                from: earliestCreatorJoinDate,
                to: new Date(),
            });
            const creatorAttendeeInput = {
                userId: creatorUser.id,
                eventId: event.id,
                createdAt: creatorCreatedAt,
            };
            attendeesData.push(creatorAttendeeInput);
            createdAttendeesForReturn.push({
                userId: creatorUser.id,
                eventId: event.id,
                createdAt: creatorCreatedAt,
            });
        }
        else {
            console.warn(`Creator user with ID ${event.createdById} not found for event ${event.id}. Skipping creator addition.`);
        }
        // Now handle additional attendees
        const attendeeQuantity = accountDataGenerator("random", 1, 30);
        const potentialAttendees = faker.helpers
            .shuffle(createdUsers)
            .filter((u) => u.id !== event.createdById); // Exclude event creator
        for (let i = 0; i < attendeeQuantity && i < potentialAttendees.length; i++) {
            const attendeeUser = potentialAttendees[i];
            // Ensure createdAt is after both user and event creation
            const earliestCreatedAt = new Date(Math.max(new Date(attendeeUser.createdAt).getTime(), new Date(event.createdAt).getTime()));
            const createdAtDate = faker.date.between({
                from: earliestCreatedAt,
                to: new Date(),
            });
            const attendeeInput = {
                userId: attendeeUser.id,
                eventId: event.id,
                createdAt: createdAtDate,
            };
            attendeesData.push(attendeeInput);
            createdAttendeesForReturn.push({
                userId: attendeeUser.id,
                eventId: event.id,
                createdAt: createdAtDate,
            });
        }
    }
    if (attendeesData.length === 0) {
        console.log("...No event attendees generated to create.");
        return [];
    }
    try {
        await prismaClient.eventAttendee.createMany({
            data: attendeesData,
            skipDuplicates: true,
        });
        console.log(`...${attendeesData.length} event attendees created!`);
    }
    catch (error) {
        console.error("Error creating event attendees in DB:", error);
        return []; // Return empty on DB error
    }
    return createdAttendeesForReturn;
}
