"use client";

import { useEffect, useState, useRef, useActionState } from "react";
import { toast } from "sonner";
import { Send, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSignal } from "@/app/actions/signals";
import { initialSignalActionState } from "@/app/actions/signal.types";
import { getEmployees } from "@/app/actions/employees";
import { type EmployeeRecord } from "@/app/actions/employees.types";
import { SIGNAL_TYPES, type SignalType } from "@/lib/constants/signal-types";
import { MENTION_CHIP_CLASSES } from "@/lib/utils/mentions";
import { SignalTypeCard } from "./signal-type-card";
import { MentionDropdown } from "./mention-dropdown";
import { extractContent } from "./utils/content-parser";

interface Props {
  projectId: string;
  onClose: () => void;
}

export function SignalModalForm({ projectId, onClose }: Props) {
  const [selectedType, setSelectedType] = useState<SignalType | null>(null);
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [projectEmployees, setProjectEmployees] = useState<EmployeeRecord[]>([]);
  const [taggedEmployees, setTaggedEmployees] = useState<EmployeeRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const [state, dispatch, isPending] = useActionState(createSignal, initialSignalActionState);
  const activeType = SIGNAL_TYPES.find((t) => t.id === selectedType);

  useEffect(() => {
    getEmployees({ projectId, onlyActive: true }).then((res) => {
      if (res.status === "success") setProjectEmployees(res.employees);
    });
  }, [projectId]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Signal posted successfully!");
      onClose();
    } else if (state.status === "error") {
      toast.error(state.message || "Failed to post signal. Please try again.");
    }
  }, [state.status, onClose, state.message]);

  const handleTypeSelect = (type: SignalType) => {
    setSelectedType(type);
    setContent("");
    setTaggedEmployees([]);
    setMentionQuery(null);
    if (type !== "concern") setIsPublic(true);

    setTimeout(() => {
      if (!editorRef.current) return;
      editorRef.current.innerHTML = "";
      editorRef.current.focus();
    }, 0);
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    const editor = e.currentTarget;
    const text = extractContent(editor);
    setContent(text);

    const sel = window.getSelection();
    if (!sel?.rangeCount) { setMentionQuery(null); return; }

    const range = sel.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(range.endContainer, range.endOffset);
    const textBeforeCursor = preRange.toString();

    const atIdx = textBeforeCursor.lastIndexOf("@");
    if (atIdx !== -1) {
      const query = textBeforeCursor.slice(atIdx + 1);
      if (!query.includes(" ") && !query.includes("\n")) {
        setMentionQuery(query);
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleMentionSelect = (emp: EmployeeRecord) => {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel?.rangeCount) return;

    const range = sel.getRangeAt(0);
    const queryLen = (mentionQuery?.length ?? 0) + 1;
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const newStart = Math.max(0, range.startOffset - queryLen);
      range.setStart(range.startContainer, newStart);
    }
    range.deleteContents();

    const chip = document.createElement("span");
    chip.dataset.mention = "true";
    chip.dataset.id = emp.id;
    chip.dataset.name = emp.fullName;
    chip.contentEditable = "false";
    chip.className = MENTION_CHIP_CLASSES;
    chip.textContent = `${emp.fullName}`;
    range.insertNode(chip);

    const space = document.createTextNode("\u00A0");
    const after = document.createRange();
    after.setStartAfter(chip);
    after.collapse(true);
    after.insertNode(space);
    after.setStartAfter(space);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);

    setContent(extractContent(editor));
    setTaggedEmployees((prev) =>
      prev.find((e) => e.id === emp.id) ? prev : [...prev, emp]
    );
    setMentionQuery(null);
  };

  // On submit: call AI first, then dispatch to server action with AI results
  async function handlePost() {
    if (!content.trim() || !selectedType) return;

    const formData = new FormData();
    formData.set("category", selectedType);
    formData.set("projectId", projectId);
    formData.set("isPublic", isPublic ? "on" : "");
    formData.set("details", content);
    formData.set("title", content.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1").slice(0, 100) || "Signal Update");
    taggedEmployees.forEach((e) => formData.append("targetEmployeeIds[]", e.id));

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, category: selectedType }),
      });
      const data = await res.json();
      if (data.issueCategory) formData.set("aiIssueCategory", data.issueCategory);
      if (data.sentiment != null) formData.set("aiSentiment", String(data.sentiment));
    } catch {
      // AI failed — server action will fall back to mock analysis
    } finally {
      setIsAnalyzing(false);
    }

    dispatch(formData);
  }

  const displayLength = content.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1").length;
  const mentionResults = mentionQuery !== null
    ? projectEmployees
        .filter((e) => e.fullName.toLowerCase().includes(mentionQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  const isLoading = isAnalyzing || isPending;

  return (
    <div className="bg-white rounded-[32px] shadow-2xl">
      <div className="px-8 pt-8 pb-6 grid grid-cols-3 gap-3">
        {SIGNAL_TYPES.map((type) => (
          <SignalTypeCard
            key={type.id}
            type={type}
            isActive={selectedType === type.id}
            onClick={handleTypeSelect}
          />
        ))}
      </div>

      {selectedType === "concern" && (
        <div className="px-8 pb-6 flex items-center justify-between border-b border-slate-50 mb-6">
          <div className="space-y-0.5">
            <p className="font-plus-jakarta text-sm font-bold text-brand-primary">Visibility</p>
            <p className="text-[11px] text-slate-600">
              {isPublic ? "Everyone in the project can see this" : "@Mentioned people only"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={cn("relative h-6 w-11 rounded-full transition-colors", isPublic ? "bg-brand-primary" : "bg-slate-200")}
          >
            <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", isPublic ? "translate-x-5" : "translate-x-0")} />
          </button>
        </div>
      )}

      <div className={cn("px-8 transition-all duration-300", selectedType ? "pb-8 max-h-[400px] opacity-100" : "max-h-0 opacity-0 pb-0 overflow-hidden")}>
        <div className={cn("relative rounded-[24px] border bg-slate-50/50", activeType?.activeBorder)}>
          <MentionDropdown
            results={mentionResults}
            onSelect={handleMentionSelect}
          />

          {!content && (
            <div className="absolute top-0 left-0 p-6 font-plus-jakarta text-sm text-slate-400 pointer-events-none select-none">
              {activeType?.placeholder}
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            className="w-full bg-transparent p-6 pb-20 font-plus-jakarta text-sm leading-relaxed text-brand-primary focus:outline-none min-h-[140px]"
          />

          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isPublic && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                  <Lock className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Private</span>
                </div>
              )}
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", displayLength > 450 ? "text-red-400" : "text-slate-400")}>
                {displayLength}/500
              </span>
            </div>

            <button
              type="button"
              onClick={handlePost}
              disabled={!content.trim() || isLoading || !selectedType}
              className={cn("flex items-center gap-2.5 px-6 py-2.5 rounded-full font-plus-jakarta text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-40", activeType ? cn(activeType.sendBg, "text-white") : "bg-brand-primary text-white")}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending...</span>
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
    </div>
  );
}
