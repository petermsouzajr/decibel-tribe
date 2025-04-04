import { Prisma } from "@prisma/client";

export function getUserDataSelect(loggedInUserId?: string | null) {
  const select = {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    createdAt: true,
    email: true,
    passwordHash: true,
    userPreferences: {
      select: {
        calendar: true,
      },
    },
    userInstruments: {
      select: {
        instrument: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    userSkills: {
      select: {
        skill: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    _count: {
      select: {
        posts: true,
        followers: true,
      },
    },
  } satisfies Prisma.UserSelect;

  if (loggedInUserId) {
    return {
      ...select,
      followers: {
        where: {
          followerId: loggedInUserId,
        },
        select: {
          followerId: true,
        },
      },
    } satisfies Prisma.UserSelect;
  }

  return select;
}

export type UserData = Prisma.UserGetPayload<{
  select: ReturnType<typeof getUserDataSelect>;
}>;

export type LoggedInUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  googleId?: string;
};

export function getEventDataInclude(loggedInUserId: string) {
  return {
    createdBy: {
      select: getUserDataSelect(loggedInUserId),
    },
    attendees: {
      select: {
        user: {
          select: getUserDataSelect(loggedInUserId),
        },
      },
    },
    _count: {
      select: {
        attendees: true,
      },
    },
  } satisfies Prisma.EventInclude;
}

export type EventData = Prisma.EventGetPayload<{
  include: ReturnType<typeof getEventDataInclude>;
}>;

export function getPostDataInclude(loggedInUserId?: string | null) {
  const include = {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
    attachments: true,
    _count: {
      select: {
        likes: true,
        dislikes: true,
        comments: true,
      },
    },
    Group: {
      select: {
        id: true,
        name: true,
      },
    },
  } satisfies Prisma.PostInclude;

  if (loggedInUserId) {
    return {
      ...include,
      likes: {
        where: {
          userId: loggedInUserId,
        },
        select: {
          userId: true,
        },
      },
      dislikes: {
        where: {
          userId: loggedInUserId,
        },
        select: {
          userId: true,
        },
      },
      bookmarks: {
        where: {
          userId: loggedInUserId,
        },
        select: {
          userId: true,
        },
      },
    } satisfies Prisma.PostInclude;
  }

  return include;
}

export type PostData = Prisma.PostGetPayload<{
  include: ReturnType<typeof getPostDataInclude>;
}>;

export interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}

export function getGroupMemberSelect() {
  return {
    userId: true,
    groupId: true,
    role: true,
    joinedAt: true,
    group: {
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
      },
    },
    user: {
      select: {
        id: true,
        username: true,
        displayName: true,
      },
    },
    acceptedInvite: true,
  } satisfies Prisma.GroupMemberSelect;
}

export type GroupMembershipData = Prisma.GroupMemberGetPayload<{
  include: ReturnType<typeof getGroupMemberSelect>;
}>;

export function getCommentDataInclude(loggedInUserId?: string | null) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
  } satisfies Prisma.CommentInclude;
}

export type CommentData = Prisma.CommentGetPayload<{
  include: ReturnType<typeof getCommentDataInclude>;
}>;

export interface CommentsPage {
  comments: CommentData[];
  previousCursor: string | null;
}

// Define the specific include structure used in the notifications API route
export const notificationApiInclude = (loggedInUserId: string) =>
  ({
    issuer: {
      select: getUserDataSelect(loggedInUserId), // Pass the actual ID here
    },
    post: {
      select: {
        id: true, // Include post ID for linking
        content: true,
      },
    },
    event: {
      select: {
        id: true, // Include event ID for linking
        title: true,
        location: true,
      },
    },
  }) satisfies Prisma.NotificationInclude;

// Update NotificationData type to use the payload derived from the actual include logic
// Note: We can't directly use a function call in GetPayload, so we define a helper type
type NotificationPayloadCreator<T extends string | null | undefined> =
  Prisma.NotificationGetPayload<{
    include: ReturnType<typeof notificationApiInclude>;
  }>;

// Use the helper type. The actual ID doesn't matter for the type structure itself,
// only that the conditional 'followers' field is now part of the 'issuer' type.
export type NotificationData = NotificationPayloadCreator<string>;

export interface NotificationsPage {
  notifications: NotificationData[];
  nextCursor: string | null;
}

export interface FollowerInfo {
  followers: number;
  isFollowedByUser: boolean;
}

export interface LikeInfo {
  likes: number;
  isLikedByUser: boolean;
}

export interface DislikeInfo {
  dislikes: number;
  isDislikedByUser: boolean;
}

export interface BookmarkInfo {
  isBookmarkedByUser: boolean;
}

export interface NotificationCountInfo {
  unreadCount: number;
}

export interface MessageCountInfo {
  unreadCount: number;
}
export interface Event {
  id: string;
  title: string;
  location: string;
  when: Date;
  startTime: string;
  endTime: string;
  performers: string[];
  description: string;
  url: string;
  createdById: string;
  isCancelled: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  visibility: string;
}

export interface EventsPage {
  events: EventData[];
  nextCursor: string | null;
}

export interface CalendarProps {
  events: Event[];
  currentDate: Date;
}

export interface CalendarDayProps {
  day: Date;
  events: Event[];
  onClick: (day: Date, events: Event[]) => void;
}

export interface PageProps {
  searchParams: {
    q?: string;
  };
}

export interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  onSelectDay: (day: Date, events: Event[]) => void;
}

export interface EventDetailsModalProps {
  isOpen: boolean;
  events: Event[];
  onClose: () => void;
  onDeleteEvent: (event: Event) => void;
}

export interface ConfirmDeletionModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export interface EditState {
  title: string;
  startTime: string;
  endTime: string;
  isEditing: boolean;
  editedTitle: string;
  editedStartTime: string;
  editedEndTime: string;
}
