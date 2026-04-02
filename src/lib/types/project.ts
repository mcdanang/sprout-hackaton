export type ProjectHealthStatus = "Healthy" | "Stable" | "At Risk";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  team: TeamMember[];
  health: number; // 0-100
  healthStatus: ProjectHealthStatus;
  concernsCount: number;
  achievementsCount: number;
  kudosCount: number;
}
