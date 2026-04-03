"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { MyConcernItem } from "@/app/actions/concerns.types";
import { FormattedContent } from "@/components/shared/formatted-content";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const TABS = ["all", "open", "in_progress", "closed"] as const;
type TabId = (typeof TABS)[number];

function statusStyle(status: MyConcernItem["status"]) {
	switch (status) {
		case "closed":
			return "bg-emerald-50 text-emerald-800 border-emerald-200";
		case "in_progress":
			return "bg-sky-50 text-sky-800 border-sky-200";
		default:
			return "bg-amber-50 text-amber-900 border-amber-200";
	}
}

export function StaffConcernsStrip({ concerns }: { concerns: MyConcernItem[] }) {
	const t = useTranslations("Dashboard.staff");
	const [tab, setTab] = useState<TabId>("all");

	const filtered = useMemo(() => {
		if (tab === "all") return concerns;
		return concerns.filter(c => c.status === tab);
	}, [concerns, tab]);

	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="font-plus-jakarta text-lg font-bold text-brand-primary">{t("concernsTitle")}</h2>
				<Link
					href="/dashboard/concerns"
					className="text-sm font-semibold text-[#B09100] hover:underline"
				>
					{t("viewAll")}
				</Link>
			</div>

			<div className="mt-4 flex flex-wrap gap-2">
				{TABS.map(id => (
					<button
						key={id}
						type="button"
						onClick={() => setTab(id)}
						className={cn(
							"rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
							tab === id
								? "bg-[#FFD300] text-[#282828]"
								: "bg-slate-100 text-slate-600 hover:bg-slate-200",
						)}
					>
						{id === "all" && t("tabAll")}
						{id === "open" && t("tabPending")}
						{id === "in_progress" && t("tabInProgress")}
						{id === "closed" && t("tabResolved")}
					</button>
				))}
			</div>

			{filtered.length === 0 ? (
				<p className="mt-6 text-center text-sm text-slate-500">{t("noConcerns")}</p>
			) : (
				<ul className="mt-6 space-y-3">
					{filtered.slice(0, 6).map(c => (
						<li
							key={c.id}
							className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-start sm:justify-between"
						>
							<div className="min-w-0 flex-1 text-left">
								<FormattedContent
									content={c.details}
									className="line-clamp-2 font-plus-jakarta text-sm font-medium text-slate-900"
								/>
								<p className="mt-1 text-xs text-slate-500">
									{new Date(c.createdAt).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
									})}{" "}
									· {c.targetLabel}
								</p>
							</div>
							<span
								className={cn(
									"shrink-0 self-start rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
									statusStyle(c.status),
								)}
							>
								{c.status.replace("_", " ")}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
