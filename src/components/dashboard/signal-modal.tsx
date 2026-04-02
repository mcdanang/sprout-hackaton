"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Trophy, Heart, Send, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  projectName: string;
  projectId: string;
  onClose: () => void;
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
    activeBg: "bg-red-50",
    sendBg: "bg-red-500",
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
    activeBg: "bg-emerald-50",
    sendBg: "bg-emerald-500",
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
    activeBg: "bg-pink-50",
    sendBg: "bg-brand-primary",
    placeholder: "Who deserves a shoutout?",
  },
];

export function SignalModal({ isOpen, projectName, onClose }: Props) {
  const [selectedType, setSelectedType] = useState<SignalType | null>(null);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const activeType = SIGNAL_TYPES.find((t) => t.id === selectedType);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null);
      setContent("");
      setIsSending(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isSending) return;
    onClose();
  };

  const handlePost = () => {
    if (!content.trim() || !selectedType) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-6">
            <div className="space-y-0.5">
              <h3 className="font-plus-jakarta text-lg font-bold text-brand-primary">
                New Signal
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {projectName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Type selector */}
          <div className="px-8 pb-6 grid grid-cols-3 gap-3">
            {SIGNAL_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2.5 py-4 px-3 rounded-2xl border transition-all duration-200 group",
                    isActive
                      ? cn("border-transparent shadow-md", type.activeBg)
                      : cn("bg-white border-slate-100", type.hoverBg, "hover:border-transparent hover:shadow-sm")
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-xl transition-transform group-hover:scale-110",
                    isActive ? "bg-white shadow-sm" : type.bgColor,
                    type.color
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "font-plus-jakarta text-[11px] font-bold uppercase tracking-wider",
                    isActive ? type.color : "text-slate-500"
                  )}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Textarea — visible only after type selected */}
          <div
            className={cn(
              "px-8 transition-all duration-300 overflow-hidden",
              selectedType ? "pb-6 max-h-[300px] opacity-100" : "max-h-0 opacity-0 pb-0"
            )}
          >
            <div className={cn(
              "relative rounded-[20px] border transition-all duration-200 bg-slate-50/50 overflow-hidden",
              activeType?.activeBorder
            )}>
              <textarea
                key={selectedType}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={activeType?.placeholder}
                className="w-full bg-transparent p-5 pb-16 font-plus-jakarta text-sm text-brand-primary placeholder:text-slate-400 focus:outline-none min-h-[120px] resize-none"
                autoFocus={!!selectedType}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="font-plus-jakarta text-[11px] text-slate-400">
                  {content.length}/500
                </span>
                <button
                  disabled={!content.trim() || isSending}
                  onClick={handlePost}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl font-plus-jakarta text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:scale-100",
                    activeType ? cn(activeType.sendBg, "text-white") : "bg-brand-primary text-white"
                  )}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Post Signal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer hint */}
          {!selectedType && (
            <div className="px-8 pb-8 animate-in fade-in duration-200">
              <p className="text-[12px] text-slate-400 font-plus-jakarta text-center">
                Choose a signal type above to continue
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
