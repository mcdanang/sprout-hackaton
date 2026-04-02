"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, AlertCircle, Trophy, Share2, Heart, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { DUMMY_PROJECTS } from "@/lib/constants/projects";
import { DUMMY_ACTIVITIES, type ActivityItem } from "@/lib/constants/activity";
import { getRelativeTime } from "@/lib/utils/time";
import { healthStyles, activityTypeStyles } from "@/lib/constants/project-ui";

function SignalSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
      <div className="flex gap-5">
        <div className="h-12 w-12 rounded-2xl bg-slate-100" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-3 w-16 bg-slate-50 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-50 rounded" />
            <div className="h-4 w-2/3 bg-slate-50 rounded" />
          </div>
          <div className="h-6 w-16 bg-slate-50 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("ProjectDetail");
  
  const project = DUMMY_PROJECTS.find(p => p.id === id);
  const allActivities = DUMMY_ACTIVITIES
    .filter(a => a.projectId === id && a.type !== "status")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Infinite Scroll States
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);

  const visibleActivities = allActivities.slice(0, visibleCount);
  const hasMore = visibleCount < allActivities.length;

  const loadMore = () => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setVisibleCount(prev => prev + 5);
      setIsLoading(false);
    }, 800);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, visibleCount]);

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

      {/* Hero Header Card with Rotating Border & Integrated Squad Hub */}
      <div className="group relative rounded-[32px] p-[1.5px] overflow-hidden border border-slate-100">
        <div className="absolute -inset-full [background:conic-gradient(from_0deg,transparent_0_80%,#FFD300_100%)] animate-[border-rotate_8s_linear_infinite]" />
        
        <div className="relative z-10 bg-white rounded-[30.5px] p-8 md:p-12 space-y-10">
          <div className="space-y-6">
            <h1 className="font-plus-jakarta text-4xl md:text-5xl font-bold text-brand-primary tracking-tight">
              {project.name}
            </h1>
            <p className="font-plus-jakarta text-lg text-slate-500 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="pt-8 border-t border-slate-100/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
               <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block">
                {project.team.length} Members Collaborating
              </span>
              <div className="flex -space-x-3">
                {project.team.map((avatar: string, i: number) => (
                  <div key={i} className="relative h-12 w-12 rounded-full border-4 border-white shadow-sm overflow-hidden bg-slate-50 transition-transform hover:scale-110 hover:z-20 cursor-pointer">
                    <Image src={avatar} alt="Squad member" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="hidden md:block">
              <button className="px-5 py-2.5 rounded-2xl bg-brand-primary/5 text-brand-primary font-plus-jakarta text-sm font-bold hover:bg-brand-primary hover:text-white transition-all">
                Manage Squad
              </button>
            </div>
          </div>
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

      {/* Main Activity Hub: Dynamic List with Infinite Scroll */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("activity")}</h2>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Historical Signal Timeline</span>
        </div>
        
        {visibleActivities.length > 0 ? (
          <div className="space-y-4">
            {visibleActivities.map((activity, index) => {
              const Style = activityTypeStyles[activity.type as Exclude<ActivityItem["type"], "status">];
              const Icon = Style.icon;
              return (
                <div 
                  key={activity.id} 
                  className="group relative bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-brand-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${(index % 5) * 100}ms` }}
                >
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
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {getRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="font-plus-jakarta text-[15px] text-slate-600 leading-relaxed">
                        {activity.content}
                      </p>
                      
                      {/* Heart Like Pill Implementation with Active State */}
                      <div className="flex items-center justify-start pt-1">
                        <button className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all group/like",
                          activity.isLiked 
                            ? "bg-pink-50/50 border-pink-100" 
                            : "bg-white border-slate-100 hover:border-pink-200 hover:bg-pink-50/30"
                        )}>
                          <Heart className={cn(
                            "h-3.5 w-3.5 transition-all",
                            activity.isLiked 
                                ? "text-pink-500 fill-pink-500" 
                                : "text-slate-500 group-hover/like:text-pink-500 group-hover/like:fill-pink-500"
                          )} />
                          <span className={cn(
                            "font-plus-jakarta text-xs font-bold transition-colors",
                            activity.isLiked 
                                ? "text-pink-600" 
                                : "text-slate-600 group-hover/like:text-pink-600"
                          )}>
                            {activity.likesCount}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator / Skeletons */}
            {isLoading && (
              <div className="space-y-4 pt-4">
                <SignalSkeleton />
                <SignalSkeleton />
              </div>
            )}

            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="h-10 w-full" />

            {!hasMore && visibleActivities.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                <div className="h-px w-12 bg-slate-100" />
                <span className="text-[11px] font-bold uppercase tracking-widest">End of Activity Feed</span>
              </div>
            )}
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
    </div>
  );
}
