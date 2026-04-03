import { getTranslations } from "next-intl/server";
import { WarningTriangle } from "iconoir-react";
import { AlertCircle, Trophy, Heart, Activity, Info } from "lucide-react";

import type { MyConcernItem } from "@/app/actions/concerns.types";
import type { AiInsightsResult } from "@/app/actions/ai-insights";
import type { StaffDashboardSnapshot } from "@/lib/staff-dashboard-types";
import { AiInsightCards } from "@/components/dashboard/ai-insight-cards";
import { StaffConcernsStrip } from "@/components/dashboard/staff-concerns-strip";
import { FormattedContent } from "@/components/shared/formatted-content";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { 
	SentimentPie, 
	SentimentBar 
} from "@/components/dashboard/dashboard-widgets";
import { StaffInspirationCard } from "./staff-inspiration-card";

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
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100 shadow-sm">
				<AlertCircle className="h-5 w-5" />
			</div>
		);
	}
	if (category === "achievement") {
		return (
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 shadow-sm">
				<Trophy className="h-5 w-5" />
			</div>
		);
	}
	if (category === "appreciation") {
		return (
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500 border border-pink-100 shadow-sm">
				<Heart className="h-5 w-5 fill-pink-500/10" />
			</div>
		);
	}
	return (
		<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 border border-slate-100 shadow-sm">
			<Activity className="h-5 w-5" />
		</div>
	);
}

