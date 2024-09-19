import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PostEditor from "@/components/posts/editor/PostEditor";
import PostDialogueTitleDropdown from "./PostDialogueTitleDropdown";

interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostDialog({ open, onOpenChange }: PostDialogProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <PostDialogueTitleDropdown setSelectedGroup={setSelectedGroup} />
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <PostEditor onOpenChange={onOpenChange} selectedGroup={selectedGroup} />
      </DialogContent>
    </Dialog>
  );
}
