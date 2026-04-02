"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortInfoCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function ShortInfoCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  className,
}: ShortInfoCardProps) {
  return (
    <div className={cn(
      "bg-slate-50/50 rounded-[24px] p-6 border border-slate-100 flex flex-col gap-4 min-w-[180px]",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-lg bg-white shadow-sm border border-slate-50", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-plus-jakarta text-[15px] font-semibold text-slate-600">
          {title}
        </span>
      </div>
      <div className="font-plus-jakarta text-[32px] font-bold text-brand-primary leading-none">
        {value}
      </div>
    </div>
  );
}
