"use client";
import { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEventSchema,
  CreateEventValues,
  draftEventSchema,
  EditEventValues,
} from "@/lib/validation";
import {
  useAddEventMutation,
  useEditEventMutation,
} from "../../calendar/mutations";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

interface Event {
  id: string;
  title: string;
  location: string;
  description?: string;
  url?: string;
  when: string;
  startTime: string;
  endTime: string;
  performers: string[];
  status: "DRAFT" | "PUBLISHED";
}

export default function EventFormPage({ event }: { event: Event }) {
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [performerCount, setPerformerCount] = useState<number>(1);
  const [error, setError] = useState<string>();
  const MAX_PERFORMERS = 15;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const [eventData, setEventData] = useState<any>(null);

  const isEditing = Boolean(eventId);
  const editMutation = useEditEventMutation();
  const addMutation = useAddEventMutation();

  const form = useForm<CreateEventValues>({
    resolver: zodResolver(
      status === "DRAFT" ? draftEventSchema : createEventSchema,
    ),
    defaultValues: {
      title: event?.title || "",
      location: event?.location || "",
      description: event?.description || "",
      url: event?.url || "",
      when: event?.when || "",
      startTime: event?.startTime || "",
      endTime: event?.endTime || "",
      performers:
        event?.performers?.length > 0
          ? event.performers
          : Array(performerCount).fill(""),
      status: event?.status,
    },
  });

  const onSubmit: SubmitHandler<CreateEventValues | EditEventValues> = async (
    data,
  ) => {
    console.log("isediting", isEditing);
    console.log("eventid", eventId);
    console.log("data in onSubmit:", data);
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("currens status in onSubmit:", status);
    const currentSchema =
      status === "DRAFT" ? draftEventSchema : createEventSchema;
    console.log("currens currentSchema in onSubmit:", currentSchema);

    // Validate using the correct schema
    const parsedData = currentSchema.safeParse(data);
    if (!parsedData.success) {
      setError("Validation error occurred");
      setIsSubmitting(false);
      return;
    }

    let sanitizedPerformers = data.performers.filter(
      (performer) => performer.trim() !== "",
    );

    console.log("data in onSubmit:", data);
    console.log("eventId in onSubmit:", event);
    // event = data;
    // console.log("eventData in onSubmit after data:", eventData.id);?
    const finalData = isEditing
      ? {
          ...data,
          performers:
            sanitizedPerformers.length > 0 ? sanitizedPerformers : [""],
          eventId: eventData.id,
        }
      : {
          ...data,
          performers:
            sanitizedPerformers.length > 0 ? sanitizedPerformers : [""],
        };

    const mutation = isEditing ? editMutation : addMutation;

    mutation.mutate(finalData, {
      onSuccess: (newEvent: { id: string }) => {
        router.push(`/events/${isEditing ? eventData.id : newEvent.id}`);
      },
      onError: (error: any) => {
        console.error(
          setIsSubmitting(false),
          isEditing ? "Failed to update event" : "Failed to create event",
          error,
        );
        setError(
          isEditing
            ? "Failed to update event. Please try again."
            : "Failed to create event. Please try again.",
        );
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  useEffect(() => {
    if (eventId) {
      console.log("Fetching event data for eventId:", eventId);
      console.log("form in useEffect:", form);
      fetch(`/api/events/${eventId}`, {
        method: "GET",
        credentials: "include", // Include cookies in the request
      })
        .then((response) => {
          console.log("Fetch response status:", response.status);
          if (!response.ok) {
            throw new Error(`Fetch error: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Fetched event data:", data);
          setEventData(data);
          form.reset({
            title: data.title || "",
            location: data.location || "",
            description: data.description || "",
            url: data.url || "",
            when: data.when || "",
            startTime: data.startTime || "",
            endTime: data.endTime || "",
            performers: data.performers.length > 0 ? data.performers : [""],
            status: data.status || "DRAFT",
          });
          setPerformerCount(data.performers.length || 1);
        })
        .catch((error) => {
          console.error("Failed to fetch event data:", error);
        });
    }
  }, [eventId, form]);

  const addPerformer = () => {
    if (performerCount < MAX_PERFORMERS) {
      setPerformerCount(performerCount + 1);
    }
  };

  const handleSaveAsDraft = () => {
    setStatus("DRAFT");
    form.setValue("status", "DRAFT");
    form.handleSubmit(onSubmit)();
  };

  const handlePublishEvent = () => {
    setStatus("PUBLISHED");
    form.setValue("status", "PUBLISHED");
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="container max-w-xl p-4">
      <h1 className="mb-6 text-center text-2xl font-bold">
        {eventId ? "Edit Event" : "Create New Event"}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Event Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Event Location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Event Description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event URL</FormLabel>
                <FormControl>
                  <Input placeholder="Event URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="when"
            render={({ field }) => (
              <FormItem>
                <FormLabel>When</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {Array.from({ length: performerCount }).map((_, index) => (
            <FormField
              key={index}
              control={form.control}
              name={`performers.${index}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Performer {index + 1}</FormLabel>
                  <FormControl>
                    <Input placeholder="Performer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button
            type="button"
            onClick={addPerformer}
            disabled={performerCount >= MAX_PERFORMERS}
            className="mt-2 w-full bg-secondary text-foreground"
          >
            {performerCount >= MAX_PERFORMERS
              ? "Maximum number of performers is 15"
              : "+ Add Another Performer"}
          </Button>

          <div className="flex justify-between pt-8">
            <Button
              className="h-10 w-1/3 bg-secondary-foreground"
              type="button"
              onClick={handleSaveAsDraft}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              className="h-10 w-1/3"
              type="button"
              onClick={handlePublishEvent}
              disabled={isSubmitting}
            >
              {isEditing ? "Update Event" : "Publish Event"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
