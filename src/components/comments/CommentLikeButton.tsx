import { useSession } from "@/app/(main)/SessionProvider";
import { CommentData } from "@/lib/types";
import { Button } from "../ui/button";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface CommentLikeButtonProps {
  comment: CommentData;
}

export default function CommentLikeButton({ comment }: CommentLikeButtonProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [likeCount, setLikeCount] = useState(comment._count?.likes || 0);
  const [userLike, setUserLike] = useState<boolean | null>(
    comment.likes?.[0]?.isLike ?? null
  );

  if (!user) return null;

  const handleLike = async (isLike: boolean) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isLike }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        if (userLike === null) {
          // User had no previous interaction
          setLikeCount(prev => prev + 1);
        } else if (userLike !== isLike) {
          // User changed their vote
          setLikeCount(prev => prev + 1);
        } else {
          // User removed their vote
          setLikeCount(prev => prev - 1);
        }
        
        setUserLike(data.isLike);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update like",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLikeCount(prev => prev - 1);
        setUserLike(null);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to remove like",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove like",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => userLike === true ? handleUnlike() : handleLike(true)}
        disabled={isLoading}
        className={`h-8 px-2 ${
          userLike === true
            ? "text-blue-600 hover:text-blue-700"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => userLike === false ? handleUnlike() : handleLike(false)}
        disabled={isLoading}
        className={`h-8 px-2 ${
          userLike === false
            ? "text-red-600 hover:text-red-700"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
} 