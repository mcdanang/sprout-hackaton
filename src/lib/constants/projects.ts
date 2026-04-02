import { type Project, type ProjectHealthStatus } from "@/components/dashboard/project-card";

/**
 * Calculates the Project Health Status based on Achievement vs Concern counts.
 * - Healthy: Achievement >= Concerns + 4
 * - At Risk: Concerns >= Achievement + 4
 * - Stable: Difference between counts is 0, 1, 2, or 3.
 */
function calculateHealthStatus(achievements: number, concerns: number): ProjectHealthStatus {
  const diff = achievements - concerns;
  if (diff >= 4) return "Healthy";
  if (diff <= -4) return "At Risk";
  return "Stable";
}

export const DUMMY_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Internal API Platform",
    description: "Modernizing our internal gateway with high-performance edge computing and unified authentication.",
    status: "Development",
    health: 65,
    healthStatus: calculateHealthStatus(8, 12), // diff -4 -> At Risk
    concernsCount: 12,
    achievementsCount: 8,
    team: [
      "https://i.pravatar.cc/150?u=1",
      "https://i.pravatar.cc/150?u=2",
      "https://i.pravatar.cc/150?u=3",
      "https://i.pravatar.cc/150?u=4",
      "https://i.pravatar.cc/150?u=5",
    ],
  },
  {
    id: "2",
    name: "Security Audit 2026",
    description: "Comprehensive review of all data-at-rest and in-transit protocols for the upcoming compliance cycle.",
    status: "Planning",
    health: 90,
    healthStatus: calculateHealthStatus(3, 0), // diff 3 -> Stable
    concernsCount: 0,
    achievementsCount: 3,
    team: [
      "https://i.pravatar.cc/150?u=10",
      "https://i.pravatar.cc/150?u=11",
    ],
  },
  {
    id: "3",
    name: "Dashboard UI Revamp",
    description: "Shifting our admin interface to a more fluid, component-based architecture with better accessibility.",
    status: "Maintenance",
    health: 100,
    healthStatus: calculateHealthStatus(15, 2), // diff 13 -> Healthy
    concernsCount: 2,
    achievementsCount: 15,
    team: [
      "https://i.pravatar.cc/150?u=20",
      "https://i.pravatar.cc/150?u=21",
      "https://i.pravatar.cc/150?u=22",
    ],
  },
  {
    id: "4",
    name: "Cross-platform Mobile App",
    description: "Building the next-gen Signal mobile companion using React Native and shared business logic layers.",
    status: "UAT",
    health: 40,
    healthStatus: calculateHealthStatus(5, 24), // diff -19 -> At Risk
    concernsCount: 24,
    achievementsCount: 5,
    team: [
      "https://i.pravatar.cc/150?u=30",
      "https://i.pravatar.cc/150?u=31",
      "https://i.pravatar.cc/150?u=32",
      "https://i.pravatar.cc/150?u=33",
    ],
  },
  {
    id: "5",
    name: "Legacy Migration",
    description: "Phasing out legacy monolithic services into a modern microservices mesh strategy.",
    status: "Deployment",
    health: 85,
    healthStatus: calculateHealthStatus(10, 10), // diff 0 -> Stable
    concernsCount: 10,
    achievementsCount: 10,
    team: [
      "https://i.pravatar.cc/150?u=40",
      "https://i.pravatar.cc/150?u=41",
    ],
  },
];
