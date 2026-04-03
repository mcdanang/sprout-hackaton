// src/app/[locale]/dashboard/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { getStaffDashboardSnapshot } from "@/app/actions/staff-dashboard";
import { ManagementDashboardView } from "@/components/dashboard/management-dashboard-view";
import { StaffDashboardView } from "@/components/dashboard/staff-dashboard-view";
import { EMPTY_STAFF_DASHBOARD } from "@/lib/staff-dashboard-types";
import { getAccountPersonaFromCookie } from "@/lib/effective-employee";
import { getCurrentEmployee } from "@/lib/get-current-employee";
import { getSquadLeadDashboardSnapshot } from "@/app/actions/squad-lead-dashboard";
import { SquadLeadDashboardView } from "@/components/dashboard/squad-lead-dashboard-view";
import { DashboardRoleSwitcher, type DashboardRole } from "@/components/dashboard/dashboard-role-switcher";
import { getAiInsights } from "@/app/actions/ai-insights";
import { getMyConcerns } from "@/app/actions/concerns";
import { getManagementDashboardSnapshot } from "@/app/actions/management-dashboard";
import { createClient } from "@/lib/supabase/server";

function firstNameFromFullName(fullName: string): string {
	const trimmed = fullName.trim();
	if (!trimmed) return "there";
	return trimmed.split(/\s+/)[0] ?? "there";
}

export default async function DashboardPage(props: { 
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ view?: string }> 
}) {
	const params = await props.params;
	const searchParams = await props.searchParams;
	const locale = params.locale;
	const user = await currentUser();
	const persona = await getAccountPersonaFromCookie();
	const employee = await getCurrentEmployee();
	const supabase = await createClient();

	let firstName = user?.firstName || "there";
	if (persona && employee?.fullName) {
		firstName = firstNameFromFullName(employee.fullName);
	}

	const isTopManagement = employee?.roleName === "TOP MANAGEMENT";
	
	// Complex role detection: explicit role or project lead
	const { count: squadCount } = await supabase
		.from("projects")
		.select("id", { count: "exact", head: true })
		.eq("squad_lead_employee_id", employee?.id);
	
	const isSquadLead = ((squadCount as number) ?? 0) > 0 || employee?.roleName === "SQUAD LEAD";

	const availableRoles: DashboardRole[] = ["individual"];
	if (isSquadLead) availableRoles.push("squad_lead");
	if (isTopManagement) availableRoles.push("management");

	const defaultView: DashboardRole = isTopManagement 
		? "management" 
		: isSquadLead 
			? "squad_lead" 
			: "individual";
	
	const requestedView = searchParams.view as DashboardRole;
	const currentView = availableRoles.includes(requestedView) ? requestedView : defaultView;

	const [insights, concerns] = await Promise.all([
		getAiInsights(),
		getMyConcerns(),
	]);

	let dashboardContent = null;

	if (currentView === "management") {
		const snapshot = await getManagementDashboardSnapshot();
		if (snapshot) {
			dashboardContent = (
				<ManagementDashboardView firstName={firstName} snapshot={snapshot} insights={insights} />
			);
		}
	} else if (currentView === "squad_lead") {
		const snapshot = await getSquadLeadDashboardSnapshot();
		if (snapshot) {
			dashboardContent = (
				<SquadLeadDashboardView firstName={firstName} snapshot={snapshot} insights={insights} />
			);
		}
	}

	// Default to Staff/Individual if nothing else matched or chosen
	if (!dashboardContent) {
		const snapshot = await getStaffDashboardSnapshot();
		dashboardContent = (
			<StaffDashboardView
				firstName={firstName}
				snapshot={snapshot ?? EMPTY_STAFF_DASHBOARD}
				concerns={concerns}
				insights={insights}
				locale={locale}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<DashboardRoleSwitcher availableRoles={availableRoles} currentRole={currentView} />
			{dashboardContent}
		</div>
	);
}
