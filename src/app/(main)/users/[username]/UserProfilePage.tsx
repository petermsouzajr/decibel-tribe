"use client";

import { useEffect, useState } from "react";
import { UserData, FollowerInfo } from "@/lib/types";
import ChangePasswordDialog from "./UpdatePasswordDialog";
import { formatDate } from "date-fns";
import UserQuickActions from "@/components/UserQuickActions";
import BlockButton from "@/components/BlockButton";
import UserAvatar from "@/components/UserAvatar";
import Linkify from "@/components/Linkify";
import EditProfileButton from "./EditProfileButton";
import UpdateEmailButton from "./UpdateEmailButton";
import UpdatePasswordButton from "./UpdatePasswordButton";
import DatingToggleButton from "./DatingToggleButton";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import ReportButton from "@/components/reports/ReportButton";
import BlockedUsersList from "./BlockedUsersList";
import UserPosts from "./UserPosts";
import Link from "next/link";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handlePasswordDialogClose = () => setIsPasswordDialogOpen(false);

  const instruments = user.userInstruments.map((ui) => ui.instrument.name);
  const skills = user.userSkills.map((us) => us.skill.name);

  const [privateZipCode, setPrivateZipCode] = useState<string>("");

  useEffect(() => {
    if (user.id !== loggedInUserId) return;
    const load = async () => {
      try {
        const res = await fetch("/api/users/preferences", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data?.zipCode === "string") setPrivateZipCode(data.zipCode);
      } catch {
        // ignore
      }
    };
    load();
  }, [user.id, loggedInUserId]);

  // Check if user is deleted
  const isDeleted = user.deletedAt !== null;

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
          avatarUrl={
            isDeleted ? "/assets/avatar-placeholder.png" : user.avatarUrl
          }
          size={250}
          className="mx-auto size-full max-h-60 max-w-60 rounded-full"
        />
        <div className="flex flex-wrap gap-3 sm:flex-nowrap">
          <div className="min-w-0 flex-1">
            <div className="space-y-3">
              <div className="flex flex-col">
                <h1 className="break-words text-3xl font-bold">
                  {isDeleted ? "Deleted User" : user.displayName}
                </h1>
                <div className="break-words text-muted-foreground">
                  {isDeleted ? "[Account Deleted]" : `@${user.username}`}
                </div>
              </div>
              <div>
                Member since {formatDate(user.createdAt, "MMM d, yyyy")}
              </div>
              {user.id === loggedInUserId &&
                user.userPreferences &&
                !isDeleted && (
                  <div className="flex items-center gap-3">
                    Your Calendar Visibility:{" "}
                    {user.userPreferences.calendar === "PUBLIC"
                      ? "Public"
                      : "Private"}
                  </div>
                )}
              {user.id === loggedInUserId && !isDeleted && (
                <div className="flex items-center gap-3">
                  Email on file: {user.email}
                </div>
              )}
            </div>
          </div>
          {user.id !== loggedInUserId && !isDeleted && (
            <UserQuickActions
              userId={user.id}
              initialFollowerInfo={followerInfo as any}
              showReport
            />
          )}
        </div>

        {user.bio && !isDeleted && (
          <>
            <hr />
            <Linkify>
              <div className="overflow-hidden whitespace-pre-line break-words">
                {user.bio}
              </div>
            </Linkify>
          </>
        )}
        {user.id === loggedInUserId && !user.passwordHash && !isDeleted ? (
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
            {user.id === loggedInUserId && !isDeleted && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="mb-3 text-lg font-semibold">
                    Account Settings
                  </h3>
                  <div className="space-y-3">
                    <div className="w-full">
                      <EditProfileButton user={user} />
                    </div>
                    <div className="w-full">
                      <UpdateEmailButton user={user} />
                    </div>
                    <div className="w-full">
                      <UpdatePasswordButton user={user} />
                    </div>
                    <div className="w-full">
                      <DatingToggleButton user={user} />
                    </div>
                    <div className="w-full border-t pt-3">
                      <Link
                        href="/privacy"
                        className="block text-sm text-muted-foreground hover:text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <h3 className="mb-3 text-lg font-semibold">Blocked Users</h3>
                  <BlockedUsersList userId={loggedInUserId} />
                </div>

                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-destructive">
                    Danger Zone
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <Button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="size-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            )}

            {(instruments.length > 0 || skills.length > 0) && !isDeleted && (
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
                    {user.id === loggedInUserId && privateZipCode && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        Your zip code (private): {privateZipCode}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!isDeleted && (
        <div className="h-fit w-full space-y-5 rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-center text-2xl font-bold">
            {user.displayName}&apos;s posts
          </h2>
          <UserPosts userId={user.id} />
        </div>
      )}

      <DeleteAccountDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}
