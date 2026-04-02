import { Project } from "@/lib/types/project";

export const DUMMY_PROJECTS: Project[] = [
	{
		id: "1",
		name: "Internal API Platform",
		description:
			"Cloud-native infrastructure for internal data orchestration and global endpoint management.",
		team: [],
		health: 85,
		healthStatus: "Healthy",
		pulseDescription: "High psychological safety. Team is thriving and showing strong ownership.",
		concernsCount: 2,
		achievementsCount: 8,
		kudosCount: 12,
	},
	{
		id: "2",
		name: "Security Audit 2026",
		description:
			"Comprehensive vulnerability assessment and compliance monitoring across all cloud assets.",
		team: [],
		health: 42,
		healthStatus: "At Risk",
		pulseDescription:
			"Low psychological safety detected. Immediate attention to team concerns recommended.",
		concernsCount: 15,
		achievementsCount: 3,
		kudosCount: 5,
	},
	{
		id: "3",
		name: "Dashboard UI Revamp",
		description:
			"Modernizing the developer portal with glassmorphism and real-time interaction signals.",
		team: [],
		health: 68,
		healthStatus: "Stable",
		pulseDescription:
			"Balanced team dynamics. Communication is steady but room for more proactive engagement.",
		concernsCount: 4,
		achievementsCount: 4,
		kudosCount: 8,
	},
];
