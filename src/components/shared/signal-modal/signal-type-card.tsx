"use client";

import { cn } from "@/lib/utils";
import { SignalTypeConfig } from "@/lib/constants/signal-types";

interface Props {
  type: SignalTypeConfig;
  isActive: boolean;
  onClick: (id: SignalTypeConfig["id"]) => void;
}

export function SignalTypeCard({ type, isActive, onClick }: Props) {
  const Icon = type.icon;
  return (
    <button
      key={type.id}
      onClick={() => onClick(type.id)}
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 py-4 px-3 rounded-2xl border transition-all duration-200 group",
        isActive
          ? cn("border-transparent shadow-md", type.activeBg)
          : cn(
              "bg-white border-slate-100",
              type.hoverBg,
              "hover:border-transparent hover:shadow-sm"
            )
      )}
    >
      <div
        className={cn(
          "p-2.5 rounded-xl transition-transform group-hover:scale-110",
          isActive ? "bg-white shadow-sm" : type.bgColor,
          type.color
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span
        className={cn(
          "font-plus-jakarta text-[11px] font-bold uppercase tracking-wider",
          isActive ? type.color : "text-slate-500"
        )}
      >
        {type.label}
      </span>
    </button>
  );
}
