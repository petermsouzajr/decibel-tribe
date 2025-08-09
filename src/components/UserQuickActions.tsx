"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
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
import ConfirmModal from "./ConfirmModal";
import { useBlockStatus } from "@/hooks/useBlockStatus";

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
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isBlocked, block, unblock } = useBlockStatus(userId);

  const blockUser = async () => {
    try {
      setLoading(true);
      if (isBlocked) {
        await unblock.mutateAsync();
        toast({ description: "User unblocked." });
      } else {
        await block.mutateAsync();
        toast({ description: "User blocked. You will no longer see their content." });
      }
    } catch (e) {
      toast({ variant: "destructive", description: isBlocked ? "Failed to unblock user." : "Failed to block user." });
      console.error("Failed to block user", e);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
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
              setConfirmOpen(true);
            }}
          >
            {isBlocked ? "Unblock User" : "Block User"}
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
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={blockUser}
        loading={loading}
        title={isBlocked ? "Unblock this user?" : "Block this user?"}
        description={
          isBlocked
            ? "You will start seeing this user's content again. You can block them anytime from their profile or menus."
            : "You are about to block this user. Their content and events will no longer be visible to you, but your content will still be visible to them. You can unblock them anytime from your profile's Blocked Users section."
        }
        confirmLabel={isBlocked ? "Unblock" : "Block"}
      />
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


