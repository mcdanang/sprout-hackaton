// src/app/[locale]/dashboard/page.tsx
import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { Quote } from "iconoir-react";

import { getAiInsights } from "@/app/actions/ai-insights";
import { getMyConcerns } from "@/app/actions/concerns";
import { getManagementDashboardSnapshot } from "@/app/actions/management-dashboard";
import { getStaffDashboardSnapshot } from "@/app/actions/staff-dashboard";
import { ManagementDashboardView } from "@/components/dashboard/management-dashboard-view";
import { AiInsightCards } from "@/components/dashboard/ai-insight-cards";
import { StaffDashboardView } from "@/components/dashboard/staff-dashboard-view";
import { EMPTY_STAFF_DASHBOARD } from "@/lib/staff-dashboard-types";
import { cn } from "@/lib/utils";
import { getAccountPersonaFromCookie } from "@/lib/effective-employee";
import { getCurrentEmployee } from "@/lib/get-current-employee";

function firstNameFromFullName(fullName: string): string {
	const trimmed = fullName.trim();
	if (!trimmed) return "there";
	return trimmed.split(/\s+/)[0] ?? "there";
}

export default async function DashboardPage() {
	const t = await getTranslations("Dashboard");
	const user = await currentUser();
	const persona = await getAccountPersonaFromCookie();
	const employee = await getCurrentEmployee();

	let firstName = user?.firstName || "there";
	if (persona && employee?.fullName) {
		firstName = firstNameFromFullName(employee.fullName);
	}

	const isTopManagement = employee?.roleName === "TOP MANAGEMENT";
	const isStaff = employee?.roleName === "STAFF";
	const isDeliveryLead = employee?.roleName === "SQUAD LEAD";

	if (isTopManagement) {
		const [snapshot, insights] = await Promise.all([
			getManagementDashboardSnapshot(),
			getAiInsights(),
		]);

		if (snapshot) {
			return (
				<ManagementDashboardView firstName={firstName} snapshot={snapshot} insights={insights} />
			);
		}
	}

	if (isStaff || isDeliveryLead) {
		const [snapshot, concerns, insights] = await Promise.all([
			getStaffDashboardSnapshot(),
			getMyConcerns(),
			getAiInsights(),
		]);

		return (
			<StaffDashboardView
				firstName={firstName}
				snapshot={snapshot ?? EMPTY_STAFF_DASHBOARD}
				concerns={concerns}
				insights={insights}
			/>
		);
	}

	const insights = await getAiInsights();

	return (
		<div className="mx-auto max-w-5xl space-y-12">
			<div className="space-y-4">
				<p className="font-plus-jakarta text-[12px] font-semibold leading-[16px] tracking-[1.2px] uppercase text-[#B09100]">
					{t("title")}
				</p>
				<h1 className="font-plus-jakarta text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-[#191C1D]">
					{t("welcome", { name: firstName })}
				</h1>
				<p className="font-plus-jakarta text-[18px] font-normal leading-[28px] text-[#3F484A] max-w-2xl">
					{t("subtitle")}
				</p>
			</div>

			<AiInsightCards insights={insights.insights} generatedAt={insights.generatedAt} />

			<div
				className={cn(
					"relative overflow-hidden rounded-[32px] p-10 md:p-14",
					"bg-[#FFFBEB] border border-[#FEF3C7] shadow-sm",
				)}
			>
				<Quote className="h-10 w-10 text-text-primary mb-8" />
				<div className="space-y-8">
					<p className="font-plus-jakarta text-[32px] md:text-[40px] font-medium leading-tight tracking-tight text-brand-primary">
						{t("quote.text")}
					</p>
					<Quote className="h-10 w-10 text-text-primary mb-8" />
					<div className="flex items-center gap-3">
						<div className="h-[2px] w-8 bg-primary" />
						<span className="font-plus-jakarta text-[14px] font-bold tracking-[1.5px] uppercase text-[#3F484A]">
							{t("quote.author")}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
