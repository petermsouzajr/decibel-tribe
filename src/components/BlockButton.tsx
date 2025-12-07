"use client";

import kyInstance from "@/lib/ky";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import ConfirmModal from "./ConfirmModal";

interface BlockButtonProps {
  userId: string;
  initiallyBlocked?: boolean;
  onConfirmOpenChange?: (open: boolean) => void;
}

export default function BlockButton({ userId, initiallyBlocked = false, onConfirmOpenChange }: BlockButtonProps) {
  const { toast } = useToast();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Keep local state in sync if the parent provides updated initial state
  useEffect(() => {
    setBlocked(initiallyBlocked);
  }, [initiallyBlocked]);

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
      onConfirmOpenChange?.(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        onClick={() => {
          setConfirmOpen(true);
          onConfirmOpenChange?.(true);
        }}
        disabled={loading}
      >
        {blocked ? "Unblock" : "Block"}
      </Button>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          onConfirmOpenChange?.(false);
        }}
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


