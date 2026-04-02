"use client";

import Image from "next/image";
import Link from "next/link";
import { User } from "iconoir-react";
import { AlertCircle, TrendingUp, ArrowRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";

export type ProjectStatus = "Planning" | "Development" | "UAT" | "Deployment" | "Maintenance";
export type ProjectHealthStatus = "Healthy" | "Stable" | "At Risk";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  team: string[]; // Array of avatar URLs
  health: number; // 0-100
  healthStatus: ProjectHealthStatus;
  concernsCount: number;
  achievementsCount: number;
  kudosCount: number;
}

interface ProjectCardProps {
  project: Project;
}

const statusStyles: Record<ProjectStatus, string> = {
  Planning: "bg-slate-50 text-slate-700 border-slate-100",
  Development: "bg-blue-50 text-blue-700 border-blue-100",
  UAT: "bg-amber-50 text-amber-700 border-amber-100",
  Deployment: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Maintenance: "bg-indigo-50 text-indigo-700 border-indigo-100",
};

const healthStyles: Record<ProjectHealthStatus, string> = {
  Healthy: "bg-green-500",
  Stable: "bg-[#FFD300]", // Signal Brand Yellow
  "At Risk": "bg-red-500",
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link 
      href={`/dashboard/projects/${project.id}`}
      className="group relative flex h-full flex-col cursor-pointer overflow-hidden rounded-[24px] border border-slate-100 bg-white p-[1.5px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl"
    >
      {/* Moving Border Background (only visible on hover) */}
      <div className="absolute -inset-full animate-[border-rotate_4s_linear_infinite] opacity-0 transition-opacity duration-500 [background:conic-gradient(from_0deg,transparent_0_80%,#FFD300_100%)] group-hover:opacity-100" />
      
      {/* Inner Mask/Content Wrapper */}
      <div className="relative z-10 flex h-full w-full flex-col gap-6 rounded-[22.5px] bg-white p-6">
        {/* Top Section: Status & Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
              statusStyles[project.status]
            )}>
              {project.status}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </div>
          
          <div className="flex -space-x-2">
            {project.team.length > 0 ? (
              <>
                {project.team.slice(0, 4).map((avatar, i) => (
                  <div key={i} className="relative h-8 w-8 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                    <Image
                      src={avatar}
                      alt="Team member"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                {project.team.length > 4 && (
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    +{project.team.length - 4}
                  </div>
                )}
              </>
            ) : (
              <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center">
                <User className="h-4 w-4 text-slate-300" />
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-plus-jakarta text-lg font-bold text-brand-primary group-hover:text-dashboard-label transition-colors">
              {project.name}
            </h3>
            <p className="font-plus-jakarta text-sm text-slate-500 leading-relaxed line-clamp-2 min-h-[40px]">
              {project.description}
            </p>
          </div>

          {/* Project Health Section -> Team Pulse */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-[13px] font-medium font-plus-jakarta">
              <span className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Team Pulse</span>
              <span className={cn("font-bold", project.healthStatus === "At Risk" ? "text-red-500" : project.healthStatus === "Healthy" ? "text-green-600" : "text-brand-primary")}>
                {project.healthStatus}
              </span>
            </div>
            <Progress value={project.health} className="flex-col gap-0 h-1.5 w-full">
              <ProgressTrack className="h-full w-full bg-slate-100">
                <ProgressIndicator className={cn("h-full transition-all", healthStyles[project.healthStatus])} />
              </ProgressTrack>
            </Progress>
          </div>

          {/* Metrics Grid: Concerns, Achievements, Kudos - Revamped for Better Spacing */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div className="bg-slate-50/50 rounded-2xl p-2.5 border border-slate-100 flex items-center gap-2 min-w-0 hover:bg-white hover:shadow-sm transition-all">
              <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-plus-jakarta text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">Rip</span>
                <span className="font-plus-jakarta text-sm font-bold text-brand-primary leading-none">
                  {project.concernsCount}
                </span>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-2.5 border border-slate-100 flex items-center gap-2 min-w-0 hover:bg-white hover:shadow-sm transition-all">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-plus-jakarta text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">Win</span>
                <span className="font-plus-jakarta text-sm font-bold text-brand-primary leading-none">
                  {project.achievementsCount}
                </span>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-2.5 border border-slate-100 flex items-center gap-2 min-w-0 hover:bg-white hover:shadow-sm transition-all">
              <div className="h-7 w-7 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                <Heart className="h-4 w-4 text-pink-500 fill-pink-500/10" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-plus-jakarta text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">Kudos</span>
                <span className="font-plus-jakarta text-sm font-bold text-brand-primary leading-none">
                  {project.kudosCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
