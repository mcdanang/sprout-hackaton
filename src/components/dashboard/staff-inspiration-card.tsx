"use client";

import React from "react";
import { Sparkles, Share2 } from "lucide-react";
import { toast } from "sonner";
import { DAILY_QUOTES } from "@/lib/constants/quotes";

export function StaffInspirationCard({ 
	title, 
	shareLabel,
	locale = "en"
}: { 
	title: string; 
	shareLabel: string;
	locale?: string;
}) {
	// Seed by date to keep it "daily"
	const quoteObj = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length];
	const quote = locale === "id" ? quoteObj.id : quoteObj.en;

	const handleShare = () => {
		navigator.clipboard.writeText(quote);
		toast.success(locale === "id" ? "Kutipan disalin ke papan klip! 🚀" : "Quote copied to clipboard! 🚀");
	};

	return (
		<div className="relative flex flex-col rounded-3xl border border-violet-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
			<div className="flex items-center gap-2">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-500">
					<Sparkles className="h-4 w-4" />
				</div>
				<h3 className="font-plus-jakarta text-sm font-extrabold uppercase tracking-[0.15em] text-slate-400">
					{title}
				</h3>
			</div>

			<div className="mt-6 flex-1">
				<p className="font-plus-jakarta text-xl font-bold italic leading-snug tracking-tight text-slate-800">
					&ldquo;{quote}&rdquo;
				</p>
			</div>

			<div className="mt-8">
				<button 
					onClick={handleShare}
					className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
				>
					<Share2 className="h-3.5 w-3.5" />
					{shareLabel}
				</button>
			</div>
		</div>
	);
}
