"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { signalSchema } from "@/lib/validations/signal";

import { type SignalActionState } from "./signal.types";

export async function createSignal(
	_prevState: SignalActionState,
	formData: FormData,
): Promise<SignalActionState> {
	const { userId } = await auth();
	if (!userId) return { status: "error", message: "Unauthorized" };

	const supabase = await createClient();

	// Resolve author from Clerk auth_id — never trust client-sent employee ID
	const { data: employee, error: empError } = await supabase
		.from("employees")
		.select("id")
		.eq("auth_id", userId)
		.maybeSingle();

	if (empError || !employee) {
		return { status: "error", message: "Employee profile not found." };
	}

	const raw = {
		category: formData.get("category"),
		title: formData.get("title"),
		details: formData.get("details"),
		isAnonymous: formData.get("isAnonymous") === "on",
		isPublic: formData.get("isPublic") === "on",
		projectId: formData.get("projectId") || null,
		targetEmployeeIds: formData.getAll("targetEmployeeIds[]").filter(Boolean),
	};

	const validated = signalSchema.safeParse(raw);
	if (!validated.success) {
		return {
			status: "error",
			message: "Invalid signal data",
			errors: validated.error.flatten().fieldErrors,
		};
	}

	const v = validated.data;

	try {
		const { data: created, error: insertError } = await supabase
			.from("signals")
			.insert({
				author_employee_id: employee.id,
				is_anonymous: v.isAnonymous,
				category: v.category,
				title: v.title.trim(),
				details: v.details.trim(),
				project_id: v.projectId ?? null,
				is_public: v.isPublic,
			})
			.select("id")
			.maybeSingle();

		if (insertError || !created?.id) {
			return { status: "error", message: insertError?.message ?? "Failed to create signal" };
		}

		if (v.targetEmployeeIds.length > 0) {
			// @mentions present → always insert one row per mentioned employee.
			// is_public controls WHO CAN SEE the signal, not whether targets exist.
			await supabase.from("signal_targets").insert(
				v.targetEmployeeIds.map(empId => ({
					signal_id: created.id,
					target_type: "employee",
					target_role_id: null,
					target_employee_id: empId,
				})),
			);
		} else {
			// No @mentions → fallback: visible to all (regardless of is_public toggle)
			await supabase.from("signal_targets").insert({
				signal_id: created.id,
				target_type: "all",
				target_role_id: null,
				target_employee_id: null,
			});
		}

		revalidatePath("/");
		return { status: "success", message: "Signal created." };
	} catch (e) {
		return { status: "error", message: e instanceof Error ? e.message : "Error" };
	}
}

export async function getSignals(): Promise<SignalRecord[]> {
	const supabase = await createClient();
	const { data, error } = await supabase.from("signals").select("*");
	if (error) {
		throw new Error(error.message);
	}
	return data as SignalRecord[];
}

type SignalRecord = {
	id: string;
	author_employee_id: string;
	is_anonymous: boolean;
	category: "concern" | "achievement" | "appreciation";
	title: string;
	details: string;
	project_id: string | null;
	is_public: boolean;
	created_at: string;
};
