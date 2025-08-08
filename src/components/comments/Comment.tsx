import { useSession } from "@/app/(main)/SessionProvider";
import { CommentData } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { MessageSquare } from "lucide-react";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import CommentMoreButton from "./CommentMoreButton";
import CommentLikeButton from "./CommentLikeButton";
import CommentReplyInput from "./CommentReplyInput";
import { Repeat } from "lucide-react";
import { useState as useReactState } from "react";
import PostDialog from "@/app/(main)/PostDialogue";
import FollowButton from "../FollowButton";

interface CommentProps {
  comment: CommentData;
  onReply?: (commentId: string) => void;
}

export default function Comment({ comment, onReply }: CommentProps) {
  const { user } = useSession();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [repostOpen, setRepostOpen] = useReactState(false);

  const handleReply = () => {
    if (!user) return;
    console.log("Reply button clicked for comment:", comment.id);
    setShowReplyInput(true);
    onReply?.(comment.id);
  };

  const isDeleted = comment.isDeleted;
  console.log("Comment data:", { id: comment.id, isDeleted, userDeletedAt: comment.user.deletedAt });

  if (isDeleted) {
    return (
      <div className="flex gap-3 py-3">
        <span className="hidden sm:inline">
          <UserAvatar avatarUrl={null} size={40} />
        </span>
        <div className="text-muted-foreground italic">
          This comment has been deleted
        </div>
      </div>
    );
  }

  return (
    <div className="py-3">
      {/* Single comment row wrapper with its own hover group */}
      <div className="group/comment-row flex gap-3 hover:bg-muted rounded-md">
        <span className="hidden sm:inline">
          <UserTooltip user={comment.user}>
            <Link href={`/users/${comment.user.username}`}>
              <UserAvatar avatarUrl={comment.user.avatarUrl} size={40} />
            </Link>
          </UserTooltip>
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-sm">
            <UserTooltip user={comment.user}>
              <Link
                href={`/users/${comment.user.username}`}
                className="font-medium hover:underline"
              >
                {comment.user.displayName}
              </Link>
            </UserTooltip>
            <span className="text-muted-foreground">
              {formatRelativeDate(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-muted-foreground text-xs">(edited)</span>
            )}
          </div>
          <div className="mt-1">{comment.content}</div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-2">
            <CommentLikeButton comment={comment} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReply}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRepostOpen(true)}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              aria-label="Repost"
            >
              <Repeat className="h-4 w-4 mr-1" />
              Repost
            </Button>
          </div>

          {/* Reply Input (kept inside row since it's related to this comment) */}
          {showReplyInput && (
            <div className="mt-3">
              <CommentReplyInput
                comment={comment}
                onCancel={() => setShowReplyInput(false)}
                onSuccess={() => setShowReplyInput(false)}
              />
            </div>
          )}
        </div>

        {/* Desktop: show Follow on hover (not on own comments); Mobile: hide */}
        {comment.user.id !== user?.id && (
          <div className="hidden sm:block opacity-0 transition-opacity group-hover/comment-row:opacity-100">
            <FollowButton
              userId={comment.user.id}
              initialState={{
                followers: comment.user._count.followers,
                // Safe default; accurate state will be fetched/updated by FollowButton logic
                isFollowedByUser: false,
              }}
            />
          </div>
        )}
        <CommentMoreButton
          comment={comment}
          isOwner={comment.user.id === user?.id}
          className="ms-auto opacity-100 sm:opacity-0 transition-opacity sm:group-hover/comment-row:opacity-100"
          targetUserId={comment.user.id !== user?.id ? comment.user.id : undefined}
          initialIsFollowedByUser={false}
        />
      </div>

      {/* Replies rendered outside the row hover group so they don't trigger parent menu */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="ml-6 border-l-2 border-muted pl-4">
              <Comment comment={reply as CommentData} onReply={onReply} />
            </div>
          ))}
        </div>
      )}
      <PostDialog
        open={repostOpen}
        onOpenChange={setRepostOpen}
        quote={`@${comment.user.username} • ${formatRelativeDate(comment.createdAt)}\n\n${comment.content}`}
      />
    </div>
  );
}
