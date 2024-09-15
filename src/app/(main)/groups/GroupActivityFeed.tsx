"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { PostData } from "@/lib/types"; // Import group data type if needed
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";

// Update the PostData type and GroupData if necessary to include group details
export default function GroupActivityFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["group-activity"],
      queryFn: ({ pageParam }: { pageParam?: string | null }) =>
        kyInstance
          .get("/api/posts/group-activity", {
            searchParams: pageParam ? { cursor: pageParam } : {},
          })
          .json<{ posts: PostData[]; nextCursor: string | null }>(),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: null,
    });

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) || [],
    [data],
  );

  // Step 1: Group the posts by groupId (or "Public" if not part of any group)
  const groupedPosts = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        const groupId = post.groupId || "Public";
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push(post);
        return acc;
      },
      {} as Record<string, PostData[]>,
    ); // The object to store grouped posts
  }, [posts]);

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading group activity.
      </p>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No recent activity in your groups.
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && fetchNextPage()}
    >
      {/* Step 2: Render grouped posts with group headings */}
      {Object.keys(groupedPosts).map((groupId) => (
        <div key={groupId}>
          {/* Group heading: show group name or "Public" if it's not part of any group */}
          <div className="rounded-lg bg-card p-4 shadow">
            {groupId === "Public" ? (
              <h2 className="text-lg font-bold">Public Posts</h2>
            ) : (
              <>
                <Link href={`/groups/${groupId}`}>
                  <h2 className="text-lg font-bold">
                    Group: {groupedPosts[groupId][0].Group?.name}
                  </h2>
                </Link>
              </>
            )}
          </div>

          {/* Render posts under the group heading */}
          {groupedPosts[groupId].map((post) => (
            <div key={post.id} className="m-3">
              <Post key={post.id} post={post} />
            </div>
          ))}
        </div>
      ))}

      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
