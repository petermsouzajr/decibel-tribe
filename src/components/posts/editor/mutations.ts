import { useSession } from "@/app/(main)/SessionProvider";
import { useToast } from "@/components/ui/use-toast";
import { PostsPage, PostData, UserWithFollowerStatus } from "@/lib/types";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { submitPost } from "./actions";

export function useSubmitPostMutation() {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: submitPost,
    onSuccess: async (newPost: PostData, variables) => {
      const isPublicPost = !variables.groupId;

      if (isPublicPost) {
        const queryFilter = {
          queryKey: ["post-feed"],
          predicate(query: any) {
            return (
              query.queryKey.includes("for-you") ||
              (query.queryKey.includes("user-posts") &&
                query.queryKey.includes(user.id))
            );
          },
        } as QueryFilters;

        await queryClient.cancelQueries(queryFilter as QueryFilters);

        queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
          { queryKey: queryFilter.queryKey },
          (oldData): InfiniteData<PostsPage, string | null> | undefined => {
            const typedNewPost = newPost as PostData;
            const firstPage = oldData?.pages[0];

            if (firstPage) {
              const existingPosts = firstPage.posts as PostData[];
              return {
                pageParams: oldData.pageParams,
                pages: [
                  {
                    posts: [typedNewPost, ...existingPosts],
                    nextCursor: firstPage.nextCursor,
                  },
                  ...oldData.pages.slice(1),
                ],
              };
            } else {
              return {
                pageParams: [],
                pages: [
                  {
                    posts: [typedNewPost],
                    nextCursor: null,
                  },
                ],
              };
            }
          },
        );

        queryClient.invalidateQueries({
          queryKey: queryFilter.queryKey,
          predicate: queryFilter.predicate,
        });
      } else {
        const groupId = variables.groupId;
        const queryKey = ["group-posts", groupId];

        await queryClient.cancelQueries({ queryKey });

        queryClient.setQueryData<InfiniteData<PostsPage>>(
          queryKey,
          (oldData): InfiniteData<PostsPage> | undefined => {
            const typedNewPost = newPost as PostData;
            const firstPage = oldData?.pages[0];

            if (firstPage) {
              const existingPosts = firstPage.posts as PostData[];
              return {
                pageParams: oldData.pageParams,
                pages: [
                  {
                    posts: [typedNewPost, ...existingPosts],
                    nextCursor: firstPage.nextCursor,
                  },
                  ...oldData.pages.slice(1),
                ],
              };
            } else {
              return {
                pageParams: [],
                pages: [
                  {
                    posts: [typedNewPost],
                    nextCursor: null,
                  },
                ],
              };
            }
          },
        );

        queryClient.invalidateQueries({ queryKey });
      }

      toast({
        description: "Post created",
      });
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Failed to post. Please try again.",
      });
    },
  });

  return mutation;
}
