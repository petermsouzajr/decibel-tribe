"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import User from "@/components/posts/User";
import kyInstance from "@/lib/ky";
import { UserData } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function FollowersPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get("user") ?? "";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery<{ users: UserData[]; nextCursor: string | null }, Error>({
      queryKey: ["followers-users", username],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get("/api/users/followed-by", {
            searchParams: {
              ...(pageParam ? { cursor: pageParam as string } : undefined),
              ...(username ? { username } : undefined),
            },
          })
          .json<{ users: UserData[]; nextCursor: string | null }>(),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: null, // Add this line
    });

  const users = data?.pages.flatMap((page) => page.users) || [];

  if (status === "pending") {
    return <p>Loading...</p>;
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading followers.
      </p>
    );
  }

  if (users.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        {username
          ? `${username} has no followers yet.`
          : "You have no followers yet."}
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && fetchNextPage()}
    >
      {users.map((user) => (
        <User key={user.id} user={user} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
