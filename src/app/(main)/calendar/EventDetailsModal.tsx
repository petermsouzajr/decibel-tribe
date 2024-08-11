import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Event } from "@/lib/types";
import { format, parse, formatDate } from "date-fns";

interface EventDetailsModalProps {
  isOpen: boolean;
  events: Event[];
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  events,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>{/* Modal content for event details */}</DialogContent>
    </Dialog>
  );
};

export default EventDetailsModal;
