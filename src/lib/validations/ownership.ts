import { z } from "zod";

export const ownershipSchema = z.object({
  type: z.enum(["concern", "recognition"]),
  title: z
    .string()
    .min(4, "Title must be at least 4 characters.")
    .max(100, "Title must be under 100 characters."),
  details: z
    .string()
    .min(10, "Details must be at least 10 characters for useful context.")
    .max(1000, "Details must be under 1000 characters."),
  isAnonymous: z.boolean().default(false),
});

export type OwnershipFormValues = z.infer<typeof ownershipSchema>;
