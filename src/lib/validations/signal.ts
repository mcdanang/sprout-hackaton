import { z } from "zod";

export const signalSchema = z.object({
  category: z.enum(["concern", "achievement", "appreciation"]),
  title: z.string().min(4, "Title must be at least 4 characters.").max(100),
  details: z
    .string()
    .min(10, "Details must be at least 10 characters for useful context.")
    .max(2000),
  isAnonymous: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  projectId: z.string().uuid().nullable().optional(),

  // @mentioned employees — always stored as signal_targets regardless of isPublic.
  // isPublic only controls visibility, not whether targets exist.
  // If empty and isPublic=true → server inserts a single 'all' target as fallback.
  targetEmployeeIds: z.array(z.string().uuid()).default([]),
});

export type SignalFormValues = z.infer<typeof signalSchema>;

