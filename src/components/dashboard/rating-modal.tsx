"use client";

import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { rateAchievement } from "@/app/actions/signal-interactions";
import { toast } from "sonner";

interface RatingModalProps {
  signalId: string;
  signalTitle: string;
  onClose: () => void;
  onSuccess: (points: number) => void;
}

export function RatingModal({ signalId, signalTitle, onClose, onSuccess }: RatingModalProps) {
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [selectedStar, setSelectedStar] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedStar === 0) return;
    setIsSubmitting(true);
    try {
      const res = await rateAchievement(signalId, selectedStar);
      if (res.ok) {
        toast.success("Achievement rated successfully!");
        onSuccess(selectedStar);
        onClose();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rate achievement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 animate-in fade-in duration-200" />
      <div
        className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-6">
            <div className="space-y-0.5">
              <h3 className="font-plus-jakarta text-lg font-bold text-brand-primary">
                Rate Achievement
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Acknowledge team excellence
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-8 pb-8 space-y-6">
            {/* Signal Context */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
              <p className="text-xs font-medium text-emerald-800 line-clamp-2">
                &quot;{signalTitle}&quot;
              </p>
            </div>

            {/* Star Selection */}
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setSelectedStar(star)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star
                      className={cn(
                        "h-10 w-10 transition-all duration-300",
                        (hoveredStar >= star || selectedStar >= star)
                          ? "fill-amber-400 text-amber-400 scale-110"
                          : "text-slate-200"
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="font-plus-jakarta text-sm font-bold text-slate-500 min-h-5">
                {selectedStar > 0 ? (
                  selectedStar === 6 ? "Masterpiece! 🏆" :
                  selectedStar === 5 ? "Outstanding Service! 🌟" :
                  selectedStar === 4 ? "Great Impact! ✨" :
                  selectedStar === 3 ? "Solid Achievement 👍" :
                  selectedStar === 2 ? "Good Job 🙂" :
                  "Acknowledged"
                ) : "Select rating (1-6 stars)"}
              </p>
            </div>

            {/* Action */}
            <button
              onClick={handleSubmit}
              disabled={selectedStar === 0 || isSubmitting}
              className={cn(
                "w-full py-4 rounded-2xl font-plus-jakarta text-sm font-bold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-3",
                selectedStar > 0 
                  ? "bg-brand-primary text-white shadow-brand-primary/20" 
                  : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>SUBMITTING...</span>
                </>
              ) : (
                <>
                  <Star className={cn("h-4 w-4", selectedStar > 0 && "fill-current")} />
                  <span>RECOGNIZE ACHIEVEMENT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
