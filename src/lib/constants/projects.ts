import { Project } from "@/lib/types/project";

export const DUMMY_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Internal API Platform",
    description: "Cloud-native infrastructure for internal data orchestration and global endpoint management.",
    team: [],
    health: 85,
    healthStatus: "Healthy",
    concernsCount: 2,
    achievementsCount: 8,
    kudosCount: 12,
  },
  {
    id: "2",
    name: "Security Audit 2026",
    description: "Comprehensive vulnerability assessment and compliance monitoring across all cloud assets.",
    team: [],
    health: 42,
    healthStatus: "At Risk",
    concernsCount: 15,
    achievementsCount: 3,
    kudosCount: 5,
  },
  {
    id: "3",
    name: "Dashboard UI Revamp",
    description: "Modernizing the developer portal with glassmorphism and real-time interaction signals.",
    team: [],
    health: 68,
    healthStatus: "Stable",
    concernsCount: 4,
    achievementsCount: 4,
    kudosCount: 8,
  },
];
