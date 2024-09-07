"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Event from "@/components/events/Event"; // Assuming you have an Event component
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { EventsPage } from "@/lib/types";
import EventDetails from "@/components/events/Event";

export default function ForYouFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["event-feed", "for-you"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/events/for-you", // Adjust API endpoint accordingly
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<EventsPage>(), // Define the EventsPage type
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const events = data?.pages.flatMap((page) => page.events) || [];
  // if (!events.length) {
  //   return (
  //     <p className="text-center text-muted-foreground">No events found.</p>
  //   );
  // }

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !events.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">No events found.</p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading events.
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {events.map((event) => (
        <EventDetails key={event.id} event={event} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
