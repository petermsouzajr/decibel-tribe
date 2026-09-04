"use client";

import { login } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeletedAccountRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  password: string;
  deletedAt: Date;
  daysRemaining?: number;
  isExpired: boolean;
  userId: string;
}

export default function DeletedAccountRecoveryDialog({
  open,
  onOpenChange,
  username,
  password,
  deletedAt,
  daysRemaining,
  isExpired,
  userId,
}: DeletedAccountRecoveryDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"reactivate" | "fresh" | null>(null);

  const handleReactivate = async () => {
    setIsLoading(true);
    setAction("reactivate");

    try {
      const response = await fetch("/api/users/reactivate-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, password }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Account reactivated",
          description:
            "Your account has been successfully reactivated. You can now log in.",
        });

        // Wait a moment for StreamChat to sync, then try to log in
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Now try to log in with the original credentials
        const loginResult = await login(new FormData());

        if (
          loginResult?.error &&
          loginResult.error !== "Invalid username or password"
        ) {
          toast({
            title: "Account Reactivated",
            description:
              "Your account has been reactivated successfully. Please try logging in manually now.",
          });
          // Close dialog and let user try logging in manually
          onOpenChange(false);
        } else {
          // Success - redirect will happen automatically
          router.push("/");
        }
      } else {
        toast({
          title: "Reactivation failed",
          description: result.error || "Failed to reactivate account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Reactivation failed",
        description:
          "An unexpected error occurred while reactivating your account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setAction(null);
      onOpenChange(false);
    }
  };

  const handleFreshStart = async () => {
    setIsLoading(true);
    setAction("fresh");

    try {
      // For fresh start, we'll redirect to signup with the username pre-filled
      // The user can create a new account with the same username
      router.push(`/signup?username=${encodeURIComponent(username)}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setAction(null);
      onOpenChange(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Account Deleted
          </DialogTitle>
          <DialogDescription>
            {isExpired
              ? "Your account was deleted and the recovery period has expired."
              : `Your account was deleted on ${formatDate(deletedAt)}. You have ${daysRemaining} days remaining to recover it.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isExpired && (
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
              <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                Recover Your Account
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You can reactivate your account and restore all your data,
                posts, and connections.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950">
            <h4 className="mb-2 font-semibold text-orange-900 dark:text-orange-100">
              Start Fresh
            </h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Create a new account with the same username. All previous data
              will remain deleted.
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>• Reactivating will restore all your previous data</p>
            <p>• Starting fresh will create a completely new account</p>
            <p>• Your previous data will remain permanently deleted</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>

          {!isExpired && (
            <Button
              onClick={handleReactivate}
              disabled={isLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isLoading && action === "reactivate"
                ? "Reactivating..."
                : "Reactivate Account"}
            </Button>
          )}

          <Button
            onClick={handleFreshStart}
            disabled={isLoading}
            variant="destructive"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isLoading && action === "fresh" ? "Redirecting..." : "Start Fresh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
