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
  acceptedInvite: boolean; // Ensure this field is returned from the API
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
        <div key={group.id} className="rounded-lg bg-card p-4 shadow">
          <Link href={`/groups/${group.id}`}>{group.name}</Link>
          {group.description && <p className="text-sm">{group.description}</p>}
        </div>
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
