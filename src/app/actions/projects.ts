"use server";

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

import type { ActivityItem } from "@/lib/constants/activity";
import { analyzeSignalWithMockAI, clamp, type SignalIssueCategory } from "@/lib/signal-ai";
import { Project, TeamMember } from "@/lib/types/project";

type ProjectMetrics = {
	health: number;
	healthStatus: Project["healthStatus"];
};

function computeHealth(averageSentiment: number | null): ProjectMetrics {
	const normalizedSentiment = Math.round(clamp(averageSentiment ?? 50, 0, 100));
	let healthStatus: Project["healthStatus"];
	if (normalizedSentiment >= 70) healthStatus = "Healthy";
	else if (normalizedSentiment <= 40) healthStatus = "At Risk";
	else healthStatus = "Stable";

	return {
		health: normalizedSentiment,
		healthStatus,
	};
}

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
		.select("id, project_id, email, full_name, job_position")
		.order("email");
 
	const teamByProjectId = new Map<string, TeamMember[]>();
	const allTeamEmails = (employees ?? []).map(e => e.email).filter(Boolean) as string[];
	const teamEmailToAvatar = new Map<string, string | null>();

	if (allTeamEmails.length > 0) {
		try {
			const clerk = await clerkClient();
			const { data: clerkUsers } = await clerk.users.getUserList({
				emailAddress: allTeamEmails,
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

	for (const e of employees ?? []) {
		if (!e.project_id || !e.email) continue;
		const avatar =
			teamEmailToAvatar.get(e.email) || null;
		const list = teamByProjectId.get(e.project_id) ?? [];
		list.push({
			id: e.id,
			name: e.full_name,
			role: e.job_position,
			avatar,
		});
		teamByProjectId.set(e.project_id, list);
	}
 
	// Signal metrics.
	let signals: {
		project_id: string | null;
		category: string | null;
		title?: string | null;
		details?: string | null;
		sentiment_score?: number | null;
		ai_issue_category?: SignalIssueCategory | null;
	}[] = [];
	try {
		const { data } = await supabase
			.from("signals")
			.select("project_id, category, title, details, sentiment_score, ai_issue_category");
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
		if (!s.project_id) continue; // general signals don't affect project metrics
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
 
		if (s.category === "concern") current.concernsCount += 1;
		if (s.category === "achievement") current.achievementsCount += 1;
		if (s.category === "appreciation") current.kudosCount += 1;
		const analyzed = analyzeSignalWithMockAI(s);
		const sentiment = typeof s.sentiment_score === "number" ? s.sentiment_score : analyzed.sentiment;
		const issueCategory = isSignalIssueCategory(s.ai_issue_category)
			? s.ai_issue_category
			: analyzed.issueCategory;
		current.sentimentTotal += sentiment;
		current.sentimentCount += 1;
		current.issueCounts[issueCategory] += 1;
		metricsByProjectId.set(s.project_id, current);
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
		const averageSentiment =
			metrics.sentimentCount > 0 ? metrics.sentimentTotal / metrics.sentimentCount : null;
		const healthMetrics = computeHealth(averageSentiment);
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
 
	// 2) Team members from employees assigned to the project
	const { data: employeeRows } = await supabase
		.from("employees")
		.select("id, full_name, email, job_position, auth_id")
		.eq("project_id", projectId)
		.order("full_name");
 
	const teamEmails = (employeeRows ?? []).map(e => e.email).filter(Boolean) as string[];
	const teamEmailToAvatar = new Map<string, string | null>();
	
	if (teamEmails.length > 0) {
		try {
			const clerk = await clerkClient();
			const { data: clerkUsers } = await clerk.users.getUserList({ emailAddress: teamEmails, limit: 100 });
			console.log("[team] emails queried:", teamEmails);
			console.log("[team] clerk users:", clerkUsers.map(u => ({ imageUrl: u.imageUrl, emails: u.emailAddresses.map(e => e.emailAddress) })));
			for (const u of clerkUsers) {
				for (const em of u.emailAddresses) {
					teamEmailToAvatar.set(em.emailAddress, u.imageUrl ?? null);
				}
			}
		} catch (err) {
			console.error("[team] clerk error:", err);
		}
	}
 
	const team = (employeeRows ?? []).map(e => ({
		id: e.id,
		name: e.full_name,
		role: e.job_position,
		avatar: teamEmailToAvatar.get(e.email) || null,
	}));
 
	const { data: signals } = await supabase
		.from("signals")
		.select(
			"id, project_id, author_employee_id, is_anonymous, category, title, details, created_at, is_public, sentiment_score, ai_issue_category",
		)
		.eq("project_id", projectId)
		.order("created_at", { ascending: false });
 
	const safeSignals = signals ?? [];
 
	let concernsCount = 0;
	let achievementsCount = 0;
	let kudosCount = 0;
	let sentimentTotal = 0;
	let sentimentCount = 0;
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
		if (s.category === "concern") concernsCount += 1;
		if (s.category === "achievement") achievementsCount += 1;
		if (s.category === "appreciation") kudosCount += 1;
		const analyzed = analyzeSignalWithMockAI(s);
		const sentiment = typeof s.sentiment_score === "number" ? s.sentiment_score : analyzed.sentiment;
		const issueCategory = isSignalIssueCategory(s.ai_issue_category)
			? s.ai_issue_category
			: analyzed.issueCategory;
		sentimentTotal += sentiment;
		sentimentCount += 1;
		issueCounts[issueCategory] += 1;
	}
	const averageSentiment = sentimentCount > 0 ? sentimentTotal / sentimentCount : null;
	const healthMetrics = computeHealth(averageSentiment);
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
			const { data: clerkUsers } = await clerk.users.getUserList({ emailAddress: emails, limit: 100 });
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
			: (author?.email ? (emailToAvatar.get(author.email) || null) : null);
 
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
