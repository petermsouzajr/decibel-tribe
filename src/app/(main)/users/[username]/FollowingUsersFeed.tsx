"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import User from "@/components/posts/User";
import kyInstance from "@/lib/ky";
import { UserWithFollowerStatus } from "@/lib/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface FollowingApiResponse {
  users: UserWithFollowerStatus[];
  nextCursor: string | null;
}

export default function FollowingUsers() {
  const searchParams = useSearchParams();
  const username = searchParams.get("user") ?? "";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery<
      FollowingApiResponse,
      Error,
      InfiniteData<FollowingApiResponse>,
      [string, string],
      string | null
    >({
      queryKey: ["following-users", username],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get("/api/users/following", {
            searchParams: {
              ...(pageParam ? { cursor: pageParam } : undefined),
              ...(username ? { username } : undefined),
            },
          })
          .json<FollowingApiResponse>(),
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
        An error occurred while loading users.
      </p>
    );
  }

  if (users.length === 0 && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        {username
          ? `${username} is not following anyone yet.`
          : "You are not following anyone yet."}
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
