"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, AlertCircle, Trophy, User, Share2, Heart, Clock, MessageSquare, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { DUMMY_PROJECTS } from "@/lib/constants/projects";
import { DUMMY_ACTIVITIES, type ActivityItem } from "@/lib/constants/activity";

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

const activityTypeStyles: Record<ActivityItem["type"], { icon: any, color: string, bgColor: string }> = {
  achievement: { icon: Trophy, color: "text-emerald-500", bgColor: "bg-emerald-50" },
  concern: { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-50" },
  kudos: { icon: Heart, color: "text-pink-500", bgColor: "bg-pink-50" },
  status: { icon: Zap, color: "text-blue-500", bgColor: "bg-blue-50" },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("ProjectDetail");
  
  const project = DUMMY_PROJECTS.find(p => p.id === id);
  const projectActivities = DUMMY_ACTIVITIES.filter(a => a.projectId === id).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

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
            <p className="text-sm text-slate-600 leading-none font-medium">
              Real-time team performance and psychological safety indicator
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-2xl font-bold font-plus-jakarta text-slate-900">
              {project.healthStatus}
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-700">
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

      {/* Main Activity Hub: Dynamic List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("activity")}</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historical Signal Timeline</span>
        </div>
        
        {projectActivities.length > 0 ? (
          <div className="space-y-4">
            {projectActivities.map((activity) => {
              const Style = activityTypeStyles[activity.type];
              const Icon = Style.icon;
              return (
                <div key={activity.id} className="group relative bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-brand-primary/10">
                  <div className="flex gap-5">
                    <div className="shrink-0">
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", Style.bgColor, Style.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative h-6 w-6 rounded-full overflow-hidden border border-slate-100">
                            <Image src={activity.userAvatar} alt={activity.userName} fill className="object-cover" />
                          </div>
                          <span className="font-plus-jakarta text-sm font-bold text-brand-primary">{activity.userName}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                            {activity.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {new Date(activity.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <p className="font-plus-jakarta text-[15px] text-slate-600 leading-relaxed">
                        {activity.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6 w-full">
            <div className="p-6 rounded-full bg-slate-50 text-slate-300">
              <Zap className="h-12 w-12" />
            </div>
            <div className="space-y-2 max-w-sm">
              <p className="font-plus-jakarta text-xl text-slate-600 font-bold">{t("noActivity")}</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Looking for new signals! Ownership updates and tactical insights for <span className="font-bold text-brand-primary font-plus-jakarta">{project.name}</span> will appear in this timeline.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Squad Overview Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("squad")}</h2>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{project.team.length} Members Collaborating</span>
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
    </div>
  );
}
