import kyInstance from "@/lib/ky";
import { DislikeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { useToast } from "../ui/use-toast";

interface DislikeButtonProps {
  postId: string;
  initialState: DislikeInfo;
}

export default function DislikeButton({
  postId,
  initialState,
}: DislikeButtonProps) {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const queryKey: QueryKey = ["dislike-info", postId];

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance.get(`/api/posts/${postId}/dislikes`).json<DislikeInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: () =>
      data.isDislikedByUser
        ? kyInstance.delete(`/api/posts/${postId}/dislikes`)
        : kyInstance.post(`/api/posts/${postId}/dislikes`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<DislikeInfo>(queryKey);

      queryClient.setQueryData<DislikeInfo>(queryKey, () => ({
        dislikes:
          (previousState?.dislikes || 0) +
          (previousState?.isDislikedByUser ? -1 : 1),
        isDislikedByUser: !previousState?.isDislikedByUser,
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

  return (
    <button onClick={() => mutate()} className="flex items-center gap-2">
      <ThumbsDown
        className={cn(
          "size-5",
          data.isDislikedByUser && "fill-primary text-primary",
        )}
      />
      <span className="text-sm font-medium tabular-nums">{data.dislikes}</span>
    </button>
  );
}
