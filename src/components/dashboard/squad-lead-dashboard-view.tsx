import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { SquadLeadDashboardSnapshot } from "@/lib/squad-lead-dashboard-types";
import type { AiInsightsResult } from "@/app/actions/ai-insights";
import { AiInsightCards } from "@/components/dashboard/ai-insight-cards";
import { 
	SentimentPie, 
	Trend, 
	SentimentBar, 
	rankBadgeClass 
} from "@/components/dashboard/dashboard-widgets";
import { PulseChart, SquadActivityChart } from "@/components/dashboard/dashboard-charts";

export async function SquadLeadDashboardView({
	firstName,
	snapshot,
	insights,
}: {
	firstName: string;
	snapshot: SquadLeadDashboardSnapshot;
	insights: AiInsightsResult;
}) {
	const t = await getTranslations("Dashboard.squadLead");
	const tw = await getTranslations("Dashboard");
	const { kpis, sentimentSlices, leaderboard, projectSentiments, concernStatusCount } = snapshot;

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

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{t("kpiProjects")}</p>
					<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">
						{kpis.projectsLed}
					</p>
				</div>
				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
						{t("kpiSignals")}
					</p>
					<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">
						{kpis.totalSignals.current}
					</p>
					<div className="mt-2">
						<Trend
							pct={kpis.totalSignals.pctChange}
							labelUp={tw("management.trendUp")}
							labelDown={tw("management.trendDown")}
						/>
					</div>
				</div>
				<div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{t("kpiConcerns")}</p>
					<p className="mt-2 font-plus-jakarta text-4xl font-bold text-[#191C1D]">{kpis.openConcerns}</p>
				</div>
				<div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
						{t("kpiSentiment")}
					</p>
					<div className="flex items-end gap-3 mt-2">
						<p className="font-plus-jakarta text-4xl font-bold text-[#191C1D]">
							{kpis.avgSentiment ?? "—"}
						</p>
						{kpis.avgSentiment && <SentimentBar value={kpis.avgSentiment} />}
					</div>
				</div>
			</div>

			{insights.insights.length > 0 ? (
				<AiInsightCards insights={insights.insights} generatedAt={insights.generatedAt} />
			) : null}

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<PulseChart data={snapshot.sentimentTrend} title={t("sentimentTrendTitle")} />
				</div>
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<SquadActivityChart data={snapshot.activityTrend} title={t("activityTrendTitle")} />
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("sentimentTitle")}</h2>
					<p className="mt-1 text-sm text-slate-500">{t("sentimentHint")}</p>
					{projectSentiments.length === 0 ? (
						<p className="mt-6 text-sm text-slate-500 text-center">No projects tracked.</p>
					) : (
						<ul className="mt-6 space-y-4">
							{projectSentiments.map(p => (
								<li key={p.projectId} className="flex items-center justify-between gap-4">
									<div className="min-w-0 flex-1">
										<p className="truncate font-semibold text-slate-900">{p.projectName}</p>
										<p className="text-xs text-slate-500">{p.signalCount} signals</p>
									</div>
									<div className="flex items-center gap-3 w-1/2 justify-end">
										<SentimentBar value={p.avgSentiment} />
										<span className="w-8 text-right text-sm font-bold tabular-nums text-slate-700">
											{p.avgSentiment ?? "—"}
										</span>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("issueTitle")}</h2>
					<p className="mt-1 text-sm text-slate-500">{t("issueHint")}</p>
					<div className="mt-8 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
						<SentimentPie slices={sentimentSlices} className="h-40 w-40" />
						<ul className="w-full space-y-2">
							{sentimentSlices.map(s => (
								<li key={s.key} className="flex items-center gap-2 text-sm">
									<span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
									<span className="text-slate-700">
										{s.label} <span className="font-semibold tabular-nums">({s.pct}%)</span>
									</span>
								</li>
							))}
							{sentimentSlices.length === 0 && <p className="text-sm text-slate-400 text-center">No categorized signals.</p>}
						</ul>
					</div>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("statusTitle")}</h2>
					<p className="mt-1 text-sm text-slate-500">{t("statusHint")}</p>
					<ul className="mt-6 space-y-4">
						<li className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3">
							<span className="font-medium text-rose-900">{tw("concerns.statusOpen")}</span>
							<span className="text-2xl font-bold tabular-nums text-rose-800">{concernStatusCount.open}</span>
						</li>
						<li className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3">
							<span className="font-medium text-amber-900">{tw("concerns.statusInProgress")}</span>
							<span className="text-2xl font-bold tabular-nums text-amber-900">{concernStatusCount.inProgress}</span>
						</li>
						<li className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
							<span className="font-medium text-emerald-900">{tw("concerns.statusClosed")}</span>
							<span className="text-2xl font-bold tabular-nums text-emerald-800">{concernStatusCount.closed}</span>
						</li>
					</ul>
				</div>

				<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
					<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("leaderboardTitle")}</h2>
					<p className="mt-1 text-sm text-slate-500">{t("leaderboardHint")}</p>
					{leaderboard.length === 0 ? (
						<p className="mt-6 text-sm text-slate-500">{tw("management.leaderboardEmpty")}</p>
					) : (
						<ul className="mt-6 space-y-3">
							{leaderboard.map(row => (
								<li key={row.employeeId} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-3 py-3">
									<span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold", rankBadgeClass(row.rank))}>
										#{row.rank}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate font-semibold text-slate-900">{row.fullName}</p>
										<p className="truncate text-xs text-slate-500">{row.squadLabel}</p>
									</div>
									<span className="shrink-0 text-sm font-bold tabular-nums text-[#B09100]">
										{row.points} {tw("management.ptsLabel")}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
