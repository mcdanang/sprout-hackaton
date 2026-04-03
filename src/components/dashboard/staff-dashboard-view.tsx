import { getTranslations } from "next-intl/server";
import { WarningTriangle } from "iconoir-react";
import { AlertCircle, Trophy, Heart } from "lucide-react";

import type { MyConcernItem } from "@/app/actions/concerns.types";
import type { AiInsightsResult } from "@/app/actions/ai-insights";
import type { StaffDashboardSnapshot } from "@/lib/staff-dashboard-types";
import { AiInsightCards } from "@/components/dashboard/ai-insight-cards";
import { StaffConcernsStrip } from "@/components/dashboard/staff-concerns-strip";
import { FormattedContent } from "@/components/shared/formatted-content";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function SentimentBar({ value }: { value: number | null }) {
	if (value == null) {
		return <span className="text-xs text-slate-400">—</span>;
	}
	const w = Math.max(8, Math.min(100, value));
	return (
		<div className="h-2 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-100">
			<div
				className={cn(
					"h-full rounded-full transition-all",
					value >= 66 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-rose-500",
				)}
				style={{ width: `${w}%` }}
			/>
		</div>
	);
}

function formatRelative(iso: string): string {
	const d = new Date(iso);
	const diff = Date.now() - d.getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days}d ago`;
	return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function activityVerb(category: string, t: (k: string) => string): string {
	if (category === "concern") return t("activityPostedConcern");
	if (category === "achievement") return t("activityPostedAchievement");
	if (category === "appreciation") return t("activityPostedAppreciation");
	return t("activityPostedSignal");
}

function ActivityIcon({ category }: { category: string }) {
	if (category === "concern") {
		return (
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
				<AlertCircle className="h-5 w-5" />
			</div>
		);
	}
	if (category === "achievement") {
		return (
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
				<Trophy className="h-5 w-5" />
			</div>
		);
	}
	if (category === "appreciation") {
		return (
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
				<Heart className="h-5 w-5 fill-pink-500/10" />
			</div>
		);
	}
	return (
		<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
			<AlertCircle className="h-5 w-5" />
		</div>
	);
}

export async function StaffDashboardView({
	firstName,
	snapshot,
	concerns,
	insights,
}: {
	firstName: string;
	snapshot: StaffDashboardSnapshot;
	concerns: MyConcernItem[];
	insights: AiInsightsResult;
}) {
	const t = await getTranslations("Dashboard.staff");
	const tw = await getTranslations("Dashboard");

	const recTotal =
		snapshot.categoryBreakdown30d.achievement + snapshot.categoryBreakdown30d.appreciation;

	return (
		<div className="mx-auto max-w-6xl space-y-10">
			<div className="space-y-2">
				<p className="font-plus-jakarta text-[12px] font-semibold uppercase leading-[16px] tracking-[1.2px] text-[#B09100]">
					{t("eyebrow")}
				</p>
				<h1 className="font-plus-jakarta text-4xl font-bold tracking-tight text-[#191C1D] md:text-5xl">
					{tw("welcome", { name: firstName })}
				</h1>
				<p className="font-plus-jakarta text-lg text-[#3F484A]">{t("subtitle")}</p>
				<p className="text-xs text-slate-400">{t("rangeNote")}</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-12">
				<div className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
					<div className="rounded-3xl border border-orange-100 bg-linear-to-br from-orange-50 to-white p-5 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-wide text-orange-800/80">
							{t("metricConcerns")}
						</p>
						<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">
							{snapshot.concernsCount30d}
						</p>
					</div>
					<div className="rounded-3xl border border-violet-100 bg-linear-to-br from-violet-50 to-white p-5 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-wide text-violet-800/80">
							{t("metricRecognition")}
						</p>
						<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">{recTotal}</p>
						<p className="mt-1 text-xs text-slate-500">{t("recognitionHint")}</p>
					</div>
					<div className="rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 to-white p-5 shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-wide text-sky-800/80">
							{t("metricProjects")}
						</p>
						<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">
							{snapshot.projectSentiments.length}
						</p>
					</div>
				</div>

				<div className="flex flex-col justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4">
					<p className="font-plus-jakarta text-sm font-semibold text-brand-primary">{t("raiseTitle")}</p>
					<p className="text-xs text-slate-500">{t("ctaHint")}</p>
					<Link
						href="/dashboard/concerns"
						className={cn(
							"inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#191C1D] px-4 font-plus-jakarta text-sm font-bold text-white shadow-sm transition-colors outline-none",
							"hover:bg-[#191C1D]/90 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
							"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
						)}
					>
						<WarningTriangle className="h-5 w-5 text-[#FFD300]" />
						{t("raiseCta")}
					</Link>
				</div>
			</div>

			{insights.insights.length > 0 ? (
				<div>
					<AiInsightCards insights={insights.insights} generatedAt={insights.generatedAt} />
				</div>
			) : null}

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("categoryTitle")}</h2>
					<ul className="mt-4 space-y-3">
						<li className="flex items-center justify-between gap-4">
							<span className="text-sm text-slate-600">{t("catConcern")}</span>
							<span className="font-plus-jakarta text-lg font-bold tabular-nums">
								{snapshot.categoryBreakdown30d.concern}
							</span>
						</li>
						<li className="flex items-center justify-between gap-4">
							<span className="text-sm text-slate-600">{t("catAchievement")}</span>
							<span className="font-plus-jakarta text-lg font-bold tabular-nums">
								{snapshot.categoryBreakdown30d.achievement}
							</span>
						</li>
						<li className="flex items-center justify-between gap-4">
							<span className="text-sm text-slate-600">{t("catAppreciation")}</span>
							<span className="font-plus-jakarta text-lg font-bold tabular-nums">
								{snapshot.categoryBreakdown30d.appreciation}
							</span>
						</li>
					</ul>
				</div>

				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("sentimentTitle")}</h2>
					{snapshot.projectSentiments.length === 0 ? (
						<p className="mt-4 text-sm text-slate-500">{t("sentimentEmpty")}</p>
					) : (
						<ul className="mt-4 space-y-4">
							{snapshot.projectSentiments.map(p => (
								<li key={p.projectId} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div className="min-w-0">
										<p className="truncate font-medium text-slate-900">{p.projectName}</p>
										<p className="text-xs text-slate-500">
											{t("signalsCount", { count: p.signalCount })}
										</p>
									</div>
									<div className="flex items-center gap-3">
										<SentimentBar value={p.avgSentiment} />
										{p.avgSentiment != null ? (
											<span className="w-10 text-right text-sm font-semibold tabular-nums text-slate-700">
												{p.avgSentiment}
											</span>
										) : null}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<StaffConcernsStrip concerns={concerns} />

			<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
				<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("teamTitle")}</h2>
				{snapshot.teamActivity.length === 0 ? (
					<p className="mt-4 text-sm text-slate-500">{t("teamEmpty")}</p>
				) : (
					<ul className="mt-4 space-y-4">
						{snapshot.teamActivity.map(item => {
							const isRedundant =
								item.preview &&
								(item.title.toLowerCase().includes(item.preview.toLowerCase()) ||
									item.preview.toLowerCase().includes(item.title.toLowerCase()));

							return (
								<li
									key={item.id}
									className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
								>
									<ActivityIcon category={item.category} />
									<div className="min-w-0 flex-1 space-y-1">
										<p className="font-plus-jakarta text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
											{item.authorName} {activityVerb(item.category, t)}
										</p>
										<FormattedContent
											content={item.title}
											className="line-clamp-2 font-plus-jakarta text-base font-bold tracking-tight text-brand-primary"
										/>
										{item.preview && !isRedundant ? (
											<FormattedContent
												content={item.preview}
												className="line-clamp-2 font-plus-jakarta text-sm font-medium leading-relaxed text-slate-500"
											/>
										) : null}
										<div className="flex flex-wrap gap-x-3 gap-y-1 font-plus-jakarta text-[11px] font-bold text-slate-400">
											{item.projectName ? <span>{item.projectName}</span> : null}
											<span>{formatRelative(item.createdAt)}</span>
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
