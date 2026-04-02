"use client";

import Image from "next/image";
import Link from "next/link";
import { User, AlertCircle, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";

export type ProjectStatus = "active" | "completed" | "on-hold" | "planning";
export type ProjectHealthStatus = "Stable" | "At Risk" | "Critical";

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
}

interface ProjectCardProps {
  project: Project;
}

const statusStyles: Record<ProjectStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  completed: "bg-blue-50 text-blue-700 border-blue-100",
  "on-hold": "bg-amber-50 text-amber-700 border-amber-100",
  planning: "bg-slate-50 text-slate-700 border-slate-100",
};

const healthStyles: Record<ProjectHealthStatus, string> = {
  Stable: "bg-[#FFD300]", // Signal Brand Yellow
  "At Risk": "bg-orange-500",
  Critical: "bg-red-500",
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link 
      href={`/dashboard/projects/${project.id}`}
      className="group relative bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-primary/20 transition-all duration-300 flex flex-col gap-6 cursor-pointer"
    >
      {/* Top Section: Status & Team */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border",
            statusStyles[project.status]
          )}>
            {project.status.replace("-", " ")}
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
          <p className="font-plus-jakarta text-sm text-slate-500 leading-relaxed line-clamp-2">
            {project.description}
          </p>
        </div>

        {/* Project Health Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-[13px] font-medium font-plus-jakarta">
            <span className="text-slate-600">Project Health</span>
            <span className="text-brand-primary">{project.healthStatus}</span>
          </div>
          <Progress value={project.health} className="flex-col gap-0 h-1.5 w-full">
            <ProgressTrack className="h-full w-full bg-slate-100">
              <ProgressIndicator className={cn("h-full transition-all", healthStyles[project.healthStatus])} />
            </ProgressTrack>
          </Progress>
        </div>

        {/* Compact Info Cards */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="font-plus-jakarta text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Concerns</span>
            </div>
            <div className="font-plus-jakarta text-lg font-bold text-brand-primary leading-none">
              {project.concernsCount}
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="font-plus-jakarta text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Achievements</span>
            </div>
            <div className="font-plus-jakarta text-lg font-bold text-brand-primary leading-none">
              {project.achievementsCount}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
