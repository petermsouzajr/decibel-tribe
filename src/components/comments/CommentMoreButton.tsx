import { CommentData } from "@/lib/types";
import { Edit, Flag, MoreHorizontal, Trash2, CircleSlash2 } from "lucide-react";
import kyInstance from "@/lib/ky";
import { useToast } from "../ui/use-toast";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import DeleteCommentDialog from "./DeleteCommentDialog";
import CommentEditDialog from "./CommentEditDialog";
import ReportModal from "@/components/reports/ReportModal";

interface CommentMoreButtonProps {
  comment: CommentData;
  className?: string;
  isOwner: boolean;
  // Mobile behavior: include follow/unfollow inside menu
  targetUserId?: string;
  initialIsFollowedByUser?: boolean;
}

export default function CommentMoreButton({
  comment,
  className,
  isOwner,
  targetUserId,
  initialIsFollowedByUser,
}: CommentMoreButtonProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { toast } = useToast();

  // Check if comment is within edit window (5 minutes)
  const editWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
  const timeSinceCreation = Date.now() - comment.createdAt.getTime();
  const canEdit = isOwner && timeSinceCreation <= editWindow;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={className}>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {/* Mobile-first: show Follow/Unfollow in menu (desktop users will mainly use hover button) */}
          {targetUserId && !isOwner && (
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  // toggle follow
                  if (initialIsFollowedByUser) {
                    await kyInstance.delete(`/api/users/${targetUserId}/followers`);
                  } else {
                    await kyInstance.post(`/api/users/${targetUserId}/followers`);
                  }
                } catch (e) {
                  // ignore; other surfaces provide feedback
                }
              }}
              className="sm:hidden"
            >
              {initialIsFollowedByUser ? "Unfollow" : "Follow"}
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <span className="flex items-center gap-3">
                <Edit className="size-4" />
                Edit
              </span>
            </DropdownMenuItem>
          )}
          {isOwner && (
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
              <span className="flex items-center gap-3 text-destructive">
                <Trash2 className="size-4" />
                Delete
              </span>
            </DropdownMenuItem>
          )}
          {!isOwner && (
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  await kyInstance.post(`/api/users/${comment.user.id}/blocks`);
                  toast({ description: "User blocked. You will no longer see their content." });
                } catch (e) {
                  toast({ variant: "destructive", description: "Failed to block user." });
                }
              }}
            >
              <span className="flex items-center gap-3">
                <CircleSlash2 className="size-4" />
                Block User
              </span>
            </DropdownMenuItem>
          )}
          {!isOwner && (
            <DropdownMenuItem
              onSelect={() => {
                setShowReportModal(true);
              }}
            >
              <span className="flex items-center gap-3">
                <Flag className="size-4" />
                Report Comment
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteCommentDialog
        comment={comment}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
      <CommentEditDialog
        comment={comment}
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="comment"
        targetId={comment.id}
      />
    </>
  );
}
