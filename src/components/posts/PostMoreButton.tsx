import { PostData } from "@/lib/types";
import { MoreHorizontal, Trash2, Flag, CircleSlash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import DeletePostDialog from "./DeletePostDialog";
import ReportModal from "@/components/reports/ReportModal";
import kyInstance from "@/lib/ky";
import { useToast } from "../ui/use-toast";
import ConfirmModal from "../ConfirmModal";
import { useSession } from "@/app/(main)/SessionProvider";

interface PostMoreButtonProps {
  post: PostData;
  className?: string;
}

export default function PostMoreButton({
  post,
  className,
}: PostMoreButtonProps) {
  const { user } = useSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={className}>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {post.user.id === user.id ? (
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
              <span className="flex items-center gap-3 text-destructive">
                <Trash2 className="size-4" />
                Delete
              </span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setConfirmOpen(true)}>
              <span className="flex items-center gap-3">
                <CircleSlash2 className="size-4" />
                Block user
              </span>
            </DropdownMenuItem>
          )}
          {post.user.id !== user.id && (
            <DropdownMenuItem
              onSelect={() => {
                setShowReportModal(true);
              }}
            >
              <span className="flex items-center gap-3">
                <Flag className="size-4" />
                Report Post
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="post"
        targetId={post.id}
      />
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Block this user?"
        description="You are about to block this user. Their content and events will no longer be visible to you, but your content will still be visible to them. You can unblock them anytime from your profile's Blocked Users section."
        confirmLabel="Block"
        loading={loading}
        onConfirm={async () => {
          try {
            setLoading(true);
            await kyInstance.post(`/api/users/${post.user.id}/blocks`);
            toast({ description: "User blocked. You will no longer see their content." });
          } catch (e) {
            toast({ variant: "destructive", description: "Failed to block user." });
          } finally {
            setLoading(false);
            setConfirmOpen(false);
          }
        }}
      />
      <DeletePostDialog
        post={post}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
