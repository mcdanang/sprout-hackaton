import { z } from "zod";

export const signalSchema = z.object({
  category: z.enum(["concern", "achievement", "appreciation"]),
  title: z.string().min(4, "Title must be at least 4 characters.").max(100),
  details: z
    .string()
    .min(10, "Details must be at least 10 characters for useful context.")
    .max(2000),
  isAnonymous: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  projectId: z.string().uuid().nullable().optional(),

  authorEmployeeId: z.string().uuid(),

  // Recipient targeting
  targetType: z.enum(["all", "role", "employee"]),
  targetRoleId: z.string().uuid().nullable().optional(),
  targetEmployeeId: z.string().uuid().nullable().optional(),
});

export type SignalFormValues = z.infer<typeof signalSchema>;

