"use client";

import { deleteUserAccount, exportUserData, DeleteAccountFormData } from "@/app/(auth)/deleteAccount";
import { logout } from "@/app/(auth)/actions";
import { useSession } from "@/app/(main)/SessionProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Download, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [step, setStep] = useState<"warning" | "confirmation">("warning");

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await exportUserData();
      
      if (result.success && result.data) {
        // Create and download JSON file
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `user-data-${user.username}-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Data exported successfully",
          description: "Your data has been downloaded as a JSON file.",
        });
      } else {
        toast({
          title: "Export failed",
          description: result.error || "Failed to export data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An unexpected error occurred while exporting data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password to confirm account deletion",
        variant: "destructive",
      });
      return;
    }

    if (!confirmDeletion) {
      toast({
        title: "Confirmation required",
        description: "Please confirm that you want to delete your account",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const formData: DeleteAccountFormData = {
        password,
        confirmDeletion,
      };

      const result = await deleteUserAccount(formData);

      if (result.success) {
        toast({
          title: "Account deleted",
          description: "Your account has been successfully deleted. You will be logged out.",
        });

        // Logout and redirect
        await logout();
        router.push("/login");
      } else {
        toast({
          title: "Deletion failed",
          description: result.error || "Failed to delete account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "An unexpected error occurred while deleting your account",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setConfirmDeletion(false);
    setStep("warning");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            {step === "warning" 
              ? "This action cannot be undone. All your data will be permanently removed."
              : "Please confirm your password to permanently delete your account."
            }
          </DialogDescription>
        </DialogHeader>

        {step === "warning" ? (
          <>
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 p-4">
                <h4 className="font-semibold text-destructive mb-2">
                  What happens when you delete your account:
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• All your posts and comments will be removed</li>
                  <li>• You'll be removed from all groups</li>
                  <li>• All your likes, dislikes, and bookmarks will be deleted</li>
                  <li>• Your profile will no longer be visible to other users</li>
                  <li>• You'll be logged out immediately</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export My Data First"}
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => setStep("confirmation")}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Continue to Delete Account
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="confirm-deletion"
                  checked={confirmDeletion}
                  onChange={(e) => setConfirmDeletion(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="confirm-deletion" className="text-sm">
                  I understand that this action is permanent and cannot be undone
                </Label>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("warning")}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting || !password || !confirmDeletion}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 