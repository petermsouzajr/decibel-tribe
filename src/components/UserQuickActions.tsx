"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import FollowButton from "./FollowButton";
import kyInstance from "@/lib/ky";
import { useState } from "react";
import ReportModal from "./reports/ReportModal";

interface Props {
  userId: string;
  initialFollowerInfo: { followers: number; isFollowedByUser: boolean };
  showReport?: boolean;
}

export default function UserQuickActions({
  userId,
  initialFollowerInfo,
  showReport = false,
}: Props) {
  const [reportOpen, setReportOpen] = useState(false);

  const blockUser = async () => {
    try {
      await kyInstance.post(`/api/users/${userId}/blocks`);
    } catch (e) {
      // no-op; toast handled globally in BlockButton normally
      console.error("Failed to block user", e);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <FollowButton userId={userId} initialState={initialFollowerInfo as any} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            onSelect={() => {
              blockUser();
            }}
          >
            Block User
          </DropdownMenuItem>
          {showReport && (
            <DropdownMenuItem
              onSelect={() => {
                setReportOpen(true);
              }}
            >
              Report Profile
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {showReport && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          contentType="profile"
          targetId={userId}
        />
      )}
    </div>
  );
}


