"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEffectiveEmployeeRow } from "@/lib/effective-employee";
import {
	computeConcernSentimentFromIssueCategory,
	type SignalIssueCategory,
} from "@/lib/signal-ai";
import { concernFormSchema } from "@/lib/validations/concern";

import { type ConcernActionState, type MyConcernItem, type MyConcernReply, type TeamConcernItem } from "./concerns.types";

async function resolveEmployeeId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{
	id: string;
	project_ids: string[];
} | null> {
	const emp = await getEffectiveEmployeeRow(supabase);
	if (!emp) return null;

	const { data: links } = await supabase
		.from("employee_projects")
		.select("project_id")
		.eq("employee_id", emp.id);

	const project_ids = (links ?? []).map(l => l.project_id);
	return { id: emp.id, project_ids };
}

function deriveTitleFromDetails(details: string): string {
	const trimmed = details.trim();
	if (trimmed.length <= 100) return trimmed;
	return `${trimmed.slice(0, 97)}...`;
}

function deriveDisplayStatus(
	concernStatus: string | null | undefined,
	replyCount: number,
): "open" | "in_progress" | "closed" {
	if (concernStatus === "closed") return "closed";
	if (concernStatus === "in_progress") return "in_progress";
	if (replyCount > 0) return "in_progress";
	return "open";
}

export async function getConcernFormOptions(): Promise<{
	organizations: { id: string; name: string }[];
	employees: { id: string; full_name: string }[];
}> {
	const supabase = await createClient();

	const [{ data: organizations }, { data: employees }] = await Promise.all([
		supabase.from("organizations").select("id, name").order("name"),
		supabase
			.from("employees")
			.select("id, full_name")
			.eq("is_active", true)
			.order("full_name", { ascending: true })
			.limit(500),
	]);

	return {
		organizations: organizations ?? [],
		employees: employees ?? [],
	};
}

