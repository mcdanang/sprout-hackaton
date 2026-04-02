"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

import type { ActivityItem } from "@/lib/constants/activity";
import type { Project } from "@/lib/types/project";

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

async function getCurrentEmployeeId(
	supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
	const { userId } = await auth();
	if (!userId) return null;

	const user = await currentUser();
	const primaryEmailId = user?.primaryEmailAddressId;
	const orderedEmails: string[] = [];

	if (primaryEmailId) {
		const primary = user?.emailAddresses.find(e => e.id === primaryEmailId)?.emailAddress;
		if (primary) orderedEmails.push(primary);
	}

	for (const e of user?.emailAddresses ?? []) {
		if (!orderedEmails.includes(e.emailAddress)) {
			orderedEmails.push(e.emailAddress);
		}
	}

	for (const rawEmail of orderedEmails) {
		const normalizedEmail = rawEmail.trim().toLowerCase();
		if (!normalizedEmail) continue;

		const { data: employee } = await supabase
			.from("employees")
			.select("id")
			.ilike("email", normalizedEmail)
			.maybeSingle();

		if (employee?.id) return employee.id;
	}

	return null;
}

export async function getDashboardProjects(): Promise<Project[]> {
	const supabase = await createClient();

	const { data: projects, error: projectsError } = await supabase
		.from("projects")
		.select("id, name, description")
		.order("name");

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

export async function getProjectDetail(projectId: string): Promise<{
	project: Project | null;
	activities: ActivityItem[];
}> {
	const supabase = await createClient();

	// 1) Project record
	const { data: projectRow } = await supabase
		.from("projects")
		.select("id, name, description")
		.eq("id", projectId)
		.maybeSingle();

	if (!projectRow) {
		return { project: null, activities: [] };
	}

	// 2) Team avatars from employees assigned to the project
	const { data: employeeRows } = await supabase
		.from("employees")
		.select("email")
		.eq("project_id", projectId)
		.order("email");

	const team: string[] = Array.from(
		new Set(
			(employeeRows ?? [])
				.filter((e): e is { email: string } => Boolean(e?.email))
				.map(e => `https://i.pravatar.cc/150?u=${encodeURIComponent(e.email)}`),
		),
	);

	const { data: signals } = await supabase
		.from("signals")
		.select(
			"id, project_id, author_employee_id, is_anonymous, category, title, details, created_at, is_public",
		)
		.eq("project_id", projectId)
		.order("created_at", { ascending: false });

	const safeSignals = signals ?? [];

	let concernsCount = 0;
	let achievementsCount = 0;
	let kudosCount = 0;

	for (const s of safeSignals) {
		if (s.category === "concern") concernsCount += 1;
		if (s.category === "achievement") achievementsCount += 1;
		if (s.category === "appreciation") kudosCount += 1;
	}

	const healthMetrics = computeHealth(concernsCount, achievementsCount);

	const project: Project = {
		id: projectRow.id,
		name: projectRow.name,
		description: projectRow.description,
		team,
		health: healthMetrics.health,
		healthStatus: healthMetrics.healthStatus,
		concernsCount,
		achievementsCount,
		kudosCount,
	};

	// 4) Resolve author names/emails for timeline activity cards
	const authorIds = Array.from(new Set(safeSignals.map(s => s.author_employee_id).filter(Boolean)));
	const { data: authors } = await supabase
		.from("employees")
		.select("id, full_name, email")
		.in("id", authorIds);

	const authorById = new Map<string, { full_name: string; email: string }>();
	for (const a of authors ?? []) {
		if (!a?.id) continue;
		authorById.set(a.id, { full_name: a.full_name, email: a.email });
	}

	const signalIds = safeSignals.map(s => s.id);
	const currentEmployeeId = await getCurrentEmployeeId(supabase);

	let likesBySignal = new Map<string, number>();
	const likedSignalIds = new Set<string>();
	let repliesBySignal = new Map<string, ActivityItem["replies"]>();

	if (signalIds.length > 0) {
		const { data: allLikes } = await supabase
			.from("signal_likes")
			.select("signal_id, author_employee_id")
			.in("signal_id", signalIds);

		const likeCountMap = new Map<string, number>();
		for (const like of allLikes ?? []) {
			if (!like?.signal_id) continue;
			likeCountMap.set(like.signal_id, (likeCountMap.get(like.signal_id) ?? 0) + 1);
			if (currentEmployeeId && like.author_employee_id === currentEmployeeId) {
				likedSignalIds.add(like.signal_id);
			}
		}
		likesBySignal = likeCountMap;

		const { data: replies } = await supabase
			.from("signal_replies")
			.select("id, signal_id, author_employee_id, content, created_at")
			.in("signal_id", signalIds)
			.order("created_at", { ascending: true });

		const replyAuthorIds = Array.from(
			new Set((replies ?? []).map(r => r.author_employee_id).filter(Boolean)),
		);
		let replyAuthorById = new Map<string, { full_name: string; email: string }>();
		if (replyAuthorIds.length > 0) {
			const { data: replyAuthors } = await supabase
				.from("employees")
				.select("id, full_name, email")
				.in("id", replyAuthorIds);

			replyAuthorById = new Map(
				(replyAuthors ?? [])
					.filter((a): a is { id: string; full_name: string; email: string } => Boolean(a?.id))
					.map(a => [a.id, { full_name: a.full_name, email: a.email }]),
			);
		}

		const groupedReplies = new Map<string, NonNullable<ActivityItem["replies"]>>();
		for (const reply of replies ?? []) {
			if (!reply?.signal_id || !reply?.id || !reply?.author_employee_id) continue;

			const replyAuthor = replyAuthorById.get(reply.author_employee_id);
			const replyUserName = replyAuthor?.full_name ?? "Unknown";
			const replyAvatarSeed = replyAuthor?.email ?? reply.author_employee_id;
			const replyUserAvatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(replyAvatarSeed)}`;

			const list = groupedReplies.get(reply.signal_id) ?? [];
			list.push({
				id: reply.id,
				userId: reply.author_employee_id,
				userName: replyUserName,
				userAvatar: replyUserAvatar,
				content: reply.content ?? "",
				timestamp: new Date(reply.created_at).toISOString(),
			});
			groupedReplies.set(reply.signal_id, list);
		}
		repliesBySignal = groupedReplies;
	}

	const activities: ActivityItem[] = safeSignals.map(s => {
		const activityType =
			s.category === "concern" ? "concern" : s.category === "achievement" ? "achievement" : "kudos";

		const author = authorById.get(s.author_employee_id);
		const userName = s.is_anonymous ? "Anonymous" : (author?.full_name ?? "Unknown");
		const userAvatarSeed = s.is_anonymous
			? `anonymous-${s.id}`
			: (author?.email ?? s.author_employee_id);
		const userAvatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(userAvatarSeed)}`;

		return {
			id: s.id,
			projectId: s.project_id ?? projectId,
			userId: s.author_employee_id,
			userName,
			userAvatar,
			type: activityType,
			content: s.details,
			timestamp: new Date(s.created_at).toISOString(),
			likesCount: likesBySignal.get(s.id) ?? 0,
			isLiked: likedSignalIds.has(s.id),
			isPublic: s.is_public ?? true,
			replies: repliesBySignal.get(s.id) ?? [],
		};
	});

	return { project, activities };
}
