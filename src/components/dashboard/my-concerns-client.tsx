"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChatLines } from "iconoir-react";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, User } from "lucide-react";

import { type MyConcernItem } from "@/app/actions/concerns.types";
import { cn } from "@/lib/utils";
import { FormattedContent } from "@/components/shared/formatted-content";

type Props = {
	initialConcerns: MyConcernItem[];
};

function formatDate(iso: string, locale: string) {
	return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(iso));
}

function formatReplyRole(roleName: string | null) {
	if (!roleName) return "";
	if (roleName === "TOP MANAGEMENT") return "Management";
	return roleName;
}

function StatusBadge({ status }: { status: MyConcernItem["status"] }) {
	const t = useTranslations("Dashboard.concerns");
	if (status === "closed") {
		return (
			<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 shadow-sm ring-1 ring-emerald-100">
				<CheckCircle2 className="size-3.5" />
				{t("statusClosed")}
			</span>
		);
	}
	if (status === "in_progress") {
		return (
			<span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 shadow-sm ring-1 ring-amber-100">
				<Clock className="size-3.5" />
				{t("statusInProgress")}
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-600 shadow-sm ring-1 ring-rose-100">
			<AlertCircle className="size-3.5" />
			{t("statusOpen")}
		</span>
	);
}

function ConcernCard({ item }: { item: MyConcernItem }) {
	const t = useTranslations("Dashboard.concerns");
	const locale = useLocale();
	const [open, setOpen] = useState(false);

	return (
		<article className="group relative bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
			{/* Background Glow Effect on Hover */}
			<div className="absolute -inset-1 bg-linear-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />

			{/* Rotating Border on Hover */}
			<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
				<div className="absolute -inset-full [background:conic-gradient(from_0deg,transparent_0_80%,#FFD300_100%)] animate-[border-rotate_4s_linear_infinite]" />
				<div className="absolute inset-px bg-white rounded-[31px]" />
			</div>

			<div className="relative z-10">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-100 group-hover:bg-brand-primary/5 group-hover:text-brand-primary transition-colors">
							{item.issueCategory}
						</span>
						<span className="text-[12px] font-bold font-plus-jakarta text-slate-400 group-hover:text-slate-500 transition-colors">
							{item.targetLabel}
						</span>
					</div>
					<StatusBadge status={item.status} />
				</div>

				<FormattedContent
					content={item.details}
					className="mt-6 font-plus-jakarta text-[16px] leading-relaxed text-slate-700 group-hover:text-slate-900 transition-colors"
				/>

				<div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-6 group-hover:border-slate-100 transition-colors">
					<div className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-500 transition-colors font-medium">
						<Clock className="size-4 shrink-0 transition-transform group-hover:scale-110" />
						<time dateTime={item.createdAt}>{formatDate(item.createdAt, locale)}</time>
					</div>

					{item.isAnonymous ? (
						<div className="flex items-center gap-1.5 rounded-full bg-amber-50/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 ring-1 ring-amber-100/50 transition-colors group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:ring-amber-200">
							<User className="size-3.5 fill-amber-600/10" />
							{t("submittedAnonymous")}
						</div>
					) : null}
				</div>

				{item.replies.length > 0 ? (
					<div className="mt-6 rounded-2xl bg-slate-50/50 p-1 group-hover:bg-slate-50 transition-colors">
						<button
							type="button"
							onClick={() => setOpen(o => !o)}
							className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 transition-all hover:bg-white hover:shadow-sm"
						>
							<div className="flex items-center gap-2">
								<ChatLines className="size-4 shrink-0 text-brand-primary" />
								<span>{t("repliesCount", { count: item.replies.length })}</span>
							</div>
							<ArrowRight className={cn("size-4 transition-transform duration-300", open && "rotate-90")} />
						</button>
						{open ? (
							<ul className="mt-1 space-y-2 p-1">
								{item.replies.map(r => (
									<li
										key={r.id}
										className="rounded-xl border border-slate-100 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm"
									>
										<div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
											<span className="font-bold text-brand-primary">
												{r.authorName}
												{r.roleName ? (
													<span className="ml-1.5 font-plus-jakarta text-[11px] font-bold uppercase tracking-wider text-slate-400">
														{formatReplyRole(r.roleName)}
													</span>
												) : null}
											</span>
											<div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
												<Clock className="size-3" />
												<time dateTime={r.createdAt}>{formatDate(r.createdAt, locale)}</time>
											</div>
										</div>
										<FormattedContent content={r.content} className="text-slate-600" />
									</li>
								))}
							</ul>
						) : null}
					</div>
				) : null}
			</div>
		</article>
	);
}


export function MyConcernsClient({ initialConcerns }: Props) {
	const t = useTranslations("Dashboard.concerns");

	return (
		<div className="max-w-5xl mx-auto space-y-12 pb-20">
			<div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-4">
					<p className="font-plus-jakarta text-[12px] font-semibold leading-[16px] tracking-[1.2px] uppercase text-[#B09100]">
						{t("eyebrow")}
					</p>
					<h1 className="font-plus-jakarta text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-brand-primary">
						{t("title")}
					</h1>
					<p className="font-plus-jakarta text-[18px] font-normal leading-[28px] text-dashboard-description max-w-2xl">
						{t("subtitle")}
					</p>
				</div>
			</div>

			{initialConcerns.length === 0 ? (
				<div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
					<ChatLines className="mb-4 h-12 w-12 text-slate-300" />
					<h3 className="text-lg font-semibold text-slate-700">{t("emptyTitle")}</h3>
					<p className="mt-2 max-w-sm text-sm text-slate-500">{t("emptyHint")}</p>
				</div>
			) : (
				<ul className="space-y-4">
					{initialConcerns.map(item => (
						<li key={item.id}>
							<ConcernCard item={item} />
						</li>
					))}
				</ul>
			)}

		</div>
	);
}
