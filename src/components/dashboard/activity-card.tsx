"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, Clock, Lock, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ActivityItem } from "@/lib/constants/activity";
import { activityTypeStyles } from "@/lib/constants/project-ui";
import { getRelativeTime } from "@/lib/utils/time";
import { FormattedContent } from "@/components/shared/formatted-content";
import { ReplyItem } from "./reply-item";
import { ReplyInput } from "./reply-input";
import { createSignalReply, toggleSignalLike } from "@/app/actions/signal-interactions";

interface Props {
  activity: ActivityItem;
  index: number;
  onReplyCreated?: (params: {
    activityId: string;
    reply: NonNullable<ActivityItem["replies"]>[number];
  }) => void;
}

export function ActivityCard({ activity, index, onReplyCreated }: Props) {
  const [isReplying, setIsReplying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const [likesCount, setLikesCount] = useState(activity.likesCount);
  const [isLiked, setIsLiked] = useState(activity.isLiked);
  const [replies, setReplies] = useState(activity.replies ?? []);

  useEffect(() => {
    setLikesCount(activity.likesCount);
    setIsLiked(activity.isLiked);
    setReplies(activity.replies ?? []);
  }, [activity.id, activity.likesCount, activity.isLiked, activity.replies]);

  const Style = activityTypeStyles[activity.type as Exclude<ActivityItem["type"], "status">];
  const Icon = Style.icon;

  const handleSend = async (content: string) => {
    setIsSending(true);
    try {
      const reply = await createSignalReply({ signalId: activity.id, content });
      const newReply = {
        id: reply.replyId,
        userId: reply.userId,
        userName: reply.userName,
        userAvatar: reply.userAvatar,
        content: reply.content,
        timestamp: reply.timestamp,
      };
      setReplies(prev => [...prev, newReply]);
      onReplyCreated?.({ activityId: activity.id, reply: newReply });
      setIsReplying(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-brand-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
        !activity.isPublic && "border-l-4 border-l-slate-200"
      )}
      style={{ animationDelay: `${(index % 5) * 100}ms` }}
    >
      <div className="flex gap-5">
        {/* Signal type icon */}
        <div className="shrink-0">
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", Style.bgColor, Style.color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          {/* Header: avatar + name + timestamp */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6 rounded-full overflow-hidden border border-slate-100/50 shrink-0 aspect-square bg-slate-100 flex items-center justify-center">
                {activity.userAvatar ? (
                  <Image src={activity.userAvatar} alt={activity.userName} fill className="object-cover rounded-full" />
                ) : (
                  <User className="h-3.5 w-3.5 text-slate-400" />
                )}
              </div>
              <span className="font-plus-jakarta text-sm font-bold text-brand-primary">{activity.userName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 shrink-0">
              {!activity.isPublic && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <Lock className="h-2.5 w-2.5" />
                  Private
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {getRelativeTime(activity.timestamp)}
                </span>
              </div>
            </div>
          </div>

          <FormattedContent 
            content={activity.content}
            className="font-plus-jakarta text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap"
          />

          {/* Like & Reply actions */}
          <div className="flex items-center gap-3 pt-1">
            <button className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all group/like",
              isLiked
                ? "bg-pink-50/50 border-pink-100"
                : "bg-white border-slate-100 hover:border-pink-200 hover:bg-pink-50/30"
            )}
              onClick={async () => {
                if (isLikeLoading) return;
                setIsLikeLoading(true);
                try {
                  const res = await toggleSignalLike(activity.id);
                  setLikesCount(res.likesCount);
                  setIsLiked(res.isLiked);
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsLikeLoading(false);
                }
              }}
              disabled={isLikeLoading}
            >
              {isLikeLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-pink-500" />
              ) : (
                <Heart className={cn(
                  "h-3.5 w-3.5 transition-all",
                  isLiked
                    ? "text-pink-500 fill-pink-500"
                    : "text-slate-500 group-hover/like:text-pink-500 group-hover/like:fill-pink-500"
                )} />
              )}
              <span className={cn(
                "font-plus-jakarta text-xs font-bold transition-colors",
                isLiked
                  ? "text-pink-600"
                  : "text-slate-600 group-hover/like:text-pink-600"
              )}>
                {likesCount}
              </span>
            </button>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all group/reply",
                isReplying
                  ? "bg-brand-primary/5 border-brand-primary/20 text-brand-primary"
                  : "bg-white border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-700 hover:shadow-sm"
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="font-plus-jakarta text-xs font-bold">Reply</span>
            </button>
          </div>

          {/* Threaded replies */}
          {replies.length > 0 && (
            <div className="mt-8 space-y-5 relative">
              <div className="absolute left-[23px] top-0 bottom-6 w-px bg-slate-100" />
              {replies.map((reply) => (
                <ReplyItem key={reply.id} reply={reply} />
              ))}
            </div>
          )}

          {/* Inline reply input */}
          {isReplying && (
            <ReplyInput
              targetName={activity.userName.split(" ")[0]}
              isSending={isSending}
              onSend={handleSend}
            />
          )}
        </div>
      </div>
    </div>
  );
}
