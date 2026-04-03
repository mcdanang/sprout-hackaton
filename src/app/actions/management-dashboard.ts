"use server";

import { createClient } from "@/lib/supabase/server";
import { getEffectiveEmployeeRow } from "@/lib/effective-employee";
import type {
	LeaderboardRow,
	ManagementDashboardSnapshot,
	ManagementKpiTrend,
	SentimentSlice,
} from "@/lib/management-dashboard-types";

const RANGE_MS = 30 * 24 * 60 * 60 * 1000;

function windowBounds() {
	const now = Date.now();
	const currentStart = new Date(now - RANGE_MS).toISOString();
	const previousStart = new Date(now - 2 * RANGE_MS).toISOString();
	const previousEnd = currentStart;
	return { currentStart, previousStart, previousEnd };
}

function trend(current: number, previous: number): ManagementKpiTrend {
	let pctChange: number | null = null;
	if (previous === 0) {
		if (current > 0) pctChange = 100;
	} else {
		pctChange = Math.round(((current - previous) / previous) * 100);
	}
	return { current, previous, pctChange };
}

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

export async function getManagementDashboardSnapshot(): Promise<ManagementDashboardSnapshot | null> {
	const supabase = await createClient();
	const emp = await getEffectiveEmployeeRow(supabase);
	if (!emp?.role_id) return null;

	const { data: role } = await supabase.from("roles").select("name").eq("id", emp.role_id).maybeSingle();
	if (role?.name !== "TOP MANAGEMENT") return null;

	const { currentStart, previousStart, previousEnd } = windowBounds();

	async function countConcerns(since: string, until?: string) {
		let q = supabase
			.from("signals")
			.select("id", { count: "exact", head: true })
			.eq("category", "concern");
		if (until) {
			q = q.gte("created_at", since).lt("created_at", until);
		} else {
			q = q.gte("created_at", since);
		}
		const { count, error } = await q;
		if (error) return 0;
		return count ?? 0;
	}

	async function countAchievements(since: string, until?: string) {
		let q = supabase
			.from("signals")
			.select("id", { count: "exact", head: true })
			.eq("category", "achievement");
		if (until) {
			q = q.gte("created_at", since).lt("created_at", until);
		} else {
			q = q.gte("created_at", since);
		}
		const { count, error } = await q;
		if (error) return 0;
		return count ?? 0;
	}

	async function countResolved(since: string, until?: string) {
		let q = supabase
			.from("signals")
			.select("id", { count: "exact", head: true })
			.eq("category", "concern")
			.eq("concern_status", "closed");
		if (until) {
			q = q.gte("created_at", since).lt("created_at", until);
		} else {
			q = q.gte("created_at", since);
		}
		const { count, error } = await q;
		if (error) return 0;
		return count ?? 0;
	}

	const [cCurr, cPrev, aCurr, aPrev, rCurr, rPrev] = await Promise.all([
		countConcerns(currentStart),
		countConcerns(previousStart, previousEnd),
		countAchievements(currentStart),
		countAchievements(previousStart, previousEnd),
		countResolved(currentStart),
		countResolved(previousStart, previousEnd),
	]);

	const { count: projectCount } = await supabase
		.from("projects")
		.select("id", { count: "exact", head: true });

	const { data: squadLinks } = await supabase.from("employee_projects").select("project_id");
	const squadProjectIds = new Set(
		(squadLinks ?? []).map(r => r.project_id).filter((id): id is string => Boolean(id)),
	);
	const activeProjects = squadProjectIds.size || projectCount || 0;

	const kpis = {
		concerns: trend(cCurr, cPrev),
		achievements: trend(aCurr, aPrev),
		activeProjects,
		resolvedConcerns: trend(rCurr, rPrev),
	};

	const { data: concernCats } = await supabase
		.from("signals")
		.select("ai_issue_category")
		.eq("category", "concern")
		.gte("created_at", currentStart);

	const catCounts = new Map<string, number>();
	for (const row of concernCats ?? []) {
		const k = row.ai_issue_category ?? "others";
		catCounts.set(k, (catCounts.get(k) ?? 0) + 1);
	}
	const catTotal = [...catCounts.values()].reduce((a, b) => a + b, 0);

	const sentimentSlices: SentimentSlice[] = [...catCounts.entries()]
		.map(([key, count]) => ({
			key,
			label: SLICE_LABELS[key] ?? key,
			count,
			pct: catTotal > 0 ? Math.round((count / catTotal) * 100) : 0,
			color: SLICE_COLORS[key] ?? SLICE_COLORS.others,
		}))
		.sort((a, b) => b.count - a.count);

	const { data: scoreRows } = await supabase
		.from("signals")
		.select("author_employee_id")
		.in("category", ["achievement", "appreciation"])
		.gte("created_at", currentStart);

	const scoreMap = new Map<string, number>();
	for (const row of scoreRows ?? []) {
		const id = row.author_employee_id;
		scoreMap.set(id, (scoreMap.get(id) ?? 0) + 1);
	}

	const sortedPairs = [...scoreMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
	const topIds = sortedPairs.map(([id]) => id);

	let leaderboard: LeaderboardRow[] = [];
	if (topIds.length) {
		const { data: emps } = await supabase
			.from("employees")
			.select("id, full_name")
			.in("id", topIds);

		const empById = new Map((emps ?? []).map(e => [e.id, e]));

		const { data: epRows } = await supabase
			.from("employee_projects")
			.select("employee_id, projects(name)")
			.in("employee_id", topIds);

		const firstSquad = new Map<string, string>();
		for (const row of epRows ?? []) {
			const eid = row.employee_id;
			if (firstSquad.has(eid)) continue;
			const p = row.projects as { name: string } | { name: string }[] | null | undefined;
			const name = Array.isArray(p) ? p[0]?.name : p?.name;
			if (name) firstSquad.set(eid, name);
		}

		leaderboard = sortedPairs.map(([id, points], idx) => ({
			rank: idx + 1,
			employeeId: id,
			fullName: empById.get(id)?.full_name ?? "Unknown",
			squadLabel: firstSquad.get(id) ?? "—",
			points,
		}));
	}

	const { data: allProjects } = await supabase.from("projects").select("id");
	const projectIds = (allProjects ?? []).map(p => p.id);

	let sentimentRows: { project_id: string | null; sentiment_score: number | null }[] = [];
	if (projectIds.length) {
		const { data } = await supabase
			.from("signals")
			.select("project_id, sentiment_score")
			.in("project_id", projectIds)
			.gte("created_at", currentStart);
		sentimentRows = data ?? [];
	}

	const byProject = new Map<string, { sum: number; n: number }>();
	for (const row of sentimentRows ?? []) {
		const pid = row.project_id;
		if (!pid) continue;
		const s = row.sentiment_score;
		if (s == null) continue;
		const cur = byProject.get(pid) ?? { sum: 0, n: 0 };
		cur.sum += s;
		cur.n += 1;
		byProject.set(pid, cur);
	}

	let healthy = 0;
	let warning = 0;
	let critical = 0;

	for (const pid of projectIds) {
		const agg = byProject.get(pid);
		const avg = agg && agg.n > 0 ? agg.sum / agg.n : null;
		if (avg == null) {
			warning += 1;
			continue;
		}
		if (avg >= 75) healthy += 1;
		else if (avg >= 50) warning += 1;
		else critical += 1;
	}

	const projectHealth = { healthy, warning, critical };

	return {
		kpis,
		sentimentSlices,
		leaderboard,
		projectHealth,
	};
}
