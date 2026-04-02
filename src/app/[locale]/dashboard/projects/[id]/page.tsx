"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, AlertCircle, Trophy, User, Share2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { DUMMY_PROJECTS } from "@/lib/constants/projects";

const statusStyles: Record<string, string> = {
  Planning: "bg-slate-50 text-slate-700 border-slate-100",
  Development: "bg-blue-50 text-blue-700 border-blue-100",
  UAT: "bg-amber-50 text-amber-700 border-amber-100",
  Deployment: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Maintenance: "bg-indigo-50 text-indigo-700 border-indigo-100",
};

const healthStyles: Record<string, string> = {
  Healthy: "bg-green-500",
  Stable: "bg-[#FFD300]",
  "At Risk": "bg-red-500",
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
        <div className="absolute -inset-full [background:conic-gradient(from_0deg,transparent_0_80%,#FFD300_100%)] animate-[border-rotate_8s_linear_infinite]" />
        
        <div className="relative z-10 bg-white rounded-[30.5px] p-8 md:p-12 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
              statusStyles[project.status]
            )}>
              {project.status}
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

      {/* Team Pulse: Full Width Heading */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("healthLabel")}</h2>
            <p className="text-sm text-slate-500 leading-none font-medium opacity-80 italic">
              Real-time team performance and psychological safety indicator
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className={cn("text-2xl font-bold font-plus-jakarta", 
              project.healthStatus === "Healthy" ? "text-green-600" : 
              project.healthStatus === "At Risk" ? "text-red-500" : 
              "text-[#FFD300]"
            )}>
              {project.healthStatus}
            </span>
            <span className={cn("text-[11px] font-extrabold uppercase tracking-[0.2em]", 
              project.healthStatus === "Healthy" ? "text-green-600/70" : 
              project.healthStatus === "At Risk" ? "text-red-500/70" : 
              "text-brand-primary/70"
            )}>
              {project.health}% Optimal
            </span>
          </div>
        </div>
        
        <Progress value={project.health} className="h-3 w-full">
          <ProgressTrack className="h-full w-full bg-slate-50">
            <ProgressIndicator className={cn("h-full transition-all duration-1000", healthStyles[project.healthStatus])} />
          </ProgressTrack>
        </Progress>
      </div>

      {/* Tri-Metric Summary: Concerns, Achievements, Kudos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Concerns */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-100 transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="font-plus-jakarta text-[13px] font-bold text-slate-500 uppercase tracking-wider">
              {t("concernsLabel")}
            </span>
            <p className="text-3xl font-bold font-plus-jakarta text-brand-primary group-hover:text-red-600 transition-colors">{project.concernsCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-100 transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="font-plus-jakarta text-[13px] font-bold text-slate-500 uppercase tracking-wider">
              {t("achievementsLabel")}
            </span>
            <p className="text-3xl font-bold font-plus-jakarta text-brand-primary group-hover:text-emerald-600 transition-colors">{project.achievementsCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <Trophy className="h-6 w-6" />
          </div>
        </div>

        {/* Kudos */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-pink-100 transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="font-plus-jakarta text-[13px] font-bold text-slate-500 uppercase tracking-wider">
              Team Kudos
            </span>
            <p className="text-3xl font-bold font-plus-jakarta text-brand-primary group-hover:text-pink-600 transition-colors">{project.kudosCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-pink-50 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
            <Heart className="h-6 w-6 fill-pink-500/10" />
          </div>
        </div>
      </div>

      {/* Squad Overview Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("squad")}</h2>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{project.team.length} Members Collaborating</span>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {project.team.map((avatar, i) => (
            <div key={i} className="flex flex-col items-center gap-3 bg-white rounded-[24px] p-6 border border-slate-100 min-w-[160px] text-center hover:shadow-md transition-all group">
              <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                <Image src={avatar} alt="Squad member" fill className="object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-brand-primary truncate w-full">
                  Member #{i + 1}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contributor</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Activity Hub: Full Width */}
      <div className="space-y-6">
        <h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("activity")}</h2>
        
        <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 w-full">
          <div className="p-6 rounded-full bg-slate-50 text-slate-300">
            <User className="h-12 w-12" />
          </div>
          <div className="space-y-2 max-w-md">
            <p className="font-plus-jakarta text-xl text-slate-600 font-bold">{t("noActivity")}</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Monitoring all ownership signals and tactical updates for <span className="font-bold text-brand-primary font-plus-jakarta">{project.name}</span>. Activity will appear automatically here as signals are submitted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
