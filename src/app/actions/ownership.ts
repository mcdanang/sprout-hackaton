"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analyzeSignalWithMockAI } from "@/lib/signal-ai";
import { ownershipSchema } from "@/lib/validations/ownership";
import { type OwnershipActionState } from "./ownership.types";

/**
 * Submits a new ownership signal (concern or recognition).
 */
export async function submitOwnershipSignal(
	_prevState: OwnershipActionState,
	formData: FormData,
): Promise<OwnershipActionState> {
	const { userId } = await auth();

	if (!userId) {
		return {
			status: "error",
			message: "Unauthorized",
		};
	}

	const raw = {
		type: formData.get("type"),
		title: formData.get("title"),
		details: formData.get("details"),
		isAnonymous: formData.get("isAnonymous") === "on",
	};

	const validated = ownershipSchema.safeParse(raw);

	if (!validated.success) {
		return {
			status: "error",
			message: "Invalid signal data",
			errors: validated.error.flatten().fieldErrors,
		};
	}

	const values = validated.data;
	const supabase = await createClient();
	const category = values.type === "recognition" ? "achievement" : "concern";
	const aiAnalysis = analyzeSignalWithMockAI({
		category,
		title: values.title,
		details: values.details,
	});

	try {
		// Get current employee for the logged in user
		const { data: employee, error: empError } = await supabase
			.from("employees")
			.select("id")
			.eq("auth_id", userId)
			.maybeSingle();

		if (empError || !employee) {
			return {
				status: "error",
				message: "Employee profile not found.",
			};
		}

		// Insert into signals table as achievement/concern based on type
		const { error: insertError } = await supabase.from("signals").insert({
			author_employee_id: employee.id,
			is_anonymous: values.isAnonymous,
			category,
			title: values.title.trim(),
			details: values.details.trim(),
			is_public: true,
			sentiment_score: aiAnalysis.sentiment,
			ai_issue_category: aiAnalysis.issueCategory,
		});

		if (insertError) {
			return {
				status: "error",
				message: insertError.message,
			};
		}

		revalidatePath("/dashboard");
		return { status: "success", message: "Ownership signal submitted." };
	} catch (e) {
		return { status: "error", message: e instanceof Error ? e.message : "Internal Error" };
	}
}
