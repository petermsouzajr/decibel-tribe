import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ConfirmDeletionModalProps } from "@/lib/types";
import { FormButton } from "@/components/ui/form";

const ConfirmDeletionModal: React.FC<ConfirmDeletionModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose onClick={onCancel} />
        </DialogHeader>
        <div className="p-4 text-center">{message}</div>
        <div className="flex justify-end space-x-4">
          <FormButton onClick={onCancel} variant="secondary">
            Cancel
          </FormButton>
          <FormButton onClick={onConfirm} variant="destructive">
            Delete
          </FormButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeletionModal;
