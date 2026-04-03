"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveEmployeeRow } from "@/lib/effective-employee";

async function getCurrentEmployee(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{
	id: string;
	role_id: string;
} | null> {
	const row = await getEffectiveEmployeeRow(supabase);
	if (!row?.role_id) return null;
	return { id: row.id, role_id: row.role_id };
}

async function getRoleName(params: {
	supabase: Awaited<ReturnType<typeof createClient>>;
	roleId: string;
}): Promise<string | null> {
	const { data: role, error: roleError } = await params.supabase
		.from("roles")
		.select("name")
		.eq("id", params.roleId)
		.maybeSingle();

	if (roleError) return null;
	return role?.name ?? null;
}

export async function toggleSignalLike(signalId: string): Promise<{
	likesCount: number;
	isLiked: boolean;
}> {
	const supabase = await createClient();
	const employee = await getCurrentEmployee(supabase);
	if (!employee) throw new Error("Unauthorized");

	const roleName = await getRoleName({ supabase, roleId: employee.role_id });
	if (!roleName) throw new Error("Unauthorized");

	// Authorization guard: staff/squad lead can only like signals in their project scope.
	const { data: signalRow } = await supabase
		.from("signals")
		.select("id, project_id")
		.eq("id", signalId)
		.maybeSingle();

	if (!signalRow) throw new Error("Signal not found");

	if (roleName === "SQUAD LEAD") {
		const { data: projectRow } = await supabase
			.from("projects")
			.select("id")
			.eq("id", signalRow.project_id)
			.eq("squad_lead_employee_id", employee.id)
			.maybeSingle();

		if (!projectRow) throw new Error("Unauthorized");
	}

	// Check if like exists; if yes, remove; otherwise insert.
	const { data: existingLike } = await supabase
		.from("signal_likes")
		.select("id")
		.eq("signal_id", signalId)
		.eq("author_employee_id", employee.id)
		.maybeSingle();

	if (existingLike?.id) {
		const { error: deleteError } = await supabase
			.from("signal_likes")
			.delete()
			.eq("id", existingLike.id);

		if (deleteError) throw new Error(deleteError.message);
	} else {
		const { error: insertError } = await supabase.from("signal_likes").insert({
			signal_id: signalId,
			author_employee_id: employee.id,
		});

		if (insertError) throw new Error(insertError.message);
	}

	const { count } = await supabase
		.from("signal_likes")
		.select("id", { count: "exact" })
		.eq("signal_id", signalId);

	const likesCount = count ?? 0;

	const { data: nowLiked } = await supabase
		.from("signal_likes")
		.select("id")
		.eq("signal_id", signalId)
		.eq("author_employee_id", employee.id)
		.maybeSingle();

	return {
		likesCount,
		isLiked: Boolean(nowLiked?.id),
	};
}

export async function createSignalReply(params: { signalId: string; content: string }): Promise<{
	replyId: string;
	userId: string;
	userName: string;
	userAvatar: string | null;
	content: string;
	timestamp: string;
}> {
	const supabase = await createClient();
	const employee = await getCurrentEmployee(supabase);
	if (!employee) throw new Error("Unauthorized");

	const trimmed = params.content.trim();
	if (!trimmed) throw new Error("Reply content is required");

	const roleName = await getRoleName({ supabase, roleId: employee.role_id });
	if (!roleName) throw new Error("Unauthorized");

	// Authorization guard: staff/squad lead can only reply in their project scope.
	const { data: signalRow } = await supabase
		.from("signals")
		.select("id, project_id")
		.eq("id", params.signalId)
		.maybeSingle();

	if (!signalRow) throw new Error("Signal not found");

	if (roleName === "SQUAD LEAD") {
		const { data: projectRow } = await supabase
			.from("projects")
			.select("id")
			.eq("id", signalRow.project_id)
			.eq("squad_lead_employee_id", employee.id)
			.maybeSingle();

		if (!projectRow) throw new Error("Unauthorized");
	}

	// Insert reply.
	const { data: createdReply, error: insertError } = await supabase
		.from("signal_replies")
		.insert({
			signal_id: params.signalId,
			author_employee_id: employee.id,
			content: trimmed,
		})
		.select("id, signal_id, author_employee_id, content, created_at")
		.maybeSingle();

	if (insertError || !createdReply?.id) {
		throw new Error(insertError?.message ?? "Failed to create reply");
	}

	// Resolve author display info.
	const { data: author } = await supabase
		.from("employees")
		.select("full_name, email")
		.eq("id", createdReply.author_employee_id)
		.maybeSingle();

	const userName = author?.full_name ?? "Unknown";
	const user = await currentUser();
	const userAvatar = user?.imageUrl ?? null;

	return {
		replyId: createdReply.id,
		userId: createdReply.author_employee_id,
		userName,
		userAvatar,
		content: createdReply.content,
		timestamp: new Date(createdReply.created_at).toISOString(),
	};
}
