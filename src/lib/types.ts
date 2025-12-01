import { Prisma, NotificationType, Media } from "@prisma/client";

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
    deletedAt: true, // Include deletedAt field
    isDatingActive: true,
    user_dating_profile: {
      select: {
        id: true,
        age: true,
        height: true,
        gender: true,
        sexualOrientation: true,
        coronavirusVaccinated: true,
        religion: true,
        location: true,
      },
    },
    userPreferences: {
      select: {
        calendar: true,
      },
    },
            user_dating_preferences: {
          select: {
            id: true,
            preferredGender: true,
            preferredSexualOrientation: true,
            preferredMinAge: true,
            preferredMaxAge: true,
            preferredMaxDistanceKm: true,
            preferredMinHeight: true,
            preferredMaxHeight: true,
            preferredCoronavirusVaccinated: true,
            preferredReligions: true,
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
  const sharedSelect = (depth: number): any => {
    const base: any = {
        id: true,
        content: true,
        createdAt: true,
        user: { select: getUserDataSelect(loggedInUserId) },
        attachments: true,
        sharedCount: true,
        _count: {
          select: {
            likes: true,
            dislikes: true,
            comments: { where: { parentId: null } },
          },
        },
        ...(loggedInUserId
          ? {
            likes: { where: { userId: loggedInUserId }, select: { userId: true } },
            dislikes: { where: { userId: loggedInUserId }, select: { userId: true } },
            bookmarks: { where: { userId: loggedInUserId }, select: { userId: true } },
            }
          : {}),
    };
    if (depth > 1) {
      base.sharedFrom = { select: sharedSelect(depth - 1) };
    }
    return base;
  };

  const include = {
    user: { select: getUserDataSelect(loggedInUserId) },
    attachments: true,
    sharedFrom: { select: sharedSelect(2) }, // include nested one level deep
    _count: {
      select: {
        likes: true,
        dislikes: true,
        comments: { where: { parentId: null } },
      },
    },
    Group: { select: { id: true, name: true } },
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

export type UserWithFollowerStatus = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  email: string | null;
  passwordHash: string | null;
  deletedAt: Date | null; // Include deletedAt field
      isDatingActive: boolean;
    user_dating_preferences: {
      id: string;
      preferredGender: string;
      preferredSexualOrientation: string;
      preferredMinAge: number;
      preferredMaxAge: number;
      preferredMaxDistanceKm: number;
      preferredMinHeight: number | null;
      preferredMaxHeight: number | null;
      preferredCoronavirusVaccinated: string | null;
      preferredReligions: string[];
    } | null;
  userPreferences: {
    calendar: string;
  } | null;
  userInstruments: {
    instrument: {
      id: string;
      name: string;
    };
  }[];
  userSkills: {
    skill: {
      id: string;
      name: string;
    };
  }[];
  _count: {
    posts: number;
    followers: number;
  };
  // The conditionally included field:
  followers: {
    followerId: string;
  }[];
};

export interface NotificationData {
  id: string;
  recipientId: string;
  issuerId: string;
  postId: string | null;
  type: NotificationType; // Correctly imported type
  read: boolean;
  eventId: string | null;
  createdAt: Date;

  issuer: UserWithFollowerStatus;
  post: {
    id: string;
    content: string;
  } | null;
  event: {
    id: string;
    title: string;
    location: string;
  } | null;
}

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

// Helper type to get the payload structure from getPostDataInclude
// Ensures we include likes, dislikes, bookmarks conditionally
type PostPayloadCreator<T extends string | null | undefined> =
  Prisma.PostGetPayload<{ include: ReturnType<typeof getPostDataInclude> }>;

// Manually define PostData to ensure the user field has the correct type
export type PostData = {
  id: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  groupId: string | null;
  sharedFromId: string | null;
  sharedCount: number;

  // Nested relations from getPostDataInclude(userId)
  user: UserWithFollowerStatus;
  attachments: Media[]; // Use the imported Media type
  sharedFrom: {
    id: string;
    content: string;
    createdAt: Date;
    user: UserWithFollowerStatus;
    attachments: Media[];
    sharedCount: number;
    _count: { likes: number; dislikes: number; comments: number };
    likes: { userId: string }[];
    dislikes: { userId: string }[];
    bookmarks?: { userId: string }[];
    sharedFrom?: {
      id: string;
      content: string;
      createdAt: Date;
      user: UserWithFollowerStatus;
      attachments: Media[];
      sharedCount: number;
      _count: { likes: number; dislikes: number; comments: number };
      likes: { userId: string }[];
      dislikes: { userId: string }[];
      bookmarks?: { userId: string }[];
    } | null;
  } | null;
  _count: {
    likes: number;
    dislikes: number;
    comments: number;
  };
  Group: {
    id: string;
    name: string;
  } | null;

  // Conditionally included relations (present when loggedInUserId is provided)
  likes: { userId: string }[];
  dislikes: { userId: string }[];
  bookmarks: { userId: string }[];
};

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
    parent: {
      select: {
        id: true,
        content: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    },
    replies: {
      include: {
        user: {
          select: getUserDataSelect(loggedInUserId),
        },
        replies: {
          include: {
            user: {
              select: getUserDataSelect(loggedInUserId),
            },
          },
        },
      },
    },
    likes: loggedInUserId ? {
      where: {
        userId: loggedInUserId,
      },
      select: {
        isLike: true,
      },
    } : false,
    _count: {
      select: {
        replies: true,
        likes: {
          where: {
            isLike: true,
          },
        },
      },
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

export interface CommentLikeInfo {
  likes: number;
  isLikedByUser: boolean;
}

export interface CommentInteractionData {
  id: string;
  commentId: string;
  userId: string;
  isLike: boolean;
  createdAt: Date;
}
