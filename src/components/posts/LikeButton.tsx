import kyInstance from "@/lib/ky";
import { LikeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Heart, ThumbsUp } from "lucide-react";
import { useToast } from "../ui/use-toast";

export interface LikeButtonProps {
  postId: string;
  initialState: LikeInfo;
}

export default function LikeButton({ postId, initialState }: LikeButtonProps) {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const queryKey: QueryKey = ["like-info", postId];

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance.get(`/api/posts/${postId}/likes`).json<LikeInfo>(),
    initialData: initialState,
    staleTime: Infinity,
    enabled: !!postId,
  });

  const { mutate } = useMutation({
    mutationFn: () =>
      data?.isLikedByUser
        ? kyInstance.delete(`/api/posts/${postId}/likes`)
        : kyInstance.post(`/api/posts/${postId}/likes`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<LikeInfo>(queryKey);

      queryClient.setQueryData<LikeInfo>(queryKey, () => ({
        likes:
          (previousState?.likes || 0) + (previousState?.isLikedByUser ? -1 : 1),
        isLikedByUser: !previousState?.isLikedByUser,
      }));

      return { previousState };
    },
    onError(error, variables, context) {
      queryClient.setQueryData(queryKey, context?.previousState);
      console.error(error);
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    },
  });

  if (!data) {
    return (
      <button className="flex items-center gap-2" disabled>
        <ThumbsUp className="size-4 animate-pulse" />
        <span className="text-xs font-medium tabular-nums">-</span>
      </button>
    );
  }

  const ariaLabel = data.isLikedByUser ? "Unlike post" : "Like post";

  return (
    <button
      onClick={() => mutate()}
      className="flex items-center gap-2"
      aria-label={ariaLabel}
    >
      <ThumbsUp
        className={cn(
          "size-4",
          data.isLikedByUser && "fill-primary text-primary",
        )}
      />
      <span className="text-xs font-medium tabular-nums">{data.likes}</span>
    </button>
  );
}
