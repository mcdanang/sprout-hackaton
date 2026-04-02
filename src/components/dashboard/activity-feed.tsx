"use client";

import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ActivityItem } from "@/lib/constants/activity";
import { ActivityCard } from "./activity-card";

function SignalSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
      <div className="flex gap-5">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 shrink-0" />
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

interface Props {
  activities: ActivityItem[];
  projectName: string;
}

export function ActivityFeed({ activities, projectName }: Props) {
  const t = useTranslations("ProjectDetail");
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const visibleActivities = activities.slice(0, visibleCount);
  const hasMore = visibleCount < activities.length;

  const loadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 5);
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

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, visibleCount]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("activity")}</h2>
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Historical Signal Timeline</span>
      </div>

      {visibleActivities.length > 0 ? (
        <div className="space-y-4">
          {visibleActivities.map((activity, index) => (
            <ActivityCard key={activity.id} activity={activity} index={index} />
          ))}

          {isLoading && (
            <div className="space-y-4 pt-4">
              <SignalSkeleton />
              <SignalSkeleton />
            </div>
          )}

          <div ref={observerTarget} className="h-10 w-full" />

          {!hasMore && (
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
              Looking for new signals! Ownership updates and tactical insights for{" "}
              <span className="font-bold text-brand-primary font-plus-jakarta">{projectName}</span>{" "}
              will appear in this timeline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
