export type ProjectHealthStatus = "Healthy" | "Stable" | "At Risk";

export interface Project {
  id: string;
  name: string;
  description: string;
  team: string[]; // Array of avatar URLs
  health: number; // 0-100
  healthStatus: ProjectHealthStatus;
  concernsCount: number;
  achievementsCount: number;
  kudosCount: number;
}
