import { Prisma } from "@prisma/client";

export function getUserDataSelect(loggedInUserId: string) {
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    createdAt: true,
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
    followers: {
      where: {
        followerId: loggedInUserId,
      },
      select: {
        followerId: true,
      },
    },
    _count: {
      select: {
        posts: true,
        followers: true,
      },
    },
  } satisfies Prisma.UserSelect;
}

export type UserData = Prisma.UserGetPayload<{
  select: ReturnType<typeof getUserDataSelect>;
}>;

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

export function getPostDataInclude(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
    attachments: true,
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
    _count: {
      select: {
        likes: true,
        dislikes: true,
        comments: true,
      },
    },
  } satisfies Prisma.PostInclude;
}

export type PostData = Prisma.PostGetPayload<{
  include: ReturnType<typeof getPostDataInclude>;
}>;

export interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}

export function getCommentDataInclude(loggedInUserId: string) {
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

export const notificationsInclude = {
  issuer: {
    select: getUserDataSelect("issuerUserId"), // Assuming issuerUserId is how you can access the issuer's user ID contextually
  },
  post: {
    select: {
      content: true,
    },
  },
} satisfies Prisma.NotificationInclude;

export type NotificationData = Prisma.NotificationGetPayload<{
  include: typeof notificationsInclude;
}>;

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
  when: string;
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
  title: string; // Optional: Add title for dynamic header content
  message: string; // Optional: Add message to customize the displayed text
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
