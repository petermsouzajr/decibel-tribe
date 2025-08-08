import { PostData } from "@/lib/types";
import { MoreHorizontal, Trash2, Flag, CrossIcon, CircleSlash, CircleSlash2 } from "lucide-react";
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
import BookmarkButton from "./BookmarkButton";
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
            <DropdownMenuItem asChild>
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
      <DeletePostDialog
        post={post}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
