"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface SearchResultsProps {
  query: string;
  type: "posts" | "skills" | "instruments";
}

export default function SearchResults({ query, type }: SearchResultsProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["search-results", query, type],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/search", {
          searchParams: {
            q: query,
            ...(pageParam ? { cursor: pageParam } : {}),
          },
        })
        .json(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    gcTime: 0,
  });

  const results =
    type === "posts"
      ? data?.pages.flatMap((page: any) => page.posts) || []
      : type === "skills"
        ? data?.pages.flatMap((page: any) => page.usersWithSkills) || []
        : data?.pages.flatMap((page: any) => page.usersWithInstruments) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !results.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        No results found for this search.
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
      {type === "posts" &&
        results.map((post: any) => <Post key={post.id} post={post} />)}
      {type === "skills" &&
        results.map((user: any) => (
          <div key={user.id}>
            <h3>{user.displayName}</h3>
            <ul>
              {user.userSkills ||
                [].map((userSkill: any, index: number) => (
                  <li key={index}>{userSkill.skill.name}</li>
                ))}
            </ul>
          </div>
        ))}
      {type === "instruments" &&
        results.map((user: any) => (
          <div key={user.id}>
            <h3>{user.displayName}</h3>
            <ul>
              {user.userInstruments ||
                [].map((userInstrument: any, index: number) => (
                  <li key={index}>{userInstrument.instrument.name}</li>
                ))}
            </ul>
          </div>
        ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
