"use client";

import { X } from "lucide-react";
import { SignalModalForm } from "./signal-modal-form";

interface Props {
  isOpen: boolean;
  projectName: string;
  projectId: string;
  onClose: () => void;
}

export function SignalModal({ isOpen, projectName, projectId, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-[32px] shadow-2xl">
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
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <SignalModalForm
            projectId={projectId}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
