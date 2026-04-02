import Image from "next/image";
import type { ReplyItem as ReplyItemType } from "@/lib/constants/activity";
import { getRelativeTime } from "@/lib/utils/time";

interface Props {
  reply: ReplyItemType;
}

export function ReplyItem({ reply }: Props) {
  return (
    <div className="relative flex items-start gap-3 pl-10 animate-in fade-in slide-in-from-left-3 duration-500">
      {/* Avatar + horizontal branch connector */}
      <div className="shrink-0 relative z-10">
        <div className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm aspect-square">
          <Image src={reply.userAvatar} alt={reply.userName} fill className="object-cover" />
        </div>
        <div className="absolute -left-6 top-4 w-6 h-px bg-slate-100" />
      </div>

      {/* Speech bubble */}
      <div className="flex-1 relative min-w-0">
        {/* Tail — outer border triangle */}
        <div className="absolute -left-[7px] top-[10px] w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[7px] border-r-slate-100" />
        {/* Tail — inner fill triangle */}
        <div className="absolute -left-[5.5px] top-[11px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white" />

        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="font-plus-jakarta text-[13px] font-bold text-brand-primary truncate">
              {reply.userName}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              {getRelativeTime(reply.timestamp)}
            </span>
          </div>
          <p className="font-plus-jakarta text-[14px] text-slate-600 leading-snug">
            {reply.content}
          </p>
        </div>
      </div>
    </div>
  );
}
