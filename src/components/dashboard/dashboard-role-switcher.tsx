"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, ShieldCheck, Briefcase } from "lucide-react";

export type DashboardRole = "individual" | "squad_lead" | "management";

interface DashboardRoleSwitcherProps {
	availableRoles: DashboardRole[];
	currentRole: DashboardRole;
}

export function DashboardRoleSwitcher({ availableRoles, currentRole }: DashboardRoleSwitcherProps) {
	const t = useTranslations("Dashboard.roleSwitcher");
	const pathname = usePathname();
	const searchParams = useSearchParams();

	if (availableRoles.length <= 1) return null;

	const roles = [
		{ id: "individual", label: t("individual"), icon: User },
		{ id: "squad_lead", label: t("squadLead"), icon: ShieldCheck },
		{ id: "management", label: t("management"), icon: Briefcase },
	].filter(r => availableRoles.includes(r.id as DashboardRole));

	return (
		<div className="flex justify-center mb-8">
			<div className="inline-flex items-center p-1.5 gap-1 bg-slate-100/50 backdrop-blur-sm border border-slate-200 rounded-[20px] shadow-sm">
				{roles.map(role => {
					const isActive = currentRole === role.id;
					const Icon = role.icon;
					
					// Reconstruct search params
					const params = new URLSearchParams(searchParams.toString());
					params.set("view", role.id);
					const href = `${pathname}?${params.toString()}`;

					return (
						<Link
							key={role.id}
							href={href}
							className={cn(
								"flex items-center gap-2 px-4 py-2 rounded-[16px] text-sm font-bold transition-all duration-300 outline-none",
								isActive 
									? "bg-white text-brand-primary shadow-sm" 
									: "text-slate-500 hover:text-slate-800 hover:bg-white/50"
							)}
						>
							<Icon className={cn("size-4", isActive ? "text-primary" : "text-slate-400")} />
							{role.label}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
