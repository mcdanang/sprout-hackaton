"use client";

import { useTranslations } from "next-intl";
import { Folder } from "iconoir-react";

export default function ProjectsPage() {
  const t = useTranslations("Projects");

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="space-y-4">
        <p className="font-plus-jakarta text-[12px] font-semibold leading-[16px] tracking-[1.2px] uppercase text-[#B09100]">
          {t("label")}
        </p>
        <h1 className="font-plus-jakarta text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-brand-primary">
          {t("title")}
        </h1>
        <p className="font-plus-jakarta text-[18px] font-normal leading-[28px] text-dashboard-description max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {/* Projects Content Placeholder */}
      <div className="rounded-[32px] border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center bg-white/50 shadow-sm">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
          <Folder className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="font-plus-jakarta text-xl font-bold text-brand-primary mb-2">
          No projects yet
        </h3>
        <p className="font-plus-jakarta text-slate-500 max-w-xs">
          This page is currently a placeholder and will be functional soon.
        </p>
      </div>
    </div>
  );
}
