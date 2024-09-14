import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PostEditor from "@/components/posts/editor/PostEditor";

interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostDialog({ open, onOpenChange }: PostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
        </DialogHeader>
        <PostEditor onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}
