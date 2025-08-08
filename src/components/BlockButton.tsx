"use client";

import kyInstance from "@/lib/ky";
import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import ConfirmModal from "./ConfirmModal";

interface BlockButtonProps {
  userId: string;
  initiallyBlocked?: boolean;
}

export default function BlockButton({ userId, initiallyBlocked = false }: BlockButtonProps) {
  const { toast } = useToast();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const runToggle = async () => {
    try {
      setLoading(true);
      if (blocked) {
        await kyInstance.delete(`/api/users/${userId}/blocks`);
        setBlocked(false);
        toast({ description: "User unblocked." });
      } else {
        await kyInstance.post(`/api/users/${userId}/blocks`);
        setBlocked(true);
        toast({ description: "User blocked. You will no longer see their content." });
      }
    } catch (e) {
      toast({ variant: "destructive", description: "Failed to update block setting." });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Button variant={blocked ? "secondary" : "outline"} onClick={() => setConfirmOpen(true)} disabled={loading}>
        {blocked ? "Unblock" : "Block"}
      </Button>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runToggle}
        loading={loading}
        title={blocked ? "Unblock this user?" : "Block this user?"}
        description={
          blocked
            ? "You will start seeing this user's content again. You can block them anytime from their profile or menus."
            : "Their content and events will no longer be visible to you. Your content will still be visible to them. You can unblock them at any time from your profile's Blocked Users section."
        }
        confirmLabel={blocked ? "Unblock" : "Block"}
      />
    </>
  );
}


