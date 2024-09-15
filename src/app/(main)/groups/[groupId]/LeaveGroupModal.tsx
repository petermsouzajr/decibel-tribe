// src/components/groups/LeaveGroupModal.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Optional: For extra confirmation
import { useRouter } from "next/navigation";
import kyInstance from "@/lib/ky";

interface LeaveGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

export default function LeaveGroupModal({
  open,
  onOpenChange,
  groupId,
  groupName,
}: LeaveGroupModalProps) {
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState("");

  const handleLeave = async () => {
    try {
      await kyInstance.delete(`/api/groups/${groupId}/leave`);
      // toast.success("You have left the group.");
      onOpenChange(false);
      router.push("/groups"); // Redirect to groups page after leaving
    } catch (error) {
      console.error("Error leaving group:", error);
      // toast.error("Failed to leave the group.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Leave Group</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to leave the group <strong>{groupName}</strong>?
        </p>

        <DialogFooter className="mt-4 flex justify-end space-x-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLeave}>
            Leave Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
