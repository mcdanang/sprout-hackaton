export type StaffCategoryBreakdown = {
	concern: number;
	achievement: number;
	appreciation: number;
};

export type StaffProjectSentiment = {
	projectId: string;
	projectName: string;
	avgSentiment: number | null;
	signalCount: number;
};

export type StaffTeamActivityItem = {
	id: string;
	category: string;
	title: string;
	preview: string;
	authorName: string;
	projectName: string | null;
	createdAt: string;
};

export type StaffDashboardSnapshot = {
	concernsCount30d: number;
	categoryBreakdown30d: StaffCategoryBreakdown;
	projectSentiments: StaffProjectSentiment[];
	teamActivity: StaffTeamActivityItem[];
};

export const EMPTY_STAFF_DASHBOARD: StaffDashboardSnapshot = {
	concernsCount30d: 0,
	categoryBreakdown30d: { concern: 0, achievement: 0, appreciation: 0 },
	projectSentiments: [],
	teamActivity: [],
};
