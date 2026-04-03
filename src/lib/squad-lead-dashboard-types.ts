import type { ManagementKpiTrend, SentimentSlice, LeaderboardRow } from "./management-dashboard-types";

export type SquadLeadDashboardSnapshot = {
	kpis: {
		projectsLed: number;
		totalSignals: ManagementKpiTrend;
		openConcerns: number;
		avgSentiment: number | null;
	};
	projectSentiments: {
		projectId: string;
		projectName: string;
		avgSentiment: number | null;
		signalCount: number;
	}[];
	sentimentSlices: SentimentSlice[];
	leaderboard: LeaderboardRow[];
	concernStatusCount: {
		open: number;
		inProgress: number;
		closed: number;
	};
	sentimentTrend: { date: string; value: number | null }[];
	activityTrend: { date: string; count: number }[];
};
