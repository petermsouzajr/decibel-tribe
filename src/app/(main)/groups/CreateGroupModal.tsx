// src/components/groups/CreateGroupModal.tsx

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { X } from "lucide-react";

interface CreateGroupModalProps {
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

export default function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

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
      // Invalidate and refetch the groups list
      queryClient.invalidateQueries({ queryKey: ["group-list"] });
      onClose();
    },
    onError: (error: Error) => {
      // Handle error (you can enhance this part)
      alert(error.message || "Failed to create group.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGroupMutation.mutate({ name, description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
        {/* Modal Content */}
        <h2 className="mb-4 text-xl font-semibold">Create New Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div>
            <label
              htmlFor="group-name"
              className="block text-sm font-medium text-gray-700"
            >
              Group Name
            </label>
            <input
              id="group-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter group name"
            />
          </div>
          {/* Group Description */}
          <div>
            <label
              htmlFor="group-description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter group description (optional)"
              rows={3}
            ></textarea>
          </div>
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createGroupMutation.status === "pending"}
              className="inline-flex items-center rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {createGroupMutation.status === "pending"
                ? "Creating..."
                : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
