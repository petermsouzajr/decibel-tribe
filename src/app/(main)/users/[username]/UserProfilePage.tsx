"use client";

import { useState } from "react";
import { UserData, FollowerInfo } from "@/lib/types";
import ChangePasswordDialog from "./UpdatePasswordDialog";
import { formatDate } from "date-fns";
import FollowButton from "@/components/FollowButton";
import UserAvatar from "@/components/UserAvatar";
import Linkify from "@/components/Linkify";
import EditProfileButton from "./EditProfileButton";
import UpdateEmailButton from "./UpdateEmailButton";
import UpdatePasswordButton from "./UpdatePasswordButton";
import { Button } from "@/components/ui/button";

interface UserProfilePageProps {
  user: UserData;
  loggedInUserId: string;
  followerInfo: FollowerInfo;
}

export default function UserProfilePage({
  user,
  loggedInUserId,
  followerInfo,
}: UserProfilePageProps) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(
    !user.passwordHash,
  );

  const handlePasswordDialogClose = () => setIsPasswordDialogOpen(false);

  const instruments = user.userInstruments.map((ui) => ui.instrument.name);
  const skills = user.userSkills.map((us) => us.skill.name);

  return (
    <>
      {user.id === loggedInUserId && !user.passwordHash && (
        <ChangePasswordDialog
          open={isPasswordDialogOpen}
          onOpenChange={handlePasswordDialogClose}
          isSettingPassword={true}
        />
      )}
      <div className="h-fit w-full space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          size={250}
          className="mx-auto size-full max-h-60 max-w-60 rounded-full"
        />
        <div className="flex flex-wrap gap-3 sm:flex-nowrap">
          <div className="min-w-0 flex-1">
            <div className="space-y-3">
              <div className="flex flex-col">
                <h1 className="break-words text-3xl font-bold">
                  {user.displayName}
                </h1>
                <div className="break-words text-muted-foreground">
                  @{user.username}
                </div>
              </div>
              <div>
                Member since {formatDate(user.createdAt, "MMM d, yyyy")}
              </div>
              {user.id === loggedInUserId && user.userPreferences && (
                <div className="flex items-center gap-3">
                  Your Calendar Visibility:{" "}
                  {user.userPreferences.calendar === "PUBLIC"
                    ? "Public"
                    : "Private"}
                </div>
              )}
              {user.id === loggedInUserId && (
                <div className="flex items-center gap-3">
                  Email on file: {user.email}
                </div>
              )}
            </div>
          </div>
          {user.id !== loggedInUserId && (
            <FollowButton userId={user.id} initialState={followerInfo} />
          )}
        </div>

        {user.bio && (
          <>
            <hr />
            <Linkify>
              <div className="overflow-hidden whitespace-pre-line break-words">
                {user.bio}
              </div>
            </Linkify>
          </>
        )}
        {user.id === loggedInUserId && !user.passwordHash ? (
          <div className="h-fit w-full space-y-5 rounded-2xl bg-card p-5 shadow-sm">
            <Button
              onClick={() => setIsPasswordDialogOpen(true)}
              className="w-full"
            >
              Set Password
            </Button>
          </div>
        ) : (
          <>
            {user.id === loggedInUserId && (
              <div className="flex flex-wrap justify-around">
                <div className="flex">
                  <EditProfileButton user={user} />
                </div>
                <div className="flex">
                  <UpdateEmailButton user={user} />
                </div>
                <div className="flex">
                  <UpdatePasswordButton user={user} />
                </div>
              </div>
            )}

            {(instruments.length > 0 || skills.length > 0) && (
              <div className="mx-auto flex size-full justify-between rounded-2xl border-2 bg-card p-5 shadow-sm">
                {instruments.length > 0 && (
                  <div className="h-full">
                    <h3 className="text-lg font-semibold">Instruments</h3>
                    <ul className="list-inside list-disc">
                      {instruments.map((instrument, index) => (
                        <li key={index} className="text-sm">
                          {instrument}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {skills.length > 0 && (
                  <div className="h-full">
                    <h3 className="text-lg font-semibold">Skills</h3>
                    <ul className="list-inside list-disc">
                      {skills.map((skill, index) => (
                        <li key={index} className="text-sm">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
