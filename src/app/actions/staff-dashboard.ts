"use server";

import { createClient } from "@/lib/supabase/server";
import { getEffectiveEmployeeRow } from "@/lib/effective-employee";
import type {
	StaffDashboardSnapshot,
	StaffProjectSentiment,
	StaffTeamActivityItem,
} from "@/lib/staff-dashboard-types";
import { computeAverageSentiment, type SignalMetricInput } from "@/lib/utils/signal-metrics";

const RANGE_MS = 30 * 24 * 60 * 60 * 1000;

export async function getStaffDashboardSnapshot(): Promise<StaffDashboardSnapshot | null> {
	const supabase = await createClient();
	const emp = await getEffectiveEmployeeRow(supabase);
	if (!emp?.role_id) return null;

	const { data: role } = await supabase.from("roles").select("name").eq("id", emp.role_id).maybeSingle();
	if (!role) return null;

	const since = new Date(Date.now() - RANGE_MS).toISOString();

	const { data: links } = await supabase
		.from("employee_projects")
		.select("project_id")
		.eq("employee_id", emp.id);
	const projectIds = (links ?? []).map(l => l.project_id).filter(Boolean);

	const { data: mySignals } = await supabase
		.from("signals")
		.select("category")
		.eq("author_employee_id", emp.id)
		.gte("created_at", since);

	const categoryBreakdown30d = {
		concern: 0,
		achievement: 0,
		appreciation: 0,
	};
	for (const s of mySignals ?? []) {
		if (s.category === "concern") categoryBreakdown30d.concern++;
		else if (s.category === "achievement") categoryBreakdown30d.achievement++;
		else if (s.category === "appreciation") categoryBreakdown30d.appreciation++;
	}

	const concernsCount30d = categoryBreakdown30d.concern;

	// Total Contribution Points (All time, categorized as achievements by squad leads)
	const { data: pointData } = await supabase
		.from("signals")
		.select("achievement_points")
		.eq("author_employee_id", emp.id)
		.eq("category", "achievement")
		.not("achievement_points", "is", null);

	const totalContributionPoints = (pointData ?? []).reduce((acc, row) => acc + (row.achievement_points ?? 0), 0);

	let projectSentiments: StaffProjectSentiment[] = [];
	if (projectIds.length) {
		const { data: projSignals } = await supabase
			.from("signals")
			.select("project_id, category, sentiment_score, concern_status, projects(name)")
			.in("project_id", projectIds)
			.gte("created_at", since);

		const signalsByProject = new Map<string, SignalMetricInput[]>();
		const projectLabels = new Map<string, string>();

		for (const row of projSignals ?? []) {
			const pid = row.project_id;
			if (!pid) continue;
			
			const raw = row.projects as { name: string } | { name: string }[] | null | undefined;
			const pname = Array.isArray(raw) ? raw[0]?.name : raw?.name;
			if (pname) projectLabels.set(pid, pname);

			const list = signalsByProject.get(pid) ?? [];
			list.push(row as unknown as SignalMetricInput);
			signalsByProject.set(pid, list);
		}

		projectSentiments = Array.from(signalsByProject.entries())
			.map(([projectId, signals]) => {
				const avgSentiment = computeAverageSentiment(signals);
				return {
					projectId,
					projectName: projectLabels.get(projectId) ?? "Project",
					avgSentiment,
					signalCount: signals.length,
				};
			})
			.sort((a, b) => b.signalCount - a.signalCount);
	}

	let teamActivity: StaffTeamActivityItem[] = [];
	if (projectIds.length) {
		const { data: feedRows } = await supabase
			.from("signals")
			.select("id, category, title, details, created_at, author_employee_id, project_id")
			.in("project_id", projectIds)
			.order("created_at", { ascending: false })
			.limit(25);

		const authorIds = [...new Set((feedRows ?? []).map(r => r.author_employee_id))];
		const pids = [...new Set((feedRows ?? []).map(r => r.project_id).filter(Boolean))] as string[];

		const [{ data: authorEmps }, { data: projs }] = await Promise.all([
			authorIds.length
				? supabase.from("employees").select("id, full_name").in("id", authorIds)
				: Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
			pids.length
				? supabase.from("projects").select("id, name").in("id", pids)
				: Promise.resolve({ data: [] as { id: string; name: string }[] }),
		]);

		const authorMap = new Map((authorEmps ?? []).map(e => [e.id, e.full_name]));
		const projMap = new Map((projs ?? []).map(p => [p.id, p.name]));

		teamActivity = (feedRows ?? []).map(row => ({
			id: row.id,
			category: row.category,
			title: row.title,
			preview: (row.details ?? "").slice(0, 140),
			authorName: authorMap.get(row.author_employee_id) ?? "Someone",
			projectName: row.project_id ? (projMap.get(row.project_id) ?? null) : null,
			createdAt: new Date(row.created_at).toISOString(),
		}));
	}

	const { data: allProjSignals } = await supabase
		.from("signals")
		.select("id, category, sentiment_score, ai_issue_category, concern_status, project_id")
		.in("project_id", projectIds)
		.gte("created_at", since);

	const staffSignals = (allProjSignals ?? []) as SignalMetricInput[];
	
	const catCounts = new Map<string, number>();
	const concerns = staffSignals.filter(s => s.category === "concern");
	for (const s of concerns) {
		const k = s.ai_issue_category ?? "others";
		catCounts.set(k, (catCounts.get(k) ?? 0) + 1);
	}
	const catTotal = concerns.length;

	const SLICE_COLORS: Record<string, string> = {
		"Burnout Alert": "#ef4444",
		"Scope Creep": "#f97316",
		"Process Bottleneck": "#eab308",
		"Communication Gap": "#3b82f6",
		"Technical Debt": "#a855f7",
		"Micro-management": "#ec4899",
		"Professional Growth": "#06b6d4",
		"Office Environment": "#22c55e",
		others: "#94a3b8",
	};

	const SLICE_LABELS: Record<string, string> = {
		"Burnout Alert": "Burnout",
		"Scope Creep": "Scope",
		"Process Bottleneck": "Process",
		"Communication Gap": "Communication",
		"Technical Debt": "Technical",
		"Micro-management": "Micro-mgmt",
		"Professional Growth": "Professional",
		"Office Environment": "Office",
		others: "Other",
	};

	const sentimentSlices = [...catCounts.entries()]
		.map(([key, count]) => ({
			key,
			label: SLICE_LABELS[key] ?? key,
			count,
			pct: catTotal > 0 ? Math.round((count / catTotal) * 100) : 0,
			color: SLICE_COLORS[key] ?? SLICE_COLORS.others,
		}))
		.sort((a, b) => b.count - a.count);

	const concernStatusCount = {
		open: concerns.filter(s => s.concern_status === "open").length,
		inProgress: concerns.filter(s => s.concern_status === "in_progress").length,
		closed: concerns.filter(s => s.concern_status === "closed").length,
	};

	return {
		concernsCount30d,
		categoryBreakdown30d,
		projectSentiments,
		teamActivity,
		sentimentSlices,
		concernStatusCount,
		totalContributionPoints,
	};
}
