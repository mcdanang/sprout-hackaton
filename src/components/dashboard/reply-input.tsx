import { Send, Loader2 } from "lucide-react";

interface Props {
  targetName: string;
  isSending: boolean;
  onSend: () => void;
}

export function ReplyInput({ targetName, isSending, onSend }: Props) {
  return (
    <div className="pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="relative">
        <textarea
          placeholder={`Reply to ${targetName}...`}
          className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 font-plus-jakarta text-sm text-brand-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:bg-white transition-all min-h-[100px] resize-none"
          autoFocus
        />
        <div className="absolute bottom-3 right-3">
          <button
            onClick={onSend}
            disabled={isSending}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-brand-primary text-white hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:scale-100"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
