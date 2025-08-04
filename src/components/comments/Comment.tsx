import { useSession } from "@/app/(main)/SessionProvider";
import { CommentData } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import CommentMoreButton from "./CommentMoreButton";
import CommentLikeButton from "./CommentLikeButton";
import CommentReplyInput from "./CommentReplyInput";

interface CommentProps {
  comment: CommentData;
  onReply?: (commentId: string) => void;
}

export default function Comment({ comment, onReply }: CommentProps) {
  const { user } = useSession();
  const [showReplyInput, setShowReplyInput] = useState(false);

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
    <div className="group/comment flex gap-3 py-3">
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
        </div>

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-3">
            <CommentReplyInput
              comment={comment}
              onCancel={() => setShowReplyInput(false)}
              onSuccess={() => setShowReplyInput(false)}
            />
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="ml-6 border-l-2 border-muted pl-4">
                <Comment comment={reply as CommentData} onReply={onReply} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {comment.user.id === user?.id && (
        <CommentMoreButton
          comment={comment}
          className="ms-auto opacity-0 transition-opacity group-hover/comment:opacity-100"
        />
      )}
    </div>
  );
}
