import { getTranslations } from "next-intl/server";
import { NavArrowDown, NavArrowUp } from "iconoir-react";

import type { AiInsightsResult } from "@/app/actions/ai-insights";
import type { ManagementDashboardSnapshot } from "@/lib/management-dashboard-types";
import { AiInsightCards } from "@/components/dashboard/ai-insight-cards";
import { cn } from "@/lib/utils";

function SentimentPie({ slices }: { slices: { pct: number; color: string }[] }) {
	if (!slices.length) {
		return (
			<div className="flex h-52 w-52 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400" />
		);
	}
	let acc = 0;
	const parts = slices.map(s => {
		const start = acc;
		acc += s.pct;
		return `${s.color} ${start}% ${acc}%`;
	});
	if (acc < 100) {
		parts.push(`#f1f5f9 ${acc}% 100%`);
	}
	return (
		<div
			className="mx-auto h-52 w-52 shrink-0 rounded-full border border-slate-100 shadow-inner"
			style={{ background: `conic-gradient(${parts.join(", ")})` }}
		/>
	);
}

function Trend({ pct, labelUp, labelDown }: { pct: number | null; labelUp: string; labelDown: string }) {
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

function rankBadgeClass(rank: number) {
	if (rank === 1) return "bg-amber-100 text-amber-900 border-amber-200";
	if (rank === 2) return "bg-slate-200 text-slate-800 border-slate-300";
	if (rank === 3) return "bg-orange-100 text-orange-900 border-orange-200";
	return "bg-slate-50 text-slate-600 border-slate-200";
}

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
	const { kpis, sentimentSlices, leaderboard, projectHealth } = snapshot;

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
		</div>
	);
}
