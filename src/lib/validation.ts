import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required");

export const signUpSchema = z.object({
  email: requiredString
    .email("Invalid email address")
    .max(50, "Must be less than 50 characters"),
  username: requiredString
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, - and _ allowed")
    .max(50, "Must be less than 50 characters"),
  password: requiredString
    .min(8, "Must be at least 8 characters")
    .max(50, "Must be less than 50 characters"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const resetPasswordSchema = z.object({
  credential: z.string().max(50, "Must be less than 50 characters").optional(),
});

export type resetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const loginSchema = z.object({
  username: z.string().max(50, "Must be less than 50 characters").optional(),
  email: z
    .string()
    .email("Invalid email")
    .max(50, "Must be less than 50 characters")
    .optional(),
  password: z
    .string()
    .max(50, "Must be less than 50 characters")
    .min(1, "Required"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  content: z.string().min(0),
  mediaIds: z.array(z.string()),
});

export const updateUserProfileSchema = z.object({
  displayName: requiredString.max(50, "Must be less than 50 characters"),
  bio: z.string().max(200, "Must be at most 200 characters").optional(),
  websiteUrl: z
    .string()
    .max(200, "Must be less than 200 characters")
    .url({ message: "Invalid url" })
    .optional()
    .or(z.literal("")),
  instruments: z
    .array(z.string())
    .max(15, "You can select up to 15 instruments")
    .optional(),
  skills: z
    .array(z.string())
    .max(15, "You can select up to 15 skills")
    .optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const updateEmailSchema = z.object({
  currentPassword: z.string().trim().min(1, "Current password is required"),
  newEmail: requiredString.email("Invalid email address"),
});

export type UpdateEmailValues = z.infer<typeof updateEmailSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
    isSettingPassword: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

// --- Event Schemas ---

// Define the base object structure first
const baseEventObject = z.object({
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
  when: z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z.date({
      errorMap: (issue, ctx) => {
        if (issue.code === z.ZodIssueCode.invalid_date) {
          return { message: "Invalid date format" };
        }
        return { message: ctx.defaultError };
      },
    }),
  ),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  performers: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  isCancelled: z.boolean(),
});

// Now create the final createEventSchema by adding the refinement
export const createEventSchema = baseEventObject.refine(
  (data) => {
    if (data.startTime && data.endTime) {
      const isEndTimeAfterStart = data.endTime > data.startTime;
      console.log(
        `DEBUG TIME COMPARE: Start=${data.startTime}, End=${data.endTime}, IsAfter=${isEndTimeAfterStart}`,
      );
      return isEndTimeAfterStart;
    }
    return true;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  },
);

export type CreateEventValues = z.infer<typeof createEventSchema>;

// Schema for updating an event (PATCH)
// Apply .partial() to the base object *before* the refinement
export const updateEventSchema = baseEventObject
  .partial()
  // Add refinement: if title exists, it must not be empty
  .refine(
    (data) => {
      // If title is present in the partial data, it must have a length > 0
      return data.title === undefined || data.title.trim().length > 0;
    },
    {
      message: "Title cannot be empty",
      path: ["title"], // Associate error with title field
    },
  );

export type UpdateEventValues = z.infer<typeof updateEventSchema>;

// --- Comment Schema ---

export const createCommentSchema = z.object({
  content: requiredString,
});

export type CreateCommentValues = z.infer<typeof createCommentSchema>;
