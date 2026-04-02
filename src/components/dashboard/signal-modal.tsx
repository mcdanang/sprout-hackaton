"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { AlertCircle, Trophy, Heart, Send, Loader2, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActionState } from "react";
import { createSignal } from "@/app/actions/signals";
import { initialSignalActionState } from "@/app/actions/signal.types";
import { getEmployees } from "@/app/actions/employees";
import { type EmployeeRecord } from "@/app/actions/employees.types";

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

export function SignalModal({ isOpen, projectName, projectId, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <SignalModalContent
      projectName={projectName}
      projectId={projectId}
      onClose={onClose}
    />
  );
}

// Extracts the encoded content string (with @[Name](id) syntax) from the editor DOM
function extractContent(editor: HTMLDivElement): string {
  let result = "";
  for (const node of Array.from(editor.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? "";
    } else if (node instanceof HTMLElement) {
      if (node.dataset.mention === "true") {
        result += `@[${node.dataset.name}](${node.dataset.id})`;
      } else if (node.tagName === "BR") {
        result += "\n";
      } else {
        // Inline wrapper or unknown element — just grab text
        result += node.textContent ?? "";
      }
    }
  }
  return result;
}

function SignalModalContent({ projectName, projectId, onClose }: Omit<Props, "isOpen">) {
  const [selectedType, setSelectedType] = useState<SignalType | null>(null);
  // content stores the encoded form (@[Name](id)) for the hidden input
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [projectEmployees, setProjectEmployees] = useState<EmployeeRecord[]>([]);
  const [taggedEmployees, setTaggedEmployees] = useState<EmployeeRecord[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  const [state, formAction, isPending] = useActionState(createSignal, initialSignalActionState);

  const activeType = SIGNAL_TYPES.find((t) => t.id === selectedType);

  const handleClose = useCallback(() => {
    if (isPending) return;
    onClose();
  }, [isPending, onClose]);

  // Fetch project employees for @mentions
  useEffect(() => {
    getEmployees({ projectId, onlyActive: true }).then((res) => {
      if (res.status === "success") setProjectEmployees(res.employees);
    });
  }, []);

  // Handle action result
  useEffect(() => {
    if (state.status === "success") {
      toast.success("Signal posted successfully!");
      onClose();
    } else if (state.status === "error") {
      toast.error(state.message || "Failed to post signal. Please try again.");
    }
  }, [state.status, state.message, onClose]);

  // Close on Escape (but let the mention dropdown intercept first)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  function handleTypeSelect(type: SignalType) {
    setSelectedType(type);
    setContent("");
    setTaggedEmployees([]);
    setMentionQuery(null);
    if (type !== "concern") setIsPublic(true);

    // Clear editor DOM and focus — use setTimeout so the editor is visible first
    setTimeout(() => {
      if (!editorRef.current) return;
      editorRef.current.innerHTML = "";
      editorRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }, 0);
  }

  function handleEditorInput(e: React.FormEvent<HTMLDivElement>) {
    const editor = e.currentTarget;
    const text = extractContent(editor);
    setContent(text);

    // Detect @mention query from cursor position
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
  }

  function handleMentionSelect(emp: EmployeeRecord) {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel?.rangeCount) return;

    const range = sel.getRangeAt(0);
    // Extend range back to cover "@query"
    const queryLen = (mentionQuery?.length ?? 0) + 1; // +1 for the '@'
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const newStart = Math.max(0, range.startOffset - queryLen);
      range.setStart(range.startContainer, newStart);
    }
    range.deleteContents();

    // Insert the mention chip (non-editable)
    const chip = document.createElement("span");
    chip.dataset.mention = "true";
    chip.dataset.id = emp.id;
    chip.dataset.name = emp.fullName;
    chip.contentEditable = "false";
    chip.className =
      "inline-flex items-center bg-brand-primary/10 text-brand-primary text-sm font-bold rounded-full px-2 py-0.5 mx-0.5 select-none";
    chip.textContent = `@${emp.fullName}`;
    range.insertNode(chip);

    // Place cursor right after the chip with a non-breaking space
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
  }

  // Display-only character count (strip the (id) part from mentions)
  const displayLength = content.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1").length;

  const mentionResults =
    mentionQuery !== null
      ? projectEmployees
          .filter((e) => e.fullName.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 5)
      : [];

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
        <div className="bg-white rounded-[32px] shadow-2xl">
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
                  onClick={() => handleTypeSelect(type.id)}
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
            })}
          </div>

          {/* Visibility Toggle — Concern only */}
          {selectedType === "concern" && (
            <div className="px-8 pb-6 flex items-center justify-between border-b border-slate-50 mb-6">
              <div className="space-y-0.5">
                <p className="font-plus-jakarta text-sm font-bold text-brand-primary">
                  Visibility
                </p>
                <p className="text-[11px] text-slate-400">
                  {isPublic
                    ? "Everyone in the project can see this"
                    : "@Mentioned people only — others cannot see this"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none",
                  isPublic ? "bg-brand-primary" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                    isPublic ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          )}

          {/* Editor — visible only after type selected */}
          <div
            className={cn(
              "px-8 transition-all duration-300",
              selectedType
                ? "pb-8 max-h-[400px] opacity-100"
                : "max-h-0 opacity-0 pb-0 overflow-hidden"
            )}
          >
            <div
              className={cn(
                "relative rounded-[24px] border transition-all duration-200 bg-slate-50/50",
                activeType?.activeBorder
              )}
            >
              {/* @Mention dropdown */}
              {mentionResults.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 mx-1 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-200">
                  {mentionResults.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleMentionSelect(emp);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="relative h-7 w-7 shrink-0">
                        <Image
                          src={`https://i.pravatar.cc/150?u=${encodeURIComponent(emp.email)}`}
                          fill
                          className="rounded-full object-cover shadow-sm"
                          alt={emp.fullName}
                        />
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
              )}

              <form action={formAction}>
                <input type="hidden" name="category" value={selectedType ?? ""} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="isPublic" value={isPublic ? "on" : ""} />
                <input type="hidden" name="details" value={content} />
                <input
                  type="hidden"
                  name="title"
                  value={
                    content
                      .replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1")
                      .slice(0, 100) || "Signal Update"
                  }
                />
                {taggedEmployees.map((e) => (
                  <input
                    key={e.id}
                    type="hidden"
                    name="targetEmployeeIds[]"
                    value={e.id}
                  />
                ))}

                {/* Placeholder (shown when editor is empty) */}
                {!content && (
                  <div className="absolute top-0 left-0 p-6 font-plus-jakarta text-sm leading-relaxed text-slate-400 pointer-events-none select-none">
                    {activeType?.placeholder}
                  </div>
                )}

                {/* ContentEditable editor — mentions are real styled chips */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && mentionQuery !== null) {
                      e.stopPropagation();
                      setMentionQuery(null);
                    }
                  }}
                  className="w-full bg-transparent p-6 pb-20 font-plus-jakarta text-sm leading-relaxed text-brand-primary focus:outline-none min-h-[140px] break-words"
                />

                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!isPublic && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                        <Lock className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Private
                        </span>
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        displayLength > 450 ? "text-red-400" : "text-slate-400"
                      )}
                    >
                      {displayLength}/500
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!content.trim() || isPending || !selectedType}
                    className={cn(
                      "flex items-center gap-2.5 px-6 py-2.5 rounded-full font-plus-jakarta text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:shadow-none hover:shadow-lg",
                      activeType
                        ? cn(activeType.sendBg, "text-white")
                        : "bg-brand-primary text-white"
                    )}
                  >
                    {isPending ? (
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
              </form>
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
