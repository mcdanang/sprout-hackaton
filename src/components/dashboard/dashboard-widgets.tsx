import { NavArrowDown, NavArrowUp } from "iconoir-react";
import { cn } from "@/lib/utils";

export function SentimentPie({ slices, className }: { slices: { pct: number; color: string }[], className?: string }) {
	if (!slices.length) {
		return (
			<div className={cn("flex h-52 w-52 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400", className)} />
		);
	}
	let acc = 0;
	const parts: string[] = [];
	for (const s of slices) {
		const start = acc;
		acc += s.pct;
		parts.push(`${s.color} ${start}% ${acc}%`);
	}
	if (acc < 100) {
		parts.push(`#f1f5f9 ${acc}% 100%`);
	}
	return (
		<div
			className={cn("h-52 w-52 shrink-0 rounded-full border border-slate-100 shadow-inner", className)}
			style={{ background: `conic-gradient(${parts.join(", ")})` }}
		/>
	);
}

export function Trend({ pct, labelUp, labelDown }: { pct: number | null; labelUp: string; labelDown: string }) {
	if (pct == null) {
		return <span className="text-xs text-slate-400">—</span>;
	}
	const up = pct >= 0;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-0.5 text-xs font-semibold",
				up ? "text-emerald-600" : "text-rose-600",
			)}
		>
			{up ? <NavArrowUp className="h-3.5 w-3.5" /> : <NavArrowDown className="h-3.5 w-3.5" />}
			{pct === 0 ? "0%" : `${up ? "" : "−"}${Math.abs(pct)}%`}
			<span className="sr-only">{up ? labelUp : labelDown}</span>
		</span>
	);
}

export function SentimentBar({ value }: { value: number | null }) {
	if (value == null) {
		return <span className="text-xs text-slate-400">—</span>;
	}
	const w = Math.max(8, Math.min(100, value));
	return (
		<div className="h-2 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-100/80">
			<div
				className={cn(
					"h-full rounded-full transition-all duration-500",
					value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-rose-500",
				)}
				style={{ width: `${w}%` }}
			/>
		</div>
	);
}

export function rankBadgeClass(rank: number) {
	if (rank === 1) return "bg-amber-100 text-amber-900 border-amber-200";
	if (rank === 2) return "bg-slate-200 text-slate-800 border-slate-300";
	if (rank === 3) return "bg-orange-100 text-orange-900 border-orange-200";
	return "bg-slate-50 text-slate-600 border-slate-200";
}
