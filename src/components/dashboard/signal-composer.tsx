"use client";

import { useState } from "react";
import { AlertCircle, Trophy, Heart, Send, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  projectName: string;
}

type SignalType = "concern" | "achievement" | "kudos";

const SIGNAL_TYPES = [
  {
    id: "concern" as const,
    label: "Concern",
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-50",
    hoverBg: "hover:bg-red-100/50",
    activeBorder: "border-red-200",
    activeGlow: "shadow-red-500/10",
    placeholder: "What's the risk or blocker?",
  },
  {
    id: "achievement" as const,
    label: "Achievement",
    icon: Trophy,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    hoverBg: "hover:bg-emerald-100/50",
    activeBorder: "border-emerald-200",
    activeGlow: "shadow-emerald-500/10",
    placeholder: "What did the team accomplish?",
  },
  {
    id: "kudos" as const,
    label: "Kudos",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    hoverBg: "hover:bg-pink-100/50",
    activeBorder: "border-pink-200",
    activeGlow: "shadow-pink-500/10",
    placeholder: "Who deserves a shoutout?",
  },
];

export function SignalComposer({ projectName }: Props) {
  const [selectedType, setSelectedType] = useState<SignalType | null>(null);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const activeType = SIGNAL_TYPES.find((t) => t.id === selectedType);

  const handlePost = () => {
    if (!content.trim()) return;
    setIsSending(true);
    // Simulate network delay
    setTimeout(() => {
      setIsSending(false);
      setContent("");
      setSelectedType(null);
    }, 1500);
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all duration-500 overflow-hidden",
        selectedType ? "ring-2 ring-brand-primary/5 shadow-lg" : "hover:border-slate-200"
      )}
    >
      <div className="p-6 md:p-8 space-y-6">
        {/* Header / Prompt */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-plus-jakarta text-lg font-bold text-brand-primary">
              Signal Composer
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Update status for {projectName}
            </p>
          </div>
          {selectedType && (
            <button 
              onClick={() => setSelectedType(null)}
              className="p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Type Selector Tiles */}
        <div className="grid grid-cols-3 gap-4">
          {SIGNAL_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = selectedType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 group",
                  isActive 
                    ? cn("border-transparent shadow-xl", type.bgColor, type.activeGlow) 
                    : cn("bg-white border-slate-100", type.hoverBg)
                )}
              >
                <div className={cn(
                  "p-3 rounded-xl transition-transform group-hover:scale-110",
                  isActive ? "bg-white shadow-sm" : type.bgColor,
                  type.color
                )}>
                  <Icon className={cn("h-6 w-6", isActive && "fill-current/10")} />
                </div>
                <span className={cn(
                  "font-plus-jakarta text-xs font-bold uppercase tracking-wider",
                  isActive ? type.color : "text-slate-500"
                )}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expanding Input Field */}
        {selectedType && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 pt-2">
            <div className={cn(
              "relative rounded-[24px] border transition-all duration-300 bg-slate-50/30 overflow-hidden",
              activeType?.activeBorder
            )}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={activeType?.placeholder}
                className="w-full bg-transparent p-6 font-plus-jakarta text-sm text-brand-primary placeholder:text-slate-400 focus:outline-none min-h-[140px] resize-none"
                autoFocus
              />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                <button
                  disabled={!content.trim() || isSending}
                  onClick={handlePost}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-plus-jakarta text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:scale-100",
                    activeType?.id === 'concern' ? "bg-red-500 text-white" :
                    activeType?.id === 'achievement' ? "bg-emerald-500 text-white" :
                    "bg-brand-primary text-white"
                  )}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>SIMULATING...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>SIGNAL NOW</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
