"use client";
import { useEffect, useState } from "react";
import {
  Form,
  FormCheckbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSwitch,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, CreateEventValues } from "@/lib/validation";
import {
  useAddEventMutation,
  useEditEventMutation,
} from "../../calendar/mutations";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";

export default function EventFormPage(event: any) {
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [loadingStatus, setLoadingStatus] = useState<"pending" | "complete">(
    "complete",
  );
  const [performerCount, setPerformerCount] = useState<number>(1);
  const [error, setError] = useState<string>();
  const MAX_PERFORMERS = 15;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const [eventData, setEventData] = useState<any>(null);
  const [defaultVisibility, setDefaultVisibility] = useState<
    "PUBLIC" | "PRIVATE"
  >("PRIVATE");

  const isEditing = Boolean(eventId);
  const editMutation = useEditEventMutation();
  const addMutation = useAddEventMutation();
  const dateParam = searchParams.get("date");
  const parsedDate = dateParam ? new Date(dateParam) : null;

  const form = useForm<CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: event?.title || "",
      location: event?.location || "",
      description: event?.description || "",
      url: event?.url || "",
      when: event?.when ? new Date(event.when) : parsedDate || new Date(),
      startTime: event?.startTime || "",
      endTime: event?.endTime || "",
      performers:
        event?.performers && event?.performers.length > 0
          ? event.performers
          : [""],
      status: event?.status,
      visibility: event.visibility || defaultVisibility,
      isCancelled: event?.isCancelled || false,
    },
  });

  const onSubmit: SubmitHandler<CreateEventValues> = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Validate using the correct schema
    const parsedData = createEventSchema.safeParse(data);
    if (!parsedData.success) {
      setError("Validation error occurred");
      setIsSubmitting(false);
      return;
    }

    let sanitizedPerformers = data.performers?.filter(
      (performer) => performer?.trim() !== "",
    );

    const finalData = isEditing
      ? {
          ...data,
          performers: sanitizedPerformers?.length ? sanitizedPerformers : [""],
          eventId: eventData.id,
        }
      : {
          ...data,
          performers: sanitizedPerformers?.length ? sanitizedPerformers : [""],
        };

    const mutation = isEditing ? editMutation : addMutation;

    // @ts-ignore
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
    const fetchUserCalendarPreference = async () => {
      try {
        const response = await fetch(`/api/users/preferences`, {
          method: "GET",
          credentials: "include", // Include cookies in the request
        });
        const data = await response.json();
        if (data?.calendarPreference) {
          setDefaultVisibility(data.calendarPreference);
          form.setValue("visibility", data.calendarPreference); // Set form value based on preference
        } else {
          setDefaultVisibility("PRIVATE");
        }
      } catch (error) {
        console.error("Error fetching user calendar preference:", error);
        setDefaultVisibility("PRIVATE");
        form.setValue("visibility", "PRIVATE"); // Default to PRIVATE if error
      }
    };

    fetchUserCalendarPreference();

    if (eventId) {
      setLoadingStatus("pending"); // Start loading

      fetch(`/api/events/${eventId}`, {
        method: "GET",
        credentials: "include", // Include cookies in the request
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Fetch error: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          setEventData(data);
          form.reset({
            title: data.title || "",
            location: data.location || "",
            description: data.description || "",
            url: data.url || "",
            when: data.when ? new Date(data.when) : new Date(),
            startTime: data.startTime || "",
            endTime: data.endTime || "",
            performers: data.performers.length > 0 ? data.performers : [""],
            status: data.status || "DRAFT",
            visibility: data.visibility || defaultVisibility,
            isCancelled: data.isCancelled || false,
          });
          setPerformerCount(data.performers.length || 1);
          setLoadingStatus("complete"); // Finish loading
        })
        .catch((error) => {
          console.error("Failed to fetch event data:", error);
          setLoadingStatus("complete"); // Finish loading
        });
    }
  }, [eventId, form, defaultVisibility]);

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

  if (loadingStatus === "pending") {
    return <PostsLoadingSkeleton />; // Render loading skeleton
  }
  return (
    <div className="container max-w-xl p-4">
      <h1 className="mb-6 text-center text-2xl font-bold">
        {eventId ? "Edit Event" : "Create New Event"}
      </h1>

      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <FormControl>
                  <FormSwitch values={["PRIVATE", "PUBLIC"]} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <Input
                    type="date"
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      field.onChange(new Date(e.target.value + "T00:00:00"))
                    }
                  />
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
                    <Input
                      placeholder="Performer"
                      {...field}
                      value={field.value || ""}
                    />
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
          <FormField
            control={form.control}
            name="isCancelled"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  {/* @ts-ignore */}
                  <FormCheckbox
                    {...field}
                    checked={field.value}
                    uncheckedLabel="Mark your event as Cancelled"
                    checkedLabel="Your event is marked as Cancelled"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEditing && eventData && (
            <div className="textlgd mb-4 text-left font-bold text-muted-foreground">
              Your event Status is: {eventData.status}
            </div>
          )}
          <div className="flex justify-between pt-8">
            <Button
              className="h-10 w-1/3 bg-secondary-foreground"
              type="button"
              onClick={handleSaveAsDraft}
              disabled={isSubmitting}
            >
              {isEditing ? "Update as Draft" : "Save as Draft"}
            </Button>
            <Button
              className="h-10 w-1/3"
              type="button"
              onClick={handlePublishEvent}
              disabled={isSubmitting}
            >
              {isEditing ? "Update as Published" : "Publish Event"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
