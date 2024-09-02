import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required");

export const signUpSchema = z.object({
  email: requiredString
    .email("Invalid email address")
    .max(20, "Must be less than 20 characters"),
  username: requiredString
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, - and _ allowed")
    .max(20, "Must be less than 20 characters"),
  password: requiredString
    .min(8, "Must be at least 8 characters")
    .max(20, "Must be less than 20 characters"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: z.string().max(20, "Must be less than 20 characters").optional(),
  email: z.string().max(25, "Must be less than 25 characters").optional(),
  password: requiredString.max(20, "Must be less than 20 characters"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  content: z.string().min(0),
  mediaIds: z.array(z.string()),
  // mediaIds: z.array(z.string()).max(5, "Cannot have more than 5 attachments"),
});

export const updateUserProfileSchema = z.object({
  displayName: requiredString.max(50, "Must be less than 50 characters"),
  bio: z.string().max(200, "Must be at most 200 characters"),
  instruments: z
    .array(z.string())
    .max(15, "You can select up to 15 instruments"),
  skills: z.array(z.string()).max(15, "You can select up to 15 skills"),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const createEventSchema = z.object({
  title: z
    .string()
    .max(100, { message: "Title cannot exceed 100 characters" })
    .optional(),
  location: z
    .string()
    .min(1, { message: "Location is required" })
    .max(100, { message: "Location cannot exceed 100 characters" }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  url: z
    .string()
    .max(200, { message: "URL cannot exceed 200 characters" })
    .optional(),
  when: z.string().min(1, { message: "Date is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  performers: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export type CreateEventValues = z.infer<typeof createEventSchema>;

export const createCommentSchema = z.object({
  content: requiredString,
});
