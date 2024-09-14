"use client";

import EventDetails from "@/components/events/Event";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import User from "@/components/posts/User";
import kyInstance from "@/lib/ky";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface SearchResultsProps {
  query: string;
  type: "users/posts" | "instruments/skills" | "events";
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
    type === "users/posts"
      ? data?.pages.flatMap((page: any) => {
          const combined = [];
          if (page.users) {
            combined.push(
              ...page.users.map((user: any) => ({ ...user, _type: "user" })),
            );
          }
          if (page.posts) {
            combined.push(
              ...page.posts.map((post: any) => ({ ...post, _type: "post" })),
            );
          }
          return combined;
        }) || []
      : type === "instruments/skills"
        ? data?.pages.flatMap((page: any) => {
            const combined = [];
            if (page.usersWithSkills) {
              combined.push(
                ...page.usersWithSkills.map((user: any) => ({
                  ...user,
                  _type: "skill",
                })),
              );
            }
            if (page.usersWithInstruments) {
              combined.push(
                ...page.usersWithInstruments.map((user: any) => ({
                  ...user,
                  _type: "instrument",
                })),
              );
            }
            return combined;
          }) || []
        : data?.pages.flatMap((page: any) =>
            page.events.map((event: any) => ({ ...event, _type: "event" })),
          ) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !results.length && !hasNextPage) {
    if (!query) {
      return (
        <p className="text-center text-muted-foreground">
          Search for bands, musicians, and event labor.
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
      {results.map((item: any) => {
        if (type === "users/posts") {
          if (item._type === "user") {
            return <User key={item.id} user={item} />;
          } else if (item._type === "post") {
            return <Post key={item.id} post={item} />;
          }
        } else if (type === "instruments/skills") {
          if (item._type === "skill") {
            return <User key={item.id} user={item} />;
            // return (
            //   <div key={item.id}>
            //     <h3>{item.displayName}</h3>
            //     <ul>
            //       {item.userSkills.map((userSkill: any, index: number) => (
            //         <li key={index}>{userSkill.skill.name}</li>
            //       ))}
            //     </ul>
            //   </div>
            // );
          } else if (item._type === "instrument") {
            return <User key={item.id} user={item} />;

            // return (
            //   <div key={item.id}>
            //     <h3>{item.displayName}</h3>
            //     <ul>
            //       {item.userInstruments.map(
            //         (userInstrument: any, index: number) => (
            //           <li key={index}>{userInstrument.instrument.name}</li>
            //         ),
            //       )}
            //     </ul>
            //   </div>
            // );
          }
        } else if (type === "events") {
          return <EventDetails key={item.id} event={item} />;
        }
        return null;
      })}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
