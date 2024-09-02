import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useAddEventMutation() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      title,
      location,
      description,
      url,
      when,
      startTime,
      endTime,
      performers,
      status,
      visibility,
    }: {
      title: string;
      location: string;
      description?: string;
      url?: string;
      when: string;
      startTime: string;
      endTime: string;
      performers: string[];
      status: "DRAFT" | "PUBLISHED";
      visibility: "PUBLIC" | "PRIVATE";
    }) => {
      let sanitizedPerformers = performers.filter(
        (performer) => typeof performer === "string" && performer.trim() !== "",
      );
      if (sanitizedPerformers.length === 0) {
        sanitizedPerformers = [""];
      }
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || "",
          location: location || "",
          description: description || "",
          url: url || "",
          when: when || "",
          startTime: startTime || "",
          endTime: endTime || "",
          performers: sanitizedPerformers,
          status: status || "DRAFT",
          visibility: visibility || "PUBLIC",
        }),
      });

      console.log("Response in useAddEventMutation:", response);
      console.log("title in useAddEventMutation:", title);
      console.log("location in useAddEventMutation:", location);
      console.log("description in useAddEventMutation:", description);
      console.log("url in useAddEventMutation:", url);
      console.log("when in useAddEventMutation:", when);
      console.log("startTime in useAddEventMutation:", startTime);
      console.log("endTime in useAddEventMutation:", endTime);
      console.log("performers in useAddEventMutation:", performers);
      console.log("status in useAddEventMutation:", status);
      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const newEvent = await response.json();
      return newEvent;
    },
    onSuccess: async (newEvent) => {
      toast({
        description: "Event successfully created!",
      });

      await queryClient.invalidateQueries({ queryKey: ["events"] });

      router.push(`/events/${newEvent.id}`);
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Failed to create event. Please try again.",
      });
    },
  });

  return mutation;
}

export function useEditEventMutation() {
  const { toast } = useToast();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({
      eventId,
      title,
      location,
      description,
      url,
      when,
      startTime,
      endTime,
      performers,
      status,
      visibility,
    }: {
      eventId: string;
      title: string;
      location: string;
      description: string;
      url: string;
      when: String;
      startTime: string;
      endTime: string;
      performers: string[];
      status: "DRAFT" | "PUBLISHED";
      visibility: "PUBLIC" | "PRIVATE";
    }) => {
      console.log("eventId in useEditEventMutation:", eventId);
      return fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          location,
          description,
          url,
          when,
          startTime,
          endTime,
          performers,
          status,
          visibility,
        }),
      });
    },
    onSuccess: () => {
      toast({
        description: "Event details saved!",
      });
      router.push("/events");
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Failed to update event. Please try again.",
      });
    },
  });

  return mutation;
}
