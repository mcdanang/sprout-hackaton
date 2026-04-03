"use server";

import { createClient } from "@/lib/supabase/server";
import { getEffectiveEmployeeRow } from "@/lib/effective-employee";
import type { SquadLeadDashboardSnapshot } from "@/lib/squad-lead-dashboard-types";
import type { LeaderboardRow } from "@/lib/management-dashboard-types";
import { computeAverageSentiment, type SignalMetricInput } from "@/lib/utils/signal-metrics";

const RANGE_MS = 30 * 24 * 60 * 60 * 1000;

function windowBounds() {
	const now = Date.now();
	const currentStart = new Date(now - RANGE_MS).toISOString();
	const previousStart = new Date(now - 2 * RANGE_MS).toISOString();
	const previousEnd = currentStart;
	return { currentStart, previousStart, previousEnd };
}

function trend(current: number, previous: number) {
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

export async function getSquadLeadDashboardSnapshot(): Promise<SquadLeadDashboardSnapshot | null> {
	const supabase = await createClient();
	const emp = await getEffectiveEmployeeRow(supabase);
	if (!emp) return null;

	// Check if user leads any projects
	const { data: ledProjects } = await supabase
		.from("projects")
		.select("id, name")
		.eq("squad_lead_employee_id", emp.id);

	if (!ledProjects || ledProjects.length === 0) return null;

	const projectIds = ledProjects.map(p => p.id);
	const { currentStart, previousStart, previousEnd } = windowBounds();

	// 1. Fetch current signals for led projects
	const { data: currentSignals } = await supabase
		.from("signals")
		.select("id, category, sentiment_score, ai_issue_category, concern_status, project_id, author_employee_id, achievement_points")
		.in("project_id", projectIds)
		.gte("created_at", currentStart);

	// 2. Fetch previous signals for trend calculation
	const { data: previousSignals } = await supabase
		.from("signals")
		.select("id")
		.in("project_id", projectIds)
		.gte("created_at", previousStart)
		.lt("created_at", previousEnd);

	const signals = (currentSignals ?? []) as SignalMetricInput[];
	const prevCount = previousSignals?.length ?? 0;

	// KPI Calculation
	const totalSignalsTrend = trend(signals.length, prevCount);
	const openConcernsCount = signals.filter(s => s.category === "concern" && s.concern_status === "open").length;
	const avgSentiment = computeAverageSentiment(signals as SignalMetricInput[]);

	// Project Breakdown
	const projectSentiments = ledProjects.map(p => {
		const projSignals = signals.filter(s => s.project_id === p.id);
		return {
			projectId: p.id,
			projectName: p.name,
			avgSentiment: computeAverageSentiment(projSignals as SignalMetricInput[]),
			signalCount: projSignals.length,
		};
	});

	// AI Issue Slices (Concerns only)
	const catCounts = new Map<string, number>();
	const concerns = signals.filter(s => s.category === "concern");
	for (const s of concerns) {
		const k = s.ai_issue_category ?? "others";
		catCounts.set(k, (catCounts.get(k) ?? 0) + 1);
	}
	const catTotal = concerns.length;

	const sentimentSlices = [...catCounts.entries()]
		.map(([key, count]) => ({
			key,
			label: SLICE_LABELS[key] ?? key,
			count,
			pct: catTotal > 0 ? Math.round((count / catTotal) * 100) : 0,
			color: SLICE_COLORS[key] ?? SLICE_COLORS.others,
		}))
		.sort((a, b) => b.count - a.count);

	// Concern Status Breakdown
	const concernStatusCount = {
		open: signals.filter(s => s.category === "concern" && s.concern_status === "open").length,
		inProgress: signals.filter(s => s.category === "concern" && s.concern_status === "in_progress").length,
		closed: signals.filter(s => s.category === "concern" && s.concern_status === "closed").length,
	};

	// Leaderboard (Recognition)
	const scoreRows = signals.filter(s => s.category && ["achievement", "appreciation"].includes(s.category));
	const scoreMap = new Map<string, number>();
	for (const row of scoreRows) {
		const id = row.author_employee_id;
		if (!id) continue;
		const pts = row.achievement_points ?? 1;
		scoreMap.set(id, (scoreMap.get(id) ?? 0) + pts);
	}

	const sortedPairs = [...scoreMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
	const topIds = sortedPairs.map(([id]) => id);

	let leaderboard: LeaderboardRow[] = [];
	if (topIds.length) {
		const { data: emps } = await supabase
			.from("employees")
			.select("id, full_name")
			.in("id", topIds.filter((id): id is string => !!id));
		const empById = new Map((emps ?? []).map(e => [e.id, e]));

		leaderboard = sortedPairs.map(([id, points], idx) => {
			const signal = signals.find(s => s.author_employee_id === id);
			const projectId = signal?.project_id;
			const squad = projectId ? ledProjects.find(p => p.id === projectId)?.name : null;
			
			return {
				rank: idx + 1,
				employeeId: id,
				fullName: empById.get(id)?.full_name ?? "Unknown",
				squadLabel: squad ?? "—",
				points,
			};
		});
	}

	return {
		kpis: {
			projectsLed: ledProjects.length,
			totalSignals: totalSignalsTrend,
			openConcerns: openConcernsCount,
			avgSentiment,
		},
		projectSentiments,
		sentimentSlices,
		leaderboard,
		concernStatusCount,
	};
}
