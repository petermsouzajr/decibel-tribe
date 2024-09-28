"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { UserData } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import Linkify from "../Linkify";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import FollowButton from "../FollowButton";

interface UserCardProps {
  user: UserData;
}

export default function UserCard({ user }: UserCardProps) {
  const { user: loggedInUser } = useSession();

  return (
    <article className="group/user space-y-3 rounded-2xl border-2 bg-card p-3 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="flex w-full flex-wrap gap-3">
          <UserTooltip user={user}>
            <Link href={`/users/${user.username}`}>
              <UserAvatar avatarUrl={user.avatarUrl} size={50} />
            </Link>
          </UserTooltip>
          <div className="min-w-0 flex-1">
            <UserTooltip user={user}>
              <Link
                href={`/users/${user.username}`}
                className="block font-medium hover:underline"
              >
                <div className="flex w-full flex-wrap items-center">
                  <span className="flex-shrink truncate">
                    {user.displayName}
                  </span>
                  <span className="flex-shrink truncate pl-2 text-muted-foreground">
                    @{user.username}
                  </span>
                </div>
              </Link>
            </UserTooltip>
            <div className="text-sm text-muted-foreground">
              Member since {formatRelativeDate(user.createdAt)}
            </div>
          </div>
          {user.id !== loggedInUser.id && (
            <FollowButton
              userId={user.id}
              initialState={{
                followers: user._count?.followers ?? 0,
                isFollowedByUser: user.followers
                  ? user.followers.some(
                      ({ followerId }) => followerId === loggedInUser.id,
                    )
                  : false,
              }}
            />
          )}
        </div>
      </div>

      {user.bio && (
        <div className="overflow-hidden whitespace-pre-line break-words">
          <Linkify>{user.bio}</Linkify>
        </div>
      )}

      {((user.userInstruments && user.userInstruments.length > 0) ||
        (user.userSkills && user.userSkills.length > 0)) && (
        <div className="flex flex-wrap gap-5 pt-3">
          {user.userInstruments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold">Instruments:</h4>
              <ul className="list-inside list-disc">
                {user.userInstruments.map((ui) => (
                  <li key={ui.instrument.id} className="text-sm">
                    {ui.instrument.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {user.userSkills.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold">Skills:</h4>
              <ul className="list-inside list-disc">
                {user.userSkills.map((us) => (
                  <li key={us.skill.id} className="text-sm">
                    {us.skill.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
