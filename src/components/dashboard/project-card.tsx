"use client";

import Image from "next/image";
import { User } from "iconoir-react";
import { cn } from "@/lib/utils";

export type ProjectStatus = "active" | "completed" | "on-hold" | "planning";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  team: string[]; // Array of avatar URLs
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

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group relative bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-6">
      {/* Top Section: Status & Team */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border",
          statusStyles[project.status]
        )}>
          {project.status.replace("-", " ")}
        </span>
        
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
      <div className="space-y-2">
        <h3 className="font-plus-jakarta text-lg font-bold text-brand-primary group-hover:text-dashboard-label transition-colors">
          {project.name}
        </h3>
        <p className="font-plus-jakarta text-sm text-slate-500 leading-relaxed line-clamp-2">
          {project.description}
        </p>
      </div>

      {/* Footer / Action */}
      <div className="mt-auto pt-4 border-t border-slate-50">
        <button className="text-[13px] font-bold text-brand-primary hover:underline underline-offset-4">
          View Details →
        </button>
      </div>
    </div>
  );
}
