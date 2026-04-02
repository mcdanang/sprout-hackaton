"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, AlertCircle, Trophy, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { DUMMY_PROJECTS } from "@/lib/constants/projects";
import { DUMMY_ACTIVITIES } from "@/lib/constants/activity";
import { healthStyles } from "@/lib/constants/project-ui";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { SignalComposer } from "@/components/dashboard/signal-composer";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("ProjectDetail");

  const project = DUMMY_PROJECTS.find((p) => p.id === id);
  const activities = DUMMY_ACTIVITIES
    .filter((a) => a.projectId === id && a.type !== "status")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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

      {/* Hero Header Card */}
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

      {/* Team Pulse */}
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

      {/* Tri-Metric Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Signal Composer */}
      <SignalComposer projectId={project.id} projectName={project.name} />

      {/* Activity Feed */}
      <ActivityFeed activities={activities} projectName={project.name} />
    </div>
  );
}
