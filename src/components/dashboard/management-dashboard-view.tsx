import { getTranslations } from "next-intl/server";
import { Flame, Layout } from "lucide-react";

import type { AiInsightsResult } from "@/app/actions/ai-insights";
import type { ManagementDashboardSnapshot } from "@/lib/management-dashboard-types";
import { AiInsightCards } from "@/components/dashboard/ai-insight-cards";
import { cn } from "@/lib/utils";
import { 
	SentimentPie, 
	Trend, 
	rankBadgeClass,
} from "@/components/dashboard/dashboard-widgets";
import { PulseChart, ActivityChart } from "@/components/dashboard/dashboard-charts";

export async function ManagementDashboardView({
	firstName,
	snapshot,
	insights,
}: {
	firstName: string;
	snapshot: ManagementDashboardSnapshot;
	insights: AiInsightsResult;
}) {
	const t = await getTranslations("Dashboard.management");
	const tw = await getTranslations("Dashboard");
	const { kpis, sentimentSlices, leaderboard, projectHealth, projectStatus, burnoutAlerts } = snapshot;

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

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{t("kpiConcerns")}</p>
					<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">
						{kpis.concerns.current}
					</p>
					<div className="mt-2">
						<Trend
							pct={kpis.concerns.pctChange}
							labelUp={t("trendUp")}
							labelDown={t("trendDown")}
						/>
					</div>
				</div>
				<div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
						{t("kpiAchievements")}
					</p>
					<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">
						{kpis.achievements.current}
					</p>
					<div className="mt-2">
						<Trend
							pct={kpis.achievements.pctChange}
							labelUp={t("trendUp")}
							labelDown={t("trendDown")}
						/>
					</div>
				</div>
				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t("kpiSquads")}</p>
					<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">{kpis.activeProjects}</p>
					<p className="mt-2 text-xs text-slate-500">{t("kpiSquadsHint")}</p>
				</div>
				<div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
						{t("kpiResolved")}
					</p>
					<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">
						{kpis.resolvedConcerns.current}
					</p>
					<div className="mt-2">
						<Trend
							pct={kpis.resolvedConcerns.pctChange}
							labelUp={t("trendUp")}
							labelDown={t("trendDown")}
						/>
					</div>
				</div>
			</div>

			{insights.insights.length > 0 ? (
				<AiInsightCards insights={insights.insights} generatedAt={insights.generatedAt} />
			) : null}

			{/* Helicopter View - Lifecycle & Health */}
			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<div className="flex items-center gap-2 text-brand-primary mb-1">
						<Layout className="size-5" />
						<h2 className="font-plus-jakarta text-lg font-bold uppercase tracking-tight">Helicopter View: Lifecycle</h2>
					</div>
					<p className="text-sm text-slate-500 mb-6">Aggregate distribution of projects by phase.</p>
					
					<div className="space-y-4">
						<div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 border border-sky-100">
							<span className="text-sm font-semibold text-sky-900">Planning / Discovery</span>
							<span className="text-xl font-bold tabular-nums text-sky-700">{projectStatus.planning}</span>
						</div>
						<div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
							<span className="text-sm font-semibold text-indigo-900">Active Development</span>
							<span className="text-xl font-bold tabular-nums text-indigo-700">{projectStatus.development}</span>
						</div>
						<div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
							<span className="text-sm font-semibold text-slate-900">Maintenance / Stable</span>
							<span className="text-xl font-bold tabular-nums text-slate-700">{projectStatus.maintenance}</span>
						</div>
					</div>
				</div>

				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("healthTitle")}</h2>
					<p className="mt-1 text-sm text-slate-500">{t("healthHint")}</p>
					<ul className="mt-6 space-y-4">
						<li className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
							<span className="font-medium text-emerald-900">{t("healthHealthy")}</span>
							<span className="text-2xl font-bold tabular-nums text-emerald-800">
								{projectHealth.healthy}
							</span>
						</li>
						<li className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3">
							<span className="font-medium text-amber-900">{t("healthWarning")}</span>
							<span className="text-2xl font-bold tabular-nums text-amber-900">
								{projectHealth.warning}
							</span>
						</li>
						<li className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3">
							<span className="font-medium text-rose-900">{t("healthCritical")}</span>
							<span className="text-2xl font-bold tabular-nums text-rose-800">
								{projectHealth.critical}
							</span>
						</li>
					</ul>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<PulseChart data={snapshot.pulseTrend} title={t("pulseTrendTitle")} />
				</div>
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<ActivityChart data={snapshot.engagementTrend} title={t("engagementTrendTitle")} />
				</div>
			</div>

			<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
				<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("sentimentTitle")}</h2>
				<p className="mt-1 text-sm text-slate-500">{t("sentimentHint")}</p>
				<div className="mt-8 flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
					<SentimentPie slices={sentimentSlices} />
					<ul className="grid w-full max-w-md gap-2 sm:grid-cols-2">
						{sentimentSlices.map(s => (
							<li key={s.key} className="flex items-center gap-2 text-sm">
								<span
									className="h-3 w-3 shrink-0 rounded-sm"
									style={{ backgroundColor: s.color }}
								/>
								<span className="text-slate-700">
									{s.label}{" "}
									<span className="font-semibold tabular-nums text-slate-900">({s.pct}%)</span>
								</span>
							</li>
						))}
					</ul>
				</div>
				{sentimentSlices.length === 0 ? (
					<p className="mt-6 text-center text-sm text-slate-500">{t("sentimentEmpty")}</p>
				) : null}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("leaderboardTitle")}</h2>
					<p className="mt-1 text-sm text-slate-500">{t("leaderboardHint")}</p>
					{leaderboard.length === 0 ? (
						<p className="mt-6 text-sm text-slate-500">{t("leaderboardEmpty")}</p>
					) : (
						<ul className="mt-6 space-y-3">
							{leaderboard.map(row => (
								<li
									key={row.employeeId}
									className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-3 py-3"
								>
									<span
										className={cn(
											"flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
											rankBadgeClass(row.rank),
										)}
									>
										#{row.rank}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate font-semibold text-slate-900">{row.fullName}</p>
										<p className="truncate text-xs text-slate-500">{row.squadLabel}</p>
									</div>
									<span className="shrink-0 text-sm font-bold tabular-nums text-[#B09100]">
										{row.points} {t("ptsLabel")}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="rounded-3xl border border-rose-100 bg-rose-50/30 p-6 shadow-sm">
					<div className="flex items-center gap-2 text-rose-700 mb-1">
						<Flame className="size-5" />
						<h2 className="font-plus-jakarta text-lg font-bold uppercase tracking-tight">Burnout High-Risk Squads</h2>
					</div>
					<p className="text-sm text-slate-600 mb-6">Squads with the highest &quot;Burnout Alert&quot; flag frequency (30d).</p>
					
					{burnoutAlerts.length === 0 ? (
						<p className="text-sm text-slate-400 py-8 text-center italic">No squads at critical risk currently.</p>
					) : (
						<ul className="space-y-3">
							{burnoutAlerts.map(alert => (
								<li key={alert.projectName} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-rose-100 shadow-sm">
									<span className="font-bold text-slate-900">{alert.projectName}</span>
									<div className="flex items-center gap-2 bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
										{alert.count} Flags
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
