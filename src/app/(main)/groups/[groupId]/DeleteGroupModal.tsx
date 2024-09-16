"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input"; // Import input component
import kyInstance from "@/lib/ky";
import { useState } from "react";

interface DeleteGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string; // Pass the group name for confirmation
}

export default function DeleteGroupModal({
  open,
  onOpenChange,
  groupId,
  groupName, // Use group name in the modal
}: DeleteGroupModalProps) {
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState(""); // Track input for group name

  const handleDelete = async () => {
    try {
      await kyInstance.delete(`/api/groups/${groupId}`);
      onOpenChange(false);
      router.push("/groups"); // Redirect to groups page after deletion
    } catch (error) {
      console.error("Error deleting group:", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Group: {groupName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-destructive">
          Are you sure you want to delete this group? This action cannot be
          undone.
        </p>
        <p className="mt-2 text-sm">
          Please type the group&apos;s name (<strong>{groupName}</strong>) to
          confirm:
        </p>
        <Input
          className="mt-4"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder={`Type '${groupName}' to confirm`}
        />
        <DialogFooter className="flex-row justify-end space-x-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmationText !== groupName}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
