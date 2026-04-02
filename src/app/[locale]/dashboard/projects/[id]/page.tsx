"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, AlertCircle, TrendingUp, User, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { DUMMY_PROJECTS } from "@/lib/constants/projects";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  completed: "bg-blue-50 text-blue-700 border-blue-100",
  "on-hold": "bg-amber-50 text-amber-700 border-amber-100",
  planning: "bg-slate-50 text-slate-700 border-slate-100",
};

const healthStyles: Record<string, string> = {
  Stable: "bg-green-500",
  "At Risk": "bg-orange-500",
  Critical: "bg-red-500",
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("ProjectDetail");
  
  const project = DUMMY_PROJECTS.find(p => p.id === id);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500 font-plus-jakarta">Project not found</p>
        <button 
          onClick={() => router.back()}
          className="text-brand-primary font-bold hover:underline"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-colors font-plus-jakarta text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t("back")}
        </button>
        <button className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-brand-primary hover:border-brand-primary/20 transition-all">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Hero Header Card with Rotating Border */}
      <div className="group relative rounded-[32px] p-[1.5px] overflow-hidden border border-slate-100">
        <div className="absolute inset-[-100%] [background:conic-gradient(from_0deg,transparent_0_80%,#FFD300_100%)] [animation:border-rotate_8s_linear_infinite]" />
        
        <div className="relative z-10 bg-white rounded-[30.5px] p-8 md:p-12 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className={cn(
              "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border",
              statusStyles[project.status]
            )}>
              {project.status.replace("-", " ")}
            </span>
          </div>
          
          <h1 className="font-plus-jakarta text-4xl md:text-5xl font-bold text-brand-primary tracking-tight">
            {project.name}
          </h1>
          
          <p className="font-plus-jakarta text-lg text-slate-500 max-w-3xl leading-relaxed">
            {project.description}
          </p>
        </div>
      </div>

      {/* Pulse Grid: Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Stats */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-plus-jakarta text-[13px] font-bold text-slate-500 uppercase tracking-wider">
              {t("healthLabel")}
            </span>
            <span className={cn("text-xs font-bold", project.healthStatus === "Stable" ? "text-green-600" : "text-amber-600")}>
              {project.healthStatus}
            </span>
          </div>
          <div className="space-y-2">
            <Progress value={project.health} className="h-2 w-full">
              <ProgressTrack className="h-full w-full bg-slate-50">
                <ProgressIndicator className={cn("h-full transition-all", healthStyles[project.healthStatus])} />
              </ProgressTrack>
            </Progress>
            <p className="text-[11px] text-slate-400 font-medium">{project.health}% Optimal Performance</p>
          </div>
        </div>

        {/* Concerns Stats */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-100 transition-colors">
          <div className="space-y-1">
            <span className="font-plus-jakarta text-[13px] font-bold text-slate-500 uppercase tracking-wider">
              {t("concernsLabel")}
            </span>
            <p className="text-3xl font-bold font-plus-jakarta text-brand-primary">{project.concernsCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-red-50 text-red-500 group-hover:scale-110 transition-transform">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Achievements Stats */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-100 transition-colors">
          <div className="space-y-1">
            <span className="font-plus-jakarta text-[13px] font-bold text-slate-500 uppercase tracking-wider">
              {t("achievementsLabel")}
            </span>
            <p className="text-3xl font-bold font-plus-jakarta text-brand-primary">{project.achievementsCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Content: Squad & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Squad Hub */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("squad")}</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{project.team.length} Members</span>
          </div>
          
          <div className="bg-slate-50/50 rounded-[24px] p-6 border border-slate-100 space-y-4">
            <div className="flex flex-col gap-4">
              {project.team.map((avatar, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                    <Image src={avatar} alt="Squad member" fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-brand-primary truncate group-hover:text-dashboard-label transition-colors">
                      Member #{i + 1}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Core Contributor</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed / Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("activity")}</h2>
          
          <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-slate-50 text-slate-300">
              <User className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="font-plus-jakarta text-slate-500 font-medium">{t("noActivity")}</p>
              <p className="text-sm text-slate-400">Activity monitoring for {project.name} is active.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
