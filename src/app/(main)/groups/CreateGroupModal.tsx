"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";

// Define a schema for form validation using Zod
const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
});

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

interface NewGroup {
  name: string;
  description?: string;
}

interface CreatedGroup {
  id: string;
  name: string;
  description?: string;
}

export default function CreateGroupModal({
  open,
  onClose,
}: CreateGroupModalProps) {
  const queryClient = useQueryClient();

  const createGroupMutation = useMutation<
    CreatedGroup,
    Error,
    NewGroup,
    unknown
  >({
    mutationFn: async (newGroup: NewGroup) => {
      const response = await kyInstance.post("/api/groups", { json: newGroup });
      return response.json<CreatedGroup>();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-list"] });
      onClose();
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to create group.");
    },
  });
  const { toast } = useToast();

  const form = useForm<NewGroup>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function handleClose() {
    form.reset({
      name: "",
      description: "",
    });
    onClose();
  }

  function onSubmit(values: NewGroup) {
    toast({
      description: "Group Created",
    });
    createGroupMutation.mutate(values);
    form.reset({
      name: "",
      description: "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Group Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Group Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <DialogFooter>
              <Button
                type="submit"
                className="h-10 bg-primary text-foreground"
                disabled={createGroupMutation.status === "pending"}
              >
                {createGroupMutation.status === "pending"
                  ? "Creating..."
                  : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
