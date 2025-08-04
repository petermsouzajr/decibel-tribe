"use client";

import EventDetails from "@/components/events/Event";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import User from "@/components/posts/User";
import kyInstance from "@/lib/ky";
import { EventData, PostData, UserWithFollowerStatus } from "@/lib/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface SearchResultsProps {
  query: string;
}

interface SearchApiResponse {
  users: UserWithFollowerStatus[];
  posts: PostData[];
  events: EventData[];
  nextCursor: string | null;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery<
    SearchApiResponse,
    Error,
    InfiniteData<SearchApiResponse>,
    [string, string],
    string | null
  >({
    queryKey: ["search-results", query],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/search", {
          searchParams: {
            q: query,
            ...(pageParam ? { cursor: pageParam } : {}),
          },
        })
        .json<SearchApiResponse>(),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    gcTime: 0,
  });

  const results =
    data?.pages.flatMap((page) => {
      const combined: (
        | (UserWithFollowerStatus & { _type: "user" })
        | (PostData & { _type: "post" })
        | (EventData & { _type: "event" })
      )[] = [];
      if (page.users) {
        combined.push(
          ...page.users.map((user) => ({ ...user, _type: "user" as const })),
        );
      }
      if (page.posts) {
        combined.push(
          ...page.posts.map((post) => ({ ...post, _type: "post" as const })),
        );
      }
      if (page.events) {
        combined.push(
          ...page.events.map((event) => ({
            ...event,
            _type: "event" as const,
          })),
        );
      }
      return combined;
    }) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !results.length && !hasNextPage) {
    if (!query) {
      return (
        <p className="text-center text-muted-foreground">
          Search for bands, musicians, posts, and events.
        </p>
      );
    }
    return (
      <p className="text-center text-muted-foreground">
        No results found for {query}.
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading search results.
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {results.map((item) => {
        if (item._type === "user") {
          return <User key={`user-${item.id}`} user={item} />;
        } else if (item._type === "post") {
          return <Post key={`post-${item.id}`} post={item} />;
        } else if (item._type === "event") {
          return <EventDetails key={`event-${item.id}`} event={item} />;
        }
        return null;
      })}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