export async function getMyConcerns(): Promise<MyConcernItem[]> {
	const supabase = await createClient();
	const employee = await resolveEmployeeId(supabase);
	if (!employee) return [];

	const { data: signalRows, error: sigErr } = await supabase
		.from("signals")
		.select("id, details, ai_issue_category, created_at, is_anonymous, concern_status, project_id")
		.eq("author_employee_id", employee.id)
		.eq("category", "concern")
		.order("created_at", { ascending: false });

	if (sigErr || !signalRows?.length) return [];

	const signalIds = signalRows.map(s => s.id);

	const [{ data: targetRows }, { data: replyRows }] = await Promise.all([
		supabase
			.from("signal_targets")
			.select("signal_id, target_type, target_role_id, target_employee_id, target_organization_id")
			.in("signal_id", signalIds),
		supabase
			.from("signal_replies")
			.select("id, signal_id, author_employee_id, content, created_at")
			.in("signal_id", signalIds)
			.order("created_at", { ascending: true }),
	]);

	const roleIds = Array.from(
		new Set((targetRows ?? []).map(t => t.target_role_id).filter(Boolean) as string[]),
	);
	const orgIds = Array.from(
		new Set((targetRows ?? []).map(t => t.target_organization_id).filter(Boolean) as string[]),
	);
	const empIds = Array.from(
		new Set([
			...(targetRows ?? []).map(t => t.target_employee_id).filter(Boolean),
			...(replyRows ?? []).map(r => r.author_employee_id).filter(Boolean),
		] as string[]),
	);

	const [{ data: roles }, { data: orgs }, { data: emps }] = await Promise.all([
		roleIds.length
			? supabase.from("roles").select("id, name").in("id", roleIds)
			: Promise.resolve({ data: [] as { id: string; name: string }[] }),
		orgIds.length
			? supabase.from("organizations").select("id, name").in("id", orgIds)
			: Promise.resolve({ data: [] as { id: string; name: string }[] }),
		empIds.length
			? supabase.from("employees").select("id, full_name, role_id").in("id", empIds)
			: Promise.resolve({
					data: [] as { id: string; full_name: string; role_id: string | null }[],
				}),
	]);

	const roleById = new Map((roles ?? []).map(r => [r.id, r.name]));
	const orgById = new Map((orgs ?? []).map(o => [o.id, o.name]));

	const replyRoleIds = Array.from(
		new Set((emps ?? []).map(e => e.role_id).filter(Boolean) as string[]),
	);
	const { data: replyRoles } =
		replyRoleIds.length > 0
			? await supabase.from("roles").select("id, name").in("id", replyRoleIds)
			: { data: [] as { id: string; name: string }[] };
	const replyRoleNameById = new Map((replyRoles ?? []).map(r => [r.id, r.name]));

	const empById = new Map(
		(emps ?? []).map(e => [
			e.id,
			{
				full_name: e.full_name,
				roleName: e.role_id ? (replyRoleNameById.get(e.role_id) ?? null) : null,
			},
		]),
	);

	const targetsBySignal = new Map<string, typeof targetRows>();
	for (const t of targetRows ?? []) {
		if (!t.signal_id) continue;
		const list = targetsBySignal.get(t.signal_id) ?? [];
		list.push(t);
		targetsBySignal.set(t.signal_id, list);
	}

	const repliesBySignal = new Map<string, typeof replyRows>();
	for (const r of replyRows ?? []) {
		if (!r.signal_id) continue;
		const list = repliesBySignal.get(r.signal_id) ?? [];
		list.push(r);
		repliesBySignal.set(r.signal_id, list);
	}

	function buildTargetLabel(signalId: string): string {
		const targets = targetsBySignal.get(signalId) ?? [];
		const t = targets[0];
		if (!t) return "Visible to team";

		if (t.target_type === "all") return "Visible to everyone";
		if (t.target_type === "role" && t.target_role_id) {
			const roleName = roleById.get(t.target_role_id) ?? "Role";
			if (roleName === "TOP MANAGEMENT") return "To Management";
			return `To Role: ${roleName}`;
		}
		if (t.target_type === "employee" && t.target_employee_id) {
			const name = empById.get(t.target_employee_id)?.full_name ?? "Unknown";
			return `To Specific Person: ${name}`;
		}
		if (t.target_type === "organization" && t.target_organization_id) {
			const name = orgById.get(t.target_organization_id) ?? "Division";
			return `To Division: ${name}`;
		}
		return "Visible to team";
	}

	const result: MyConcernItem[] = [];

	for (const s of signalRows) {
		const repliesRaw = repliesBySignal.get(s.id) ?? [];
		const replyCount = repliesRaw.length;
		const status = deriveDisplayStatus(s.concern_status, replyCount);

		const replies: MyConcernReply[] = repliesRaw.map(r => {
			const author = empById.get(r.author_employee_id);
			return {
				id: r.id,
				content: r.content ?? "",
				createdAt: new Date(r.created_at).toISOString(),
				authorName: author?.full_name ?? "Unknown",
				roleName: author?.roleName ?? null,
			};
		});

		result.push({
			id: s.id,
			details: s.details ?? "",
			issueCategory: s.ai_issue_category ?? "others",
			createdAt: new Date(s.created_at).toISOString(),
			isAnonymous: Boolean(s.is_anonymous),
			targetLabel: buildTargetLabel(s.id),
			status,
			projectId: (s as { project_id?: string | null }).project_id ?? null,
			replies,
		});
	}

	return result;
}

