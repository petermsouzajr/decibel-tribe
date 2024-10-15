"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import kyInstance from "@/lib/ky";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  description?: string;
  acceptedInvite: boolean;
}

export default function GroupList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["group-list"],
      queryFn: ({ pageParam }: { pageParam?: string | null }) =>
        kyInstance
          .get("/api/groups/my-groups", {
            searchParams: pageParam ? { cursor: pageParam } : {},
          })
          .json<{ groups: Group[]; nextCursor: string | null }>(),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: null,
    });

  const groups = data?.pages.flatMap((page) => page.groups) || [];

  if (status === "pending") {
    return <p>Loading groups...</p>;
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading groups.
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        You are not a member of any groups.
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && fetchNextPage()}
    >
      {groups.map((group) => (
        <Link
          key={group.id}
          href={`/groups/${group.id}`}
          className="block cursor-pointer rounded-lg bg-card p-4 shadow hover:bg-opacity-90"
        >
          <h2 className="text-lg font-bold">{group.name}</h2>
          {group.description && <p className="text-sm">{group.description}</p>}
        </Link>
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
