import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDeletionModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeletionModal: React.FC<ConfirmDeletionModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => (isOpen ? null : onCancel())}
    >
      <DialogContent>{/* Confirmation content */}</DialogContent>
      <DialogFooter>{/* Action buttons */}</DialogFooter>
    </Dialog>
  );
};

export default ConfirmDeletionModal;
