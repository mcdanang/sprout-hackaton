import type { SentimentSlice } from "./management-dashboard-types";

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
	sentimentSlices: SentimentSlice[];
	concernStatusCount: {
		open: number;
		inProgress: number;
		closed: number;
	};
	totalContributionPoints: number;
};

export const EMPTY_STAFF_DASHBOARD: StaffDashboardSnapshot = {
	concernsCount30d: 0,
	categoryBreakdown30d: { concern: 0, achievement: 0, appreciation: 0 },
	projectSentiments: [],
	teamActivity: [],
	sentimentSlices: [],
	concernStatusCount: { open: 0, inProgress: 0, closed: 0 },
	totalContributionPoints: 0,
};
