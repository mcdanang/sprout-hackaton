"use client";

import { User } from "lucide-react";
import { type EmployeeRecord } from "@/app/actions/employees.types";

interface Props {
  results: EmployeeRecord[];
  onSelect: (emp: EmployeeRecord) => void;
}

export function MentionDropdown({ results, onSelect }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-1 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-200">
      {results.map((emp) => (
        <button
          key={emp.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(emp);
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="relative h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-100/50 text-slate-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-plus-jakarta text-[13px] font-bold text-brand-primary">
              {emp.fullName}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {emp.jobPosition}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
