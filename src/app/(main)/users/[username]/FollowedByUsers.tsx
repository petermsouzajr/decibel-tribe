"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import User from "@/components/posts/User";
import kyInstance from "@/lib/ky";
import { UserWithFollowerStatus } from "@/lib/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface FollowedByApiResponse {
  users: UserWithFollowerStatus[];
  nextCursor: string | null;
}

export default function FollowersPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get("user") ?? "";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery<
      FollowedByApiResponse,
      Error,
      InfiniteData<FollowedByApiResponse>,
      [string, string],
      string | null
    >({
      queryKey: ["followers-users", username],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get("/api/users/followed-by", {
            searchParams: {
              ...(pageParam ? { cursor: pageParam } : undefined),
              ...(username ? { username } : undefined),
            },
          })
          .json<FollowedByApiResponse>(),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: null,
    });

  const users = data?.pages.flatMap((page) => page.users) || [];

  if (status === "pending") {
    return <Loader2 className="mx-auto my-3 animate-spin" />;
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading followers.
      </p>
    );
  }

  if (users.length === 0 && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        {username
          ? `${username} has no followers yet.`
          : "This user has no followers yet."}
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() =>
        hasNextPage && !isFetchingNextPage && fetchNextPage()
      }
    >
      {users.map((user) => (
        <User key={user.id} user={user} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