export async function createConcern(
	_prevState: ConcernActionState,
	formData: FormData,
): Promise<ConcernActionState> {
	const supabase = await createClient();
	const employee = await resolveEmployeeId(supabase);
	if (!employee) {
		return { status: "error", message: "Unauthorized" };
	}

	const raw = {
		issueCategory: formData.get("issueCategory"),
		visibility: formData.get("visibility"),
		organizationId: formData.get("organizationId") || null,
		targetEmployeeId: formData.get("targetEmployeeId") || null,
		details: formData.get("details"),
		isAnonymous: formData.get("isAnonymous") === "on",
	};

	const validated = concernFormSchema.safeParse(raw);
	if (!validated.success) {
		const fieldErrors = validated.error.flatten().fieldErrors;
		const firstError = Object.values(fieldErrors).flat()[0] ?? "Invalid concern data";
		return {
			status: "error",
			message: firstError,
			errors: fieldErrors,
		};
	}

	const v = validated.data;
	const details = v.details.trim();
	const title = deriveTitleFromDetails(details);
	const issueCategory = v.issueCategory as SignalIssueCategory;
	const sentiment = computeConcernSentimentFromIssueCategory(issueCategory, details);

	const { data: mgmtRole } = await supabase
		.from("roles")
		.select("id")
		.eq("name", "TOP MANAGEMENT")
		.maybeSingle();

	if (v.visibility === "management" && !mgmtRole?.id) {
		return { status: "error", message: "Management role is not configured." };
	}

	try {
		const { data: created, error: insertError } = await supabase
			.from("signals")
			.insert({
				author_employee_id: employee.id,
				is_anonymous: v.isAnonymous,
				category: "concern",
				title,
				details,
				project_id: employee.project_ids[0] ?? null,
				is_public: true,
				sentiment_score: sentiment,
				ai_issue_category: issueCategory,
				concern_status: "open",
			})
			.select("id")
			.maybeSingle();

		if (insertError || !created?.id) {
			return { status: "error", message: insertError?.message ?? "Failed to submit concern" };
		}

		if (v.visibility === "management" && mgmtRole?.id) {
			await supabase.from("signal_targets").insert({
				signal_id: created.id,
				target_type: "role",
				target_role_id: mgmtRole.id,
				target_employee_id: null,
				target_organization_id: null,
			});
		} else if (v.visibility === "division" && v.organizationId) {
			await supabase.from("signal_targets").insert({
				signal_id: created.id,
				target_type: "organization",
				target_role_id: null,
				target_employee_id: null,
				target_organization_id: v.organizationId,
			});
		} else if (v.visibility === "person" && v.targetEmployeeId) {
			await supabase.from("signal_targets").insert({
				signal_id: created.id,
				target_type: "employee",
				target_role_id: null,
				target_employee_id: v.targetEmployeeId,
				target_organization_id: null,
			});
		} else {
			await supabase.from("signal_targets").insert({
				signal_id: created.id,
				target_type: "all",
				target_role_id: null,
				target_employee_id: null,
				target_organization_id: null,
			});
		}

		const locale =
			typeof formData.get("locale") === "string" ? String(formData.get("locale")) : "en";
		revalidatePath(`/${locale}/dashboard/concerns`);
		revalidatePath("/");

		return { status: "success", message: "Concern submitted." };
	} catch (e) {
		return { status: "error", message: e instanceof Error ? e.message : "Error" };
	}
}

