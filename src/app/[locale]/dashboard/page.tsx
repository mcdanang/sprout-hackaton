"use client";

import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { Quote } from "iconoir-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const { user } = useUser();
  const firstName = user?.firstName || "Alex"; // Fallback to Alex as in the mockup

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="space-y-4">
        <p className="font-plus-jakarta text-[12px] font-semibold leading-[16px] tracking-[1.2px] uppercase text-[#B09100]">
          {t("title")}
        </p>
        <h1 className="font-plus-jakarta text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-[#191C1D]">
          {t("welcome", { name: firstName })}
        </h1>
        <p className="font-plus-jakarta text-[18px] font-normal leading-[28px] text-[#3F484A] max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {/* AI Sanctuary Quote Card */}
      <div className={cn(
        "relative overflow-hidden rounded-[32px] p-10 md:p-14",
        "bg-[#FFFBEB] border border-[#FEF3C7] shadow-sm"
      )}>
        <Quote className="h-10 w-10 text-[#FEF3C7] mb-8" />
        
        <div className="space-y-8">
          <p className="font-plus-jakarta text-[32px] md:text-[40px] font-medium leading-tight tracking-tight text-[#191C1D]">
            "{t("quote.text")}"
          </p>
          
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-8 bg-[#FEF3C7]" />
            <span className="font-plus-jakarta text-[14px] font-bold tracking-[1.5px] uppercase text-[#3F484A]">
              {t("quote.author")}
            </span>
          </div>
        </div>

        {/* Decorative background element if needed, though simple is better here */}
      </div>
    </div>
  );
}
