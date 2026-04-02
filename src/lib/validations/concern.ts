import { z } from "zod";

import { SIGNAL_ISSUE_CATEGORIES } from "@/lib/signal-ai";

const issueEnum = z.enum(
	SIGNAL_ISSUE_CATEGORIES as [string, ...string[]],
);

export const concernFormSchema = z
	.object({
		issueCategory: issueEnum,
		visibility: z.enum(["management", "division", "person"]),
		organizationId: z.preprocess(
			v => (v === "" || v === null || v === undefined ? null : v),
			z.string().uuid().nullable(),
		),
		targetEmployeeId: z.preprocess(
			v => (v === "" || v === null || v === undefined ? null : v),
			z.string().uuid().nullable(),
		),
		details: z.string().min(1, "Description cannot be empty.").max(2000),
		isAnonymous: z.boolean(),
	})
	.superRefine((data, ctx) => {
		if (data.visibility === "division" && !data.organizationId) {
			ctx.addIssue({
				code: "custom",
				path: ["organizationId"],
				message: "Select a division.",
			});
		}
		if (data.visibility === "person" && !data.targetEmployeeId) {
			ctx.addIssue({
				code: "custom",
				path: ["targetEmployeeId"],
				message: "Select a person.",
			});
		}
	});

export type ConcernFormValues = z.infer<typeof concernFormSchema>;