export async function updateConcernStatus(
  signalId: string,
  status: "open" | "in_progress" | "closed",
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const employee = await resolveEmployeeId(supabase);
  if (!employee) return { ok: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("signals")
    .update({ concern_status: status })
    .eq("id", signalId)
    .eq("category", "concern");

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  return { ok: true, message: "Status updated." };
}

export async function getTeamConcerns(): Promise<TeamConcernItem[] | null> {
  const supabase = await createClient();
  const emp = await getEffectiveEmployeeRow(supabase);
  if (!emp?.role_id) return null;

  const { data: role } = await supabase
    .from("roles")
    .select("name")
    .eq("id", emp.role_id)
    .maybeSingle();

  // Determine scope: null = all projects (top management), string[] = specific projects (delivery lead)
  let projectFilter: string[] | null = null;
  const projectNameById = new Map<string, string>();

  const roleName = role?.name?.toUpperCase();

  if (roleName === "TOP MANAGEMENT") {
    // projectFilter stays null → no project_id filter on the query
    const { data: allProjects } = await supabase.from("projects").select("id, name");
    for (const p of allProjects ?? []) projectNameById.set(p.id, p.name);
  } else if (roleName === "SQUAD LEAD") {
    // Check if squad lead of any project
    const { data: ledProjects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("squad_lead_employee_id", emp.id);

    if (!ledProjects?.length) return null; // not a lead of any project

    projectFilter = ledProjects.map(p => p.id);
    for (const p of ledProjects) projectNameById.set(p.id, p.name);
  } else {
    // All other roles (STAFF, undefined, etc.) have no team access
    return null;
  }

  let signalQuery = supabase
    .from("signals")
    .select(
      "id, details, ai_issue_category, created_at, is_anonymous, concern_status, project_id, author_employee_id",
    )
    .eq("category", "concern")
    .order("created_at", { ascending: false });

  if (projectFilter !== null) {
    signalQuery = signalQuery.in("project_id", projectFilter);
  }

  const { data: signalRows, error: sigErr } = await signalQuery;
  if (sigErr || !signalRows?.length) return [];

  const signalIds = signalRows.map(s => s.id);
  const authorIds = Array.from(
    new Set(signalRows.map(s => s.author_employee_id).filter(Boolean) as string[]),
  );

  const [{ data: targetRows }, { data: replyRows }, { data: authorEmps }] = await Promise.all([
    supabase
      .from("signal_targets")
      .select("signal_id, target_type, target_role_id, target_employee_id, target_organization_id")
      .in("signal_id", signalIds),
    supabase
      .from("signal_replies")
      .select("id, signal_id, author_employee_id, content, created_at")
      .in("signal_id", signalIds)
      .order("created_at", { ascending: true }),
    authorIds.length
      ? supabase.from("employees").select("id, full_name, role_id").in("id", authorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; role_id: string | null }[] }),
  ]);

  const roleIds = Array.from(
    new Set((targetRows ?? []).map(t => t.target_role_id).filter(Boolean) as string[]),
  );
  const orgIds = Array.from(
    new Set((targetRows ?? []).map(t => t.target_organization_id).filter(Boolean) as string[]),
  );
  const replyEmpIds = Array.from(
    new Set((replyRows ?? []).map(r => r.author_employee_id).filter(Boolean) as string[]),
  );

  const [{ data: roles }, { data: orgs }, { data: replyEmps }] = await Promise.all([
    roleIds.length
      ? supabase.from("roles").select("id, name").in("id", roleIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    orgIds.length
      ? supabase.from("organizations").select("id, name").in("id", orgIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    replyEmpIds.length
      ? supabase.from("employees").select("id, full_name, role_id").in("id", replyEmpIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; role_id: string | null }[] }),
  ]);

  // Resolve role names for reply authors
  const allReplyRoleIds = Array.from(
    new Set((replyEmps ?? []).map(e => e.role_id).filter(Boolean) as string[]),
  );
  const { data: replyRoles } = allReplyRoleIds.length
    ? await supabase.from("roles").select("id, name").in("id", allReplyRoleIds)
    : { data: [] as { id: string; name: string }[] };

  const roleById = new Map((roles ?? []).map(r => [r.id, r.name]));
  const orgById = new Map((orgs ?? []).map(o => [o.id, o.name]));
  const replyRoleNameById = new Map((replyRoles ?? []).map(r => [r.id, r.name]));

  const replyEmpById = new Map(
    (replyEmps ?? []).map(e => [
      e.id,
      {
        full_name: e.full_name,
        roleName: e.role_id ? (replyRoleNameById.get(e.role_id) ?? null) : null,
      },
    ]),
  );

  const authorById = new Map((authorEmps ?? []).map(e => [e.id, e.full_name]));

  const targetsBySignal = new Map<string, typeof targetRows>();
  for (const t of targetRows ?? []) {
    if (!t.signal_id) continue;
    const list = targetsBySignal.get(t.signal_id) ?? [];
    list.push(t);
    targetsBySignal.set(t.signal_id, list);
  }

  const repliesBySignal = new Map<string, typeof replyRows>();
  for (const r of replyRows ?? []) {
    if (!r.signal_id) continue;
    const list = repliesBySignal.get(r.signal_id) ?? [];
    list.push(r);
    repliesBySignal.set(r.signal_id, list);
  }

  function buildTargetLabel(signalId: string): string {
    const targets = targetsBySignal.get(signalId) ?? [];
    const t = targets[0];
    if (!t) return "Visible to team";
    if (t.target_type === "all") return "Visible to everyone";
    if (t.target_type === "role" && t.target_role_id) {
      const roleName = roleById.get(t.target_role_id) ?? "Role";
      if (roleName === "TOP MANAGEMENT") return "To Management";
      return `To Role: ${roleName}`;
    }
    if (t.target_type === "employee" && t.target_employee_id) {
      return `To Specific Person`;
    }
    if (t.target_type === "organization" && t.target_organization_id) {
      const name = orgById.get(t.target_organization_id) ?? "Division";
      return `To Division: ${name}`;
    }
    return "Visible to team";
  }

  const result: TeamConcernItem[] = [];

  for (const s of signalRows) {
    const repliesRaw = repliesBySignal.get(s.id) ?? [];
    const replyCount = repliesRaw.length;
    const status = deriveDisplayStatus(s.concern_status, replyCount);

    const replies: MyConcernReply[] = repliesRaw.map(r => {
      const author = replyEmpById.get(r.author_employee_id);
      return {
        id: r.id,
        content: r.content ?? "",
        createdAt: new Date(r.created_at).toISOString(),
        authorName: author?.full_name ?? "Unknown",
        roleName: author?.roleName ?? null,
      };
    });

    result.push({
      id: s.id,
      details: s.details ?? "",
      issueCategory: s.ai_issue_category ?? "others",
      createdAt: new Date(s.created_at).toISOString(),
      isAnonymous: Boolean(s.is_anonymous),
      targetLabel: buildTargetLabel(s.id),
      status,
      projectId: s.project_id ?? null,
      projectName: s.project_id ? (projectNameById.get(s.project_id) ?? null) : null,
      authorName: authorById.get(s.author_employee_id) ?? null,
      replies,
    });
  }

  return result;
}
