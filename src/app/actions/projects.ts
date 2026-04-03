"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveEmployeeRow } from "@/lib/effective-employee";

import type { ActivityItem } from "@/lib/constants/activity";
import { analyzeSignalWithMockAI, type SignalIssueCategory } from "@/lib/signal-ai";
import {
	computeAverageSentiment,
	computeHealth,
	type SignalMetricInput,
} from "@/lib/utils/signal-metrics";
import { Project, TeamMember } from "@/lib/types/project";


function isSignalIssueCategory(value: unknown): value is SignalIssueCategory {
	return (
		value === "Burnout Alert" ||
		value === "Scope Creep" ||
		value === "Process Bottleneck" ||
		value === "Communication Gap" ||
		value === "Technical Debt" ||
		value === "Micro-management" ||
		value === "Professional Growth" ||
		value === "Office Environment" ||
		value === "others"
	);
}

/** Supabase may return an embedded relation as an object or a single-element array. */
function embedOne<T>(row: unknown): T | null {
	if (row == null) return null;
	if (Array.isArray(row)) return (row[0] as T | undefined) ?? null;
	return row as T;
}

async function getCurrentEmployeeId(
	supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
	const emp = await getEffectiveEmployeeRow(supabase);
	return emp?.id ?? null;
}

export async function getDashboardProjects(): Promise<Project[]> {
	const supabase = await createClient();

	const employeeId = await getCurrentEmployeeId(supabase);
	if (!employeeId) return [];

	const { data: membershipLinks } = await supabase
		.from("employee_projects")
		.select("project_id")
		.eq("employee_id", employeeId);

	const allowedProjectIds = new Set(
		(membershipLinks ?? []).map(l => l.project_id).filter((id): id is string => Boolean(id)),
	);
	if (allowedProjectIds.size === 0) return [];

	const projectIdList = [...allowedProjectIds];

	const { data: projects, error: projectsError } = await supabase
		.from("projects")
		.select("id, name, description")
		.in("id", projectIdList)
		.order("name");

	if (projectsError || !projects) return [];

	// Build "team" from employees assigned to each project (many-to-many), scoped to this user's projects.
	const { data: projectLinks } = await supabase
		.from("employee_projects")
		.select(
			`
			project_id,
			employees (
				id,
				email,
				full_name,
				job_position
			)
		`,
		)
		.in("project_id", projectIdList);

	type Emb = {
		id: string;
		email: string | null;
		full_name: string;
		job_position: string;
	};

	const teamByProjectId = new Map<string, TeamMember[]>();
	const allTeamEmails: string[] = [];
	for (const row of projectLinks ?? []) {
		const e = embedOne<Emb>(row.employees);
		if (e?.email) allTeamEmails.push(e.email);
	}
	const teamEmailToAvatar = new Map<string, string | null>();

	const uniqueTeamEmails = Array.from(new Set(allTeamEmails));
	if (uniqueTeamEmails.length > 0) {
		try {
			const clerk = await clerkClient();
			const { data: clerkUsers } = await clerk.users.getUserList({
				emailAddress: uniqueTeamEmails,
				limit: 100,
			});
			for (const u of clerkUsers) {
				for (const em of u.emailAddresses) {
					teamEmailToAvatar.set(em.emailAddress, u.imageUrl ?? null);
				}
			}
		} catch (err) {
			console.error("[dashboard] clerk error:", err);
		}
	}

	for (const row of projectLinks ?? []) {
		const e = embedOne<Emb>(row.employees);
		if (!row.project_id || !e?.email) continue;
		const avatar = teamEmailToAvatar.get(e.email) || null;
		const list = teamByProjectId.get(row.project_id) ?? [];
		list.push({
			id: e.id,
			name: e.full_name,
			role: e.job_position,
			avatar,
		});
		teamByProjectId.set(row.project_id, list);
	}

	// Signal metrics.
	let signals: {
		project_id: string | null;
		category: string | null;
		title?: string | null;
		details?: string | null;
		sentiment_score?: number | null;
		ai_issue_category?: SignalIssueCategory | null;
		concern_status?: string | null;
	}[] = [];
	try {
		const { data } = await supabase
			.from("signals")
			.select(
				"project_id, category, title, details, sentiment_score, ai_issue_category, concern_status",
			);
		signals = data ?? [];
	} catch {
		// If signals table isn't present yet, still return projects.
		signals = [];
	}

	const metricsByProjectId = new Map<
		string,
		{
			concernsCount: number;
			achievementsCount: number;
			kudosCount: number;
			sentimentTotal: number;
			sentimentCount: number;
			issueCounts: Record<SignalIssueCategory, number>;
		}
	>();

	for (const s of signals) {
		if (!s.project_id || !allowedProjectIds.has(s.project_id)) continue;
		const current = metricsByProjectId.get(s.project_id) ?? {
			concernsCount: 0,
			achievementsCount: 0,
			kudosCount: 0,
			sentimentTotal: 0,
			sentimentCount: 0,
			issueCounts: {
				"Burnout Alert": 0,
				"Scope Creep": 0,
				"Process Bottleneck": 0,
				"Communication Gap": 0,
				"Technical Debt": 0,
				"Micro-management": 0,
				"Professional Growth": 0,
				"Office Environment": 0,
				others: 0,
			},
		};

		if (s.category === "concern" && s.concern_status !== "closed")
			current.concernsCount += 1;
		if (s.category === "achievement") current.achievementsCount += 1;
		if (s.category === "appreciation") current.kudosCount += 1;

		// We still calculate sentiment and issues for ALL signals to keep distribution accurate,
		// but the Pulse calculation elsewhere will use computeAverageSentiment which filters them.
		const analyzed = analyzeSignalWithMockAI(s);
		const sentiment =
			typeof s.sentiment_score === "number" ? s.sentiment_score : analyzed.sentiment;
		const issueCategory = isSignalIssueCategory(s.ai_issue_category)
			? s.ai_issue_category
			: analyzed.issueCategory;
		current.sentimentTotal += sentiment;
		current.sentimentCount += 1;
		current.issueCounts[issueCategory] += 1;
		metricsByProjectId.set(s.project_id, current);
	}

	// Pulse metrics for dashboard cards (re-calculate excluding closed concerns)
	const signalsByProject = new Map<string, SignalMetricInput[]>();
	for (const s of signals) {
		if (!s.project_id) continue;
		const list = signalsByProject.get(s.project_id) ?? [];
		list.push(s as SignalMetricInput);
		signalsByProject.set(s.project_id, list);
	}

	// The client ProjectCard expects additional UI fields.
	// For now we map them to a reasonable default + derived health metrics.
	const result: Project[] = projects.map(p => {
		const metrics = metricsByProjectId.get(p.id) ?? {
			concernsCount: 0,
			achievementsCount: 0,
			kudosCount: 0,
			sentimentTotal: 0,
			sentimentCount: 0,
			issueCounts: {
				"Burnout Alert": 0,
				"Scope Creep": 0,
				"Process Bottleneck": 0,
				"Communication Gap": 0,
				"Technical Debt": 0,
				"Micro-management": 0,
				"Professional Growth": 0,
				"Office Environment": 0,
				others: 0,
			},
		};
		const averageSentiment = computeAverageSentiment(signalsByProject.get(p.id) ?? []);
		const healthMetrics = computeHealth(averageSentiment);
		return {
			id: p.id,
			name: p.name,
			description: p.description,
			team: teamByProjectId.get(p.id) ?? [],
			health: healthMetrics.health,
			healthStatus: healthMetrics.healthStatus,
			pulseDescription: healthMetrics.pulseDescription,
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
	isSquadLead: boolean;
}> {
	const supabase = await createClient();

	// 1) Project record
	const { data: projectRow } = await supabase
		.from("projects")
		.select("id, name, description, squad_lead_employee_id")
		.eq("id", projectId)
		.maybeSingle();

	if (!projectRow) {
		return { project: null, activities: [], isSquadLead: false };
	}

	// 2) Team members from employees assigned to the project
	const { data: teamLinks } = await supabase
		.from("employee_projects")
		.select(
			`
			employees (
				id,
				full_name,
				email,
				job_position,
				auth_id
			)
		`,
		)
		.eq("project_id", projectId);

	type EmbAuth = {
		id: string;
		full_name: string;
		email: string | null;
		job_position: string;
		auth_id: string | null;
	};

	const employeeRows = (teamLinks ?? [])
		.map(r => embedOne<EmbAuth>(r.employees))
		.filter((e): e is EmbAuth => e != null)
		.sort((a, b) => a.full_name.localeCompare(b.full_name));

	const teamEmails = employeeRows.map(e => e.email).filter(Boolean) as string[];
	const teamEmailToAvatar = new Map<string, string | null>();

	if (teamEmails.length > 0) {
		try {
			const clerk = await clerkClient();
			const { data: clerkUsers } = await clerk.users.getUserList({
				emailAddress: teamEmails,
				limit: 100,
			});
			console.log("[team] emails queried:", teamEmails);
			console.log(
				"[team] clerk users:",
				clerkUsers.map(u => ({
					imageUrl: u.imageUrl,
					emails: u.emailAddresses.map(e => e.emailAddress),
				})),
			);
			for (const u of clerkUsers) {
				for (const em of u.emailAddresses) {
					teamEmailToAvatar.set(em.emailAddress, u.imageUrl ?? null);
				}
			}
		} catch (err) {
			console.error("[team] clerk error:", err);
		}
	}

	const team = employeeRows.map(e => ({
		id: e.id,
		name: e.full_name,
		role: e.job_position,
		avatar: (e.email ? teamEmailToAvatar.get(e.email) : null) || null,
	}));

	const { data: signals } = await supabase
		.from("signals")
		.select(
			"id, project_id, author_employee_id, is_anonymous, category, title, details, created_at, is_public, sentiment_score, ai_issue_category, concern_status",
		)
		.eq("project_id", projectId)
		.order("created_at", { ascending: false });

	const safeSignals = signals ?? [];

	let concernsCount = 0;
	let achievementsCount = 0;
	let kudosCount = 0;
	const issueCounts: Record<SignalIssueCategory, number> = {
		"Burnout Alert": 0,
		"Scope Creep": 0,
		"Process Bottleneck": 0,
		"Communication Gap": 0,
		"Technical Debt": 0,
		"Micro-management": 0,
		"Professional Growth": 0,
		"Office Environment": 0,
		others: 0,
	};
	for (const s of safeSignals) {
		if (s.category === "concern" && s.concern_status !== "closed") concernsCount += 1;
		if (s.category === "achievement") achievementsCount += 1;
		if (s.category === "appreciation") kudosCount += 1;

		const analyzed = analyzeSignalWithMockAI(s);
		const issueCategory = isSignalIssueCategory(s.ai_issue_category)
			? s.ai_issue_category
			: analyzed.issueCategory;
		issueCounts[issueCategory] += 1;
	}

	const averageSentiment = computeAverageSentiment(safeSignals as SignalMetricInput[]);
	const healthMetrics = computeHealth(averageSentiment);
	const project: Project = {
		id: projectRow.id,
		name: projectRow.name,
		description: projectRow.description,
		team,
		health: healthMetrics.health,
		healthStatus: healthMetrics.healthStatus,
		pulseDescription: healthMetrics.pulseDescription,
		concernsCount,
		achievementsCount,
		kudosCount,
	};

	// 4) Resolve author names + Clerk profile pictures for timeline activity cards
	const authorIds = Array.from(new Set(safeSignals.map(s => s.author_employee_id).filter(Boolean)));
	const signalIds = safeSignals.map(s => s.id);

	// Collect ALL unique employee IDs that might need avatars (signal authors + reply authors)
	let allAvatarEmployeeIds = [...authorIds];
	let repliesData: { author_employee_id: string | null }[] = [];
	if (signalIds.length > 0) {
		const { data: replies } = await supabase
			.from("signal_replies")
			.select("author_employee_id")
			.in("signal_id", signalIds);
		repliesData = replies ?? [];
		const replyAuthorIds = repliesData.map(r => r.author_employee_id).filter(Boolean);
		allAvatarEmployeeIds = Array.from(new Set([...allAvatarEmployeeIds, ...replyAuthorIds]));
	}

	const { data: authors } = await supabase
		.from("employees")
		.select("id, full_name, email, auth_id")
		.in("id", allAvatarEmployeeIds);

	// Build email → imageUrl map via Clerk for ALL identified authors
	const emailToAvatar = new Map<string, string | null>();
	const emails = (authors ?? []).map(a => a.email).filter(Boolean) as string[];
	if (emails.length > 0) {
		try {
			const clerk = await clerkClient();
			const { data: clerkUsers } = await clerk.users.getUserList({
				emailAddress: emails,
				limit: 100,
			});
			for (const u of clerkUsers) {
				for (const em of u.emailAddresses) {
					emailToAvatar.set(em.emailAddress, u.imageUrl ?? null);
				}
			}
		} catch {
			// Non-fatal
		}
	}

	const authorById = new Map<string, { full_name: string; email: string }>();
	for (const a of authors ?? []) {
		if (!a?.id) continue;
		authorById.set(a.id, { full_name: a.full_name, email: a.email });
	}

	const currentEmployeeId = await getCurrentEmployeeId(supabase);
	const isSquadLead =
		!!currentEmployeeId &&
		!!projectRow.squad_lead_employee_id &&
		projectRow.squad_lead_employee_id === currentEmployeeId;

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
			const replyUserAvatar =
				(replyAuthor?.email ? emailToAvatar.get(replyAuthor.email) : null) || null;

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
		const userAvatar = s.is_anonymous
			? null
			: author?.email
				? emailToAvatar.get(author.email) || null
				: null;

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
			concernStatus:
				s.category === "concern"
					? ((s as { concern_status?: string | null }).concern_status as
							| "open"
							| "in_progress"
							| "closed"
							| null ?? null)
					: null,
		};
	});

	return { project, activities, isSquadLead };
}
