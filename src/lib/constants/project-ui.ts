import { LucideIcon, Trophy, AlertCircle, Heart, Zap } from "lucide-react";
import { ProjectHealthStatus } from "@/lib/types/project";
import { ActivityItem } from "@/lib/constants/activity";

/**
 * Common background colors for project health indicators.
 */
export const healthStyles: Record<ProjectHealthStatus, string> = {
  Healthy: "bg-green-500",
  Stable: "bg-[#FFD300]", // Signal Brand Yellow
  "At Risk": "bg-red-500",
};

/**
 * Visual metadata for different project activity/signal types.
 */
export interface ActivityTypeStyle {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const activityTypeStyles: Record<Exclude<ActivityItem["type"], "status">, ActivityTypeStyle> = {
  achievement: { icon: Trophy, color: "text-emerald-500", bgColor: "bg-emerald-50" },
  concern: { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-50" },
  kudos: { icon: Heart, color: "text-pink-500", bgColor: "bg-pink-50" },
};
