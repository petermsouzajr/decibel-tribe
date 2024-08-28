// import React, { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
//   DialogClose, // Assuming you have a close button component
// } from "@/components/ui/dialog";
// import { EventDetailsModalProps } from "@/lib/types";
// import { format, parse, formatDate } from "date-fns";

// const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
//   isOpen,
//   events,
//   onClose,
// }) => {
//   const [editingIndex, setEditingIndex] = useState<number | null>(null);
//   const [selectedDay, setSelectedDay] = useState<Date | null>(null);
//   const [originalTitle, setOriginalTitle] = useState<string>("");
//   const [editedTitle, setEditedTitle] = useState<string>("");
//   const [editedStartTime, setEditedStartTime] = useState<string>("");
//   const [editedEndTime, setEditedEndTime] = useState<string>("");

//   const handleRowClick = (
//     index: number,
//     title: string,
//     detail: { startTime: string; endTime: string },
//   ) => {
//     setEditingIndex(index);
//     setOriginalTitle(title);
//     setEditedTitle(title);
//     setEditedStartTime(detail.startTime);
//     setEditedEndTime(detail.endTime);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>
//             <h3 className="text-center text-lg font-bold">
//               {editingIndex !== null ? "Editing " : ""}Events on{" "}
//               {/* {format(selectedDay!, "PP")} */}
//             </h3>
//           </DialogTitle>
//           <DialogClose onClick={onClose} />
//         </DialogHeader>
//         <div className="space-y-4 p-4">
//           {events.length > 0 ? (
//             events.map((event, index) =>
//               event.details.map((detail, detailIndex) => (
//                 <div
//                   key={`${index}-${detailIndex}`}
//                   className="rounded-lg border p-2"
//                   onClick={() =>
//                     editingIndex === null &&
//                     handleRowClick(index, event.title, detail)
//                   }
//                 >
//                   <h3 className="text-lg font-semibold">{event.title}</h3>
//                   <p>{event.title || "No additional details provided."}</p>
//                   {event.details.map((detail, idx) => (
//                     <p key={idx} className="text-sm">
//                       <strong>Time:</strong>{" "}
//                       {formatDate(
//                         parse(detail.startTime, "HH:mm", new Date()),
//                         "hh:mm a",
//                       )}{" "}
//                       -{" "}
//                       {formatDate(
//                         parse(detail.endTime, "HH:mm", new Date()),
//                         "hh:mm a",
//                       )}
//                     </p>
//                   ))}
//                 </div>
//               )),
//             )
//           ) : (
//             <p>No events to display.</p>
//           )}
//         </div>
//         <DialogFooter>
//           <button
//             onClick={onClose}
//             className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
//           >
//             Close
//           </button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default EventDetailsModal;
