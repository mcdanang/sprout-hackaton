import { Project } from "@/lib/types/project";

export const DUMMY_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Internal API Platform",
    description: "Cloud-native infrastructure for internal data orchestration and global endpoint management.",
    team: [
      "https://i.pravatar.cc/150?u=1",
      "https://i.pravatar.cc/150?u=2",
      "https://i.pravatar.cc/150?u=3",
      "https://i.pravatar.cc/150?u=4",
      "https://i.pravatar.cc/150?u=5",
    ],
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
    team: [
      "https://i.pravatar.cc/150?u=10",
      "https://i.pravatar.cc/150?u=11",
      "https://i.pravatar.cc/150?u=12",
    ],
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
    team: [
      "https://i.pravatar.cc/150?u=20",
      "https://i.pravatar.cc/150?u=21",
    ],
    health: 68,
    healthStatus: "Stable",
    concernsCount: 4,
    achievementsCount: 4,
    kudosCount: 8,
  },
];
