"use server";

import { createClient } from "@/lib/supabase/server";

import type { Project } from "@/components/dashboard/project-card";

type ProjectMetrics = {
	concernsCount: number;
	achievementsCount: number;
	kudosCount: number;
	health: number;
	healthStatus: Project["healthStatus"];
};

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

function computeHealth(concernsCount: number, achievementsCount: number): ProjectMetrics {
	const diff = achievementsCount - concernsCount;
	let healthStatus: Project["healthStatus"];
	if (diff >= 4) healthStatus = "Healthy";
	else if (diff <= -4) healthStatus = "At Risk";
	else healthStatus = "Stable";

	// Simple deterministic health score for the progress bar.
	let health: number;
	if (healthStatus === "Healthy") health = clamp(65 + diff * 4, 0, 100);
	else if (healthStatus === "At Risk") health = clamp(35 + diff * 4, 0, 100);
	else health = 50 + clamp(diff * 2, -15, 15);

	return {
		concernsCount,
		achievementsCount,
		kudosCount: 0, // set later
		health: Math.round(clamp(health, 0, 100)),
		healthStatus,
	};
}

export async function getDashboardProjects(): Promise<Project[]> {
	const supabase = await createClient();

	const { data: projects, error: projectsError } = await supabase
		.from("projects")
		.select("id, name, description, status")
		.order("name");

	console.log({ projects });
	console.log({ projectsError });
	if (projectsError || !projects) return [];

	// Build "team" from employees assigned to each project.
	const { data: employees } = await supabase
		.from("employees")
		.select("project_id, email")
		.order("email");

	const teamByProjectId = new Map<string, string[]>();
	for (const e of employees ?? []) {
		if (!e.project_id || !e.email) continue;
		const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(e.email)}`;
		const list = teamByProjectId.get(e.project_id) ?? [];
		list.push(avatar);
		teamByProjectId.set(e.project_id, Array.from(new Set(list)));
	}

	// Signal metrics.
	let signals: { project_id: string | null; category: string }[] = [];
	try {
		const { data } = await supabase.from("signals").select("project_id, category");
		signals = data ?? [];
	} catch {
		// If signals table isn't present yet, still return projects.
		signals = [];
	}

	const metricsByProjectId = new Map<
		string,
		{ concernsCount: number; achievementsCount: number; kudosCount: number }
	>();

	for (const s of signals) {
		if (!s.project_id) continue; // general signals don't affect project metrics
		const current = metricsByProjectId.get(s.project_id) ?? {
			concernsCount: 0,
			achievementsCount: 0,
			kudosCount: 0,
		};

		if (s.category === "concern") current.concernsCount += 1;
		if (s.category === "achievement") current.achievementsCount += 1;
		if (s.category === "appreciation") current.kudosCount += 1;

		metricsByProjectId.set(s.project_id, current);
	}

	// The client ProjectCard expects additional UI fields.
	// For now we map them to a reasonable default + derived health metrics.
	const result: Project[] = projects.map(p => {
		const metrics = metricsByProjectId.get(p.id) ?? {
			concernsCount: 0,
			achievementsCount: 0,
			kudosCount: 0,
		};

		const healthMetrics = computeHealth(metrics.concernsCount, metrics.achievementsCount);
		return {
			id: p.id,
			name: p.name,
			description: p.description,
			status: p.status as Project["status"],
			team: teamByProjectId.get(p.id) ?? [],
			health: healthMetrics.health,
			healthStatus: healthMetrics.healthStatus,
			concernsCount: metrics.concernsCount,
			achievementsCount: metrics.achievementsCount,
			kudosCount: metrics.kudosCount,
		};
	});

	return result;
}
