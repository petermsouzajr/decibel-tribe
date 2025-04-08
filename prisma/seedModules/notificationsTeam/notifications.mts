import { Prisma, NotificationType } from "@prisma/client";
import {
  faker,
  // generateIdFromEntropySize, // ID is auto-generated
  // accountDataGenerator, // Not used here
  // prisma is passed as an argument
} from "../../seedUtils.mjs";

// --- Input Interfaces --- Define structure of data needed from other modules
interface PostInput {
  id: string;
  userId: string;
}

// Export this type for use in seed.mts
export interface CommentInput {
  id: string;
  postId: string;
  userId: string; // Issuer
}

interface LikeInput {
  postId: string;
  userId: string; // Issuer
}

interface DislikeInput {
  postId: string;
  userId: string; // Issuer
}

interface FollowInput {
  followerId: string; // Issuer
  followingId: string; // Recipient
}

interface EventInput {
  id: string;
  createdById: string; // Issuer for cancellation, Recipient for attendee
  isCancelled: boolean;
}

interface AttendeeInput {
  userId: string; // Recipient for cancellation, Issuer for attendee
  eventId: string;
}

// Note: UserInput isn't directly needed if other inputs have required user IDs

// Optional: Interface for returned data (could just be void or count)
// export interface CreatedNotification { ... }

export async function seedNotifications(
  prismaClient: any,
  allPosts: PostInput[],
  allComments: CommentInput[],
  createdLikes: LikeInput[],
  createdDislikes: DislikeInput[],
  createdFollows: FollowInput[],
  createdEvents: EventInput[],
  createdAttendees: AttendeeInput[],
): Promise<void> {
  if (!prismaClient) {
    console.error("Prisma client is not available for seedNotifications.");
    return;
  }

  console.log("Creating notifications...");
  const notificationData: Prisma.NotificationCreateManyInput[] = [];

  // --- Helper: Create Post Map for efficient lookup ---
  const postMap = new Map(allPosts.map((post) => [post.id, post]));
  // --- Helper: Create Event Map ---
  const eventMap = new Map(createdEvents.map((event) => [event.id, event]));
  // --- Helper: Create Attendee Map per Event ---
  const attendeesByEvent = new Map<string, AttendeeInput[]>();
  for (const attendee of createdAttendees) {
    const attendees = attendeesByEvent.get(attendee.eventId) || [];
    attendees.push(attendee);
    attendeesByEvent.set(attendee.eventId, attendees);
  }

  // 1. Comment Notifications
  console.log("  Generating comment notifications...");
  for (const comment of allComments) {
    const post = postMap.get(comment.postId);
    if (post && post.userId !== comment.userId) {
      // Don't notify self
      notificationData.push({
        recipientId: post.userId,
        issuerId: comment.userId,
        postId: post.id,
        type: NotificationType.COMMENT,
        read: faker.datatype.boolean(0.8), // 80% unread
        createdAt: faker.date.recent({ days: 30 }),
      });
    }
  }

  // 2. Like Notifications
  console.log("  Generating like notifications...");
  for (const like of createdLikes) {
    const post = postMap.get(like.postId);
    if (post && post.userId !== like.userId) {
      // Don't notify self
      notificationData.push({
        recipientId: post.userId,
        issuerId: like.userId,
        postId: post.id,
        type: NotificationType.LIKE,
        read: faker.datatype.boolean(0.8),
        createdAt: faker.date.recent({ days: 30 }),
      });
    }
  }

  // 3. Dislike Notifications (if desired - often omitted)
  console.log("  Generating dislike notifications...");
  for (const dislike of createdDislikes) {
    const post = postMap.get(dislike.postId);
    if (post && post.userId !== dislike.userId) {
      // Don't notify self
      notificationData.push({
        recipientId: post.userId,
        issuerId: dislike.userId,
        postId: post.id,
        type: NotificationType.DISLIKE,
        read: faker.datatype.boolean(0.8),
        createdAt: faker.date.recent({ days: 30 }),
      });
    }
  }

  // 4. Follow Notifications
  console.log("  Generating follow notifications...");
  for (const follow of createdFollows) {
    // followerId is issuer, followingId is recipient
    notificationData.push({
      recipientId: follow.followingId,
      issuerId: follow.followerId,
      type: NotificationType.FOLLOW,
      read: faker.datatype.boolean(0.8),
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  // 5. Event Attendee Notifications
  console.log("  Generating event attendee notifications...");
  for (const attendee of createdAttendees) {
    const event = eventMap.get(attendee.eventId);
    // Notify event creator when someone attends (if not the creator themselves)
    if (event && event.createdById !== attendee.userId) {
      notificationData.push({
        recipientId: event.createdById,
        issuerId: attendee.userId,
        eventId: event.id,
        type: NotificationType.EVENT_ATTENDEE,
        read: faker.datatype.boolean(0.8),
        createdAt: faker.date.recent({ days: 30 }),
      });
    }
  }

  // 6. Event Cancellation Notifications
  console.log("  Generating event cancellation notifications...");
  const cancelledEvents = createdEvents.filter((event) => event.isCancelled);
  for (const event of cancelledEvents) {
    const attendees = attendeesByEvent.get(event.id) || [];
    for (const attendee of attendees) {
      // Notify attendee (if not the creator) that event is cancelled
      if (attendee.userId !== event.createdById) {
        notificationData.push({
          recipientId: attendee.userId,
          issuerId: event.createdById,
          eventId: event.id,
          type: NotificationType.EVENT_CANCELLED,
          read: faker.datatype.boolean(0.8),
          createdAt: faker.date.recent({ days: 30 }),
        });
      }
    }
  }

  // --- Database Operation ---
  if (notificationData.length === 0) {
    console.log("...No notifications generated to create.");
    return;
  }

  console.log(
    `Attempting to create ${notificationData.length} notifications...`,
  );
  try {
    const result = await prismaClient.notification.createMany({
      data: notificationData,
      skipDuplicates: true, // Important for idempotency if script reruns
    });
    console.log(`...${result.count} notifications created!`);
  } catch (error) {
    console.error("Error creating notifications in DB:", error);
  }
}
