// "use client";

// import { useSession } from "@/app/(main)/SessionProvider";
// import LoadingButton from "@/components/LoadingButton";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import { EditorContent, useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { useEditEventMutation } from "./mutations";
// import "./styles.css";

// export default function EventEditor({ event }: { event: Event }) {
//   const { user } = useSession();
//   const router = useRouter();

//   const mutation = useEditEventMutation();

//   const [title, setTitle] = useState(event.title);
//   const [where, setWhere] = useState(event.where);
//   const [details, setDetails] = useState(event.details);
//   const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");

//   const editor = useEditor({
//     extensions: [
//       StarterKit.configure({
//         bold: false,
//         italic: false,
//       }),
//     ],
//   });

//   function onSubmit() {
//     mutation.mutate(
//       {
//         eventId: event.id,
//         title,
//         where,
//         details,
//         status,
//       },
//       {
//         onSuccess: () => {
//           router.push(`/events/${event.id}`);
//         },
//       },
//     );
//   }

//   function handleDetailChange(index: number, key: string, value: any) {
//     const updatedDetails = details.map((detail, i) =>
//       i === index ? { ...detail, [key]: value } : detail,
//     );
//     setDetails(updatedDetails);
//   }

//   return (
//     <div className="flex flex-col gap-5 rounded-2xl border-2 bg-card p-5 shadow-sm">
//       <div className="flex flex-col gap-3">
//         <label>Title</label>
//         <input
//           type="text"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           className="rounded-2xl bg-background px-5 py-3"
//         />
//       </div>
//       <div className="flex flex-col gap-3">
//         <label>Location</label>
//         <input
//           type="text"
//           value={where}
//           onChange={(e) => setWhere(e.target.value)}
//           className="rounded-2xl bg-background px-5 py-3"
//         />
//       </div>
//       {details.map((detail, index) => (
//         <div key={index} className="flex flex-col gap-3">
//           <label>Date</label>
//           <input
//             type="date"
//             value={detail.date.toISOString().substr(0, 10)}
//             onChange={(e) =>
//               handleDetailChange(index, "date", new Date(e.target.value))
//             }
//             className="rounded-2xl bg-background px-5 py-3"
//           />
//           <label>Start Time</label>
//           <input
//             type="time"
//             value={detail.startTime}
//             onChange={(e) =>
//               handleDetailChange(index, "startTime", e.target.value)
//             }
//             className="rounded-2xl bg-background px-5 py-3"
//           />
//           <label>End Time</label>
//           <input
//             type="time"
//             value={detail.endTime}
//             onChange={(e) =>
//               handleDetailChange(index, "endTime", e.target.value)
//             }
//             className="rounded-2xl bg-background px-5 py-3"
//           />
//           <label>Performers</label>
//           <input
//             type="text"
//             value={detail.performers.join(", ")}
//             onChange={(e) =>
//               handleDetailChange(
//                 index,
//                 "performers",
//                 e.target.value.split(", "),
//               )
//             }
//             className="rounded-2xl bg-background px-5 py-3"
//           />
//         </div>
//       ))}
//       <div className="flex flex-col gap-3">
//         <label>Status</label>
//         <select
//           value={status}
//           onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
//           className="rounded-2xl bg-background px-5 py-3"
//         >
//           <option value="DRAFT">Draft</option>
//           <option value="PUBLISHED">Published</option>
//         </select>
//       </div>
//       <div className="flex items-center justify-end gap-3">
//         <LoadingButton
//           onClick={onSubmit}
//           loading={mutation.isPending}
//           className="min-w-20"
//         >
//           Save
//         </LoadingButton>
//       </div>
//     </div>
//   );
// }
