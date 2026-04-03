export type ManagementKpiTrend = {
	current: number;
	previous: number;
	pctChange: number | null;
};

export type TimeSeriesPoint = {
	date: string; // YYYY-MM-DD
	value: number | null;
};

export type ManagementKpis = {
	concerns: ManagementKpiTrend;
	achievements: ManagementKpiTrend;
	activeProjects: number;
	resolvedConcerns: ManagementKpiTrend;
};

export type SentimentSlice = {
	key: string;
	label: string;
	count: number;
	pct: number;
	color: string;
};

export type LeaderboardRow = {
	rank: number;
	employeeId: string;
	fullName: string;
	squadLabel: string;
	points: number;
};

export type ProjectHealthBucket = {
	healthy: number;
	warning: number;
	critical: number;
};

export type ManagementDashboardSnapshot = {
	kpis: ManagementKpis;
	sentimentSlices: SentimentSlice[];
	leaderboard: LeaderboardRow[];
	projectHealth: ProjectHealthBucket;
	projectStatus: {
		planning: number;
		development: number;
		maintenance: number;
	};
	burnoutAlerts: {
		projectName: string;
		count: number;
	}[];
	pulseTrend: TimeSeriesPoint[];
	engagementTrend: {
		date: string;
		signals: number;
		concerns: number;
	}[];
};
