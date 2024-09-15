"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchIcon } from "lucide-react";
import kyInstance from "@/lib/ky";
import { useQuery } from "@tanstack/react-query";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface SearchUsersResponse {
  users: User[];
}

const searchUserSchema = z.object({
  query: z.string().min(1, "Please enter a search term."),
});

type SearchUserForm = z.infer<typeof searchUserSchema>;

export default function AddUserModal({
  open,
  onOpenChange,
  groupId,
}: AddUserModalProps) {
  const form = useForm<SearchUserForm>({
    resolver: zodResolver(searchUserSchema),
    defaultValues: {
      query: "",
    },
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    data: searchResults,
    refetch,
    isFetching,
  } = useQuery<SearchUsersResponse, Error>({
    queryKey: ["search-users", form.watch("query")],
    queryFn: () => {
      const query = form.getValues("query");
      if (!query) return Promise.resolve({ users: [] });
      return kyInstance
        .get(`/api/search`, { searchParams: { q: query } })
        .json<SearchUsersResponse>();
    },
    enabled: false,
  });

  const handleSubmit = async (values: SearchUserForm) => {
    // Fetch users based on the search query
    await refetch();
  };

  const handleAddUser = async () => {
    if (!selectedUser) return;

    try {
      await kyInstance.post(`/api/groups/${groupId}/add-user`, {
        json: { userId: selectedUser.id },
      });

      // Optionally, show a success message or update the UI accordingly
      onOpenChange(false);
      // You might want to refresh the group members list here
    } catch (error) {
      console.error("Error adding user to group:", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add User to Group</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search Users</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Enter username or email"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setSelectedUser(null); // Reset selected user on new search
                        }}
                      />
                      <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isFetching}>
                {isFetching ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Display search results */}
        {searchResults && searchResults.users.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.users.map((user) => (
              <div
                key={user.id}
                className={`flex cursor-pointer items-center justify-between rounded border p-2 ${
                  selectedUser?.id === user.id
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {selectedUser?.id === user.id && <span>Selected</span>}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddUser}
            disabled={!selectedUser}
            className="ml-2"
          >
            Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
