"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { signalSchema } from "@/lib/validations/signal";

import { type SignalActionState } from "./signal.types";

async function assertExistsById(params: {
	supabase: Awaited<ReturnType<typeof createClient>>;
	table: "employees" | "roles" | "projects";
	id: string;
	entityLabel: string;
}): Promise<void> {
	const { data, error } = await params.supabase
		.from(params.table)
		.select("id")
		.eq("id", params.id)
		.maybeSingle();

	if (error || !data) {
		throw new Error(`${params.entityLabel} not found.`);
	}
}

export async function createSignal(
	_prevState: SignalActionState,
	formData: FormData,
): Promise<SignalActionState> {
	const { userId } = await auth();

	if (!userId) {
		return {
			status: "error",
			message: "Unauthorized",
		};
	}

	const raw = {
		category: formData.get("category"),
		title: formData.get("title"),
		details: formData.get("details"),
		isAnonymous: formData.get("isAnonymous") === "on",
		isPublic: formData.get("isPublic") === "on",
		projectId: formData.get("projectId") || null,
		authorEmployeeId: formData.get("authorEmployeeId"),
		targetType: formData.get("targetType"),
		targetRoleId: formData.get("targetRoleId") || null,
		targetEmployeeId: formData.get("targetEmployeeId") || null,
	};

	const validated = signalSchema.safeParse(raw);

	if (!validated.success) {
		return {
			status: "error",
			message: "Invalid signal data",
			errors: validated.error.flatten().fieldErrors,
		};
	}

	const values = validated.data;
	const supabase = await createClient();

	if (values.targetType === "role" && !values.targetRoleId) {
		return {
			status: "error",
			message: "Target role is required.",
		};
	}

	if (values.targetType === "employee" && !values.targetEmployeeId) {
		return {
			status: "error",
			message: "Target employee is required.",
		};
	}

	try {
		await assertExistsById({
			supabase,
			table: "employees",
			id: values.authorEmployeeId,
			entityLabel: "Author employee",
		});

		if (values.projectId) {
			await assertExistsById({
				supabase,
				table: "projects",
				id: values.projectId,
				entityLabel: "Project",
			});
		}

		if (values.targetType === "role" && values.targetRoleId) {
			await assertExistsById({
				supabase,
				table: "roles",
				id: values.targetRoleId,
				entityLabel: "Target role",
			});
		}

		if (values.targetType === "employee" && values.targetEmployeeId) {
			await assertExistsById({
				supabase,
				table: "employees",
				id: values.targetEmployeeId,
				entityLabel: "Target employee",
			});
		}

		const { data: created, error: insertError } = await supabase
			.from("signals")
			.insert({
				author_employee_id: values.authorEmployeeId,
				is_anonymous: values.isAnonymous,
				category: values.category,
				title: values.title.trim(),
				details: values.details.trim(),
				project_id: values.projectId ?? null,
				is_public: values.isPublic,
			})
			.select("id")
			.maybeSingle();

		if (insertError || !created?.id) {
			return {
				status: "error",
				message: insertError?.message ?? "Failed to create signal",
			};
		}

		if (values.targetType === "all") {
			const { error: targetsError } = await supabase.from("signal_targets").insert({
				signal_id: created.id,
				target_type: "all",
				target_role_id: null,
				target_employee_id: null,
			});
			if (targetsError) {
				return { status: "error", message: targetsError.message };
			}
		} else if (values.targetType === "role" && values.targetRoleId) {
			const { error: targetsError } = await supabase.from("signal_targets").insert({
				signal_id: created.id,
				target_type: "role",
				target_role_id: values.targetRoleId,
				target_employee_id: null,
			});
			if (targetsError) {
				return { status: "error", message: targetsError.message };
			}
		} else if (values.targetType === "employee" && values.targetEmployeeId) {
			const { error: targetsError } = await supabase.from("signal_targets").insert({
				signal_id: created.id,
				target_type: "employee",
				target_role_id: null,
				target_employee_id: values.targetEmployeeId,
			});
			if (targetsError) {
				return { status: "error", message: targetsError.message };
			}
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
