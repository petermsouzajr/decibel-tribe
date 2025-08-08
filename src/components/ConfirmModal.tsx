"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmModal({ open, title, description, confirmLabel = "OK", cancelLabel = "Cancel", loading, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-foreground">{description}</p>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={!!loading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={!!loading}>
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