export async function StaffDashboardView({
	firstName,
	snapshot,
	concerns,
	insights,
	locale,
}: {
	firstName: string;
	snapshot: StaffDashboardSnapshot;
	concerns: MyConcernItem[];
	insights: AiInsightsResult;
	locale?: string;
}) {
	const t = await getTranslations("Dashboard.staff");
	const tw = await getTranslations("Dashboard");

	const recTotal =
		snapshot.categoryBreakdown30d.achievement + snapshot.categoryBreakdown30d.appreciation;

	return (
		<div className="mx-auto max-w-6xl space-y-10 pb-20">
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

			<div className="grid gap-6 md:grid-cols-2">
				{/* Contribution Points Card */}
				<div className="group relative overflow-hidden rounded-3xl bg-[#E25C3D] p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
					<div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-transform duration-500 group-hover:scale-110" />
					<div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
					
					<div className="relative flex justify-between">
						<div className="space-y-1">
							<h3 className="font-plus-jakarta text-sm font-extrabold uppercase tracking-[0.15em] text-white/80">
								{t("pointsTitle")}
							</h3>
						</div>
						<div className="group/info relative">
							<Info className="h-5 w-5 text-white/50 hover:text-white transition-colors cursor-help" />
							<div className="invisible group-hover/info:visible absolute right-0 top-6 w-48 rounded-xl bg-black/80 p-3 text-[11px] font-medium leading-relaxed text-white backdrop-blur-sm z-10 shadow-2xl">
								{t("pointsTooltip")}
							</div>
						</div>
					</div>

					<div className="relative mt-6 flex items-baseline gap-3">
						<span className="font-plus-jakarta text-7xl font-black tracking-tighter text-white">
							{snapshot.totalContributionPoints}
						</span>
						<span className="font-plus-jakarta text-sm font-bold text-white/70 uppercase tracking-widest">{tw("management.ptsLabel")}</span>
					</div>

					<div className="relative mt-8 flex flex-wrap items-center gap-3">
						<div className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
							Rank #12
						</div>
						<div className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
							8 Badges
						</div>
						<p className="ml-auto text-xs font-medium text-white/90 italic">
							{t("pointsMotivation")}
						</p>
					</div>
				</div>

				{/* Daily Inspiration Card */}
				<StaffInspirationCard 
					title={t("inspirationTitle")} 
					shareLabel={t("shareTeam")} 
					locale={locale} 
				/>
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

				<div className="flex flex-col justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4 transition-all duration-300 hover:shadow-md hover:border-slate-300">
					<p className="font-plus-jakarta text-sm font-semibold text-brand-primary">{t("raiseTitle")}</p>
					<p className="text-xs text-slate-500">{t("ctaHint")}</p>
					<Link
						href="/dashboard/concerns"
						className={cn(
							"inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#191C1D] px-4 font-plus-jakarta text-sm font-bold text-white shadow-sm transition-all outline-none",
							"hover:bg-[#191C1D]/90 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
						)}
					>
						<WarningTriangle className="h-5 w-5 text-[#FFD300]" />
						{t("raiseCta")}
					</Link>
				</div>
			</div>

			{insights.insights.length > 0 ? (
				<AiInsightCards insights={insights.insights} generatedAt={insights.generatedAt} />
			) : null}

			{/* Role-Based Insight Widgets */}
			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">Team Spirit breakdown</h2>
					<p className="mt-1 text-sm text-slate-500">Distribution of concern categories across your projects.</p>
					<div className="mt-8 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
						<SentimentPie slices={snapshot.sentimentSlices} className="size-40" />
						<ul className="w-full space-y-2">
							{snapshot.sentimentSlices.map(s => (
								<li key={s.key} className="flex items-center gap-2 text-sm">
									<span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
									<span className="text-slate-700">
										{s.label} <span className="font-semibold tabular-nums text-slate-900 font-plus-jakarta">({s.pct}%)</span>
									</span>
								</li>
							))}
							{snapshot.sentimentSlices.length === 0 && <p className="text-sm text-slate-400 text-center italic">No categorized concerns found.</p>}
						</ul>
					</div>
				</div>

				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">Issue Snapshot</h2>
					<p className="mt-1 text-sm text-slate-500">Resolution status of all concerns in your projects (30d).</p>
					<ul className="mt-6 space-y-4">
						<li className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3">
							<span className="font-medium text-rose-900">{tw("concerns.statusOpen")}</span>
							<span className="text-2xl font-bold tabular-nums text-rose-800">{snapshot.concernStatusCount.open}</span>
						</li>
						<li className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3">
							<span className="font-medium text-amber-900">{tw("concerns.statusInProgress")}</span>
							<span className="text-2xl font-bold tabular-nums text-amber-900">{snapshot.concernStatusCount.inProgress}</span>
						</li>
						<li className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
							<span className="font-medium text-emerald-900">{tw("concerns.statusClosed")}</span>
							<span className="text-2xl font-bold tabular-nums text-emerald-800">{snapshot.concernStatusCount.closed}</span>
						</li>
					</ul>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("categoryTitle")}</h2>
					<ul className="mt-6 space-y-3">
						<li className="flex items-center justify-between gap-4 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
							<span className="text-sm font-semibold text-slate-600">{t("catConcern")}</span>
							<span className="font-plus-jakarta text-xl font-bold tabular-nums text-slate-900">
								{snapshot.categoryBreakdown30d.concern}
							</span>
						</li>
						<li className="flex items-center justify-between gap-4 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
							<span className="text-sm font-semibold text-slate-600">{t("catAchievement")}</span>
							<span className="font-plus-jakarta text-xl font-bold tabular-nums text-slate-900">
								{snapshot.categoryBreakdown30d.achievement}
							</span>
						</li>
						<li className="flex items-center justify-between gap-4 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
							<span className="text-sm font-semibold text-slate-600">{t("catAppreciation")}</span>
							<span className="font-plus-jakarta text-xl font-bold tabular-nums text-slate-900">
								{snapshot.categoryBreakdown30d.appreciation}
							</span>
						</li>
					</ul>
				</div>

				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("sentimentTitle")}</h2>
					{snapshot.projectSentiments.length === 0 ? (
						<p className="mt-4 text-sm text-slate-500 italic text-center py-10">{t("sentimentEmpty")}</p>
					) : (
						<ul className="mt-6 space-y-4">
							{snapshot.projectSentiments.map(p => (
								<li key={p.projectId} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between group">
									<div className="min-w-0">
										<p className="truncate font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{p.projectName}</p>
										<p className="text-xs text-slate-500 font-medium">
											{t("signalsCount", { count: p.signalCount })}
										</p>
									</div>
									<div className="flex items-center gap-3">
										<SentimentBar value={p.avgSentiment} />
										{p.avgSentiment != null ? (
											<span className="w-10 text-right text-sm font-bold tabular-nums text-slate-700">
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
				<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary uppercase tracking-tight mb-6">{t("teamTitle")}</h2>
				{snapshot.teamActivity.length === 0 ? (
					<p className="mt-4 text-sm text-slate-500 italic text-center py-10">{t("teamEmpty")}</p>
				) : (
					<ul className="space-y-6">
						{snapshot.teamActivity.map(item => {
							const isRedundant =
								item.preview &&
								(item.title.toLowerCase().includes(item.preview.toLowerCase()) ||
									item.preview.toLowerCase().includes(item.title.toLowerCase()));

							return (
								<li
									key={item.id}
									className="flex gap-4 border-b border-slate-50 pb-6 last:border-0 last:pb-0 group"
								>
									<ActivityIcon category={item.category} />
									<div className="min-w-0 flex-1 space-y-1.5">
										<p className="font-plus-jakarta text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
											<span className="text-slate-600">{item.authorName}</span> {activityVerb(item.category, t)}
										</p>
										<FormattedContent
											content={item.title}
											className="line-clamp-2 font-plus-jakarta text-base font-bold tracking-tight text-[#191C1D] group-hover:text-brand-primary transition-colors"
										/>
										{item.preview && !isRedundant ? (
											<FormattedContent
												content={item.preview}
												className="line-clamp-2 font-plus-jakarta text-sm font-medium leading-relaxed text-slate-500"
											/>
										) : null}
										<div className="flex flex-wrap gap-x-4 gap-y-1 font-plus-jakarta text-[11px] font-bold text-slate-400">
											{item.projectName ? <span className="flex items-center gap-1"><Activity className="size-3" /> {item.projectName}</span> : null}
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
