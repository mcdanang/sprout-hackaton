"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, ShieldCheck, Briefcase, Layers, X, Check } from "lucide-react";
import type { DashboardRole } from "./dashboard-role-switcher";

interface DashboardMobileSwitcherProps {
	availableRoles: DashboardRole[];
	currentRole: DashboardRole;
}

export function DashboardMobileSwitcher({ availableRoles, currentRole }: DashboardMobileSwitcherProps) {
	const t = useTranslations("Dashboard.roleSwitcher");
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isOpen, setIsOpen] = useState(false);

	if (availableRoles.length <= 1) return null;

	const roles = [
		{ id: "individual", label: t("individual"), icon: User },
		{ id: "squad_lead", label: t("squadLead"), icon: ShieldCheck },
		{ id: "management", label: t("management"), icon: Briefcase },
	].filter(r => availableRoles.includes(r.id as DashboardRole));

	return (
		<>
			{/* Quick Access Button (FAB) */}
			<div className="fixed bottom-6 right-6 z-50 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
				<button
					onClick={() => setIsOpen(true)}
					className="flex items-center gap-2 px-5 py-3 bg-brand-primary text-white rounded-full shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/10 backdrop-blur-md"
				>
					<Layers className="size-5" />
					<span className="text-sm font-bold tracking-tight">Switch View</span>
				</button>
			</div>

			{/* Backdrop and Bottom Sheet */}
			<div 
				className={cn(
					"fixed inset-0 z-60 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
					isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
				)}
				onClick={() => setIsOpen(false)}
			>
				{/* Bottom Sheet */}
				<div 
					className={cn(
						"fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 pb-10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
						isOpen ? "translate-y-0" : "translate-y-full"
					)}
					onClick={e => e.stopPropagation()}
				>
					{/* Drag Handle */}
					<div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
					
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-xl font-bold text-slate-900 px-2">Choose View</h3>
						<button 
							onClick={() => setIsOpen(false)}
							className="p-2 hover:bg-slate-100 rounded-full transition-colors"
						>
							<X className="size-5 text-slate-500" />
						</button>
					</div>

					<div className="space-y-3">
						{roles.map(role => {
							const isActive = currentRole === role.id;
							const Icon = role.icon;
							
							const params = new URLSearchParams(searchParams.toString());
							params.set("view", role.id);
							const href = `${pathname}?${params.toString()}`;

							return (
								<Link
									key={role.id}
									href={href}
									onClick={() => setIsOpen(false)}
									className={cn(
										"flex items-center justify-between px-6 py-5 rounded-[24px] border-2 transition-all duration-300",
										isActive 
											? "bg-brand-primary/5 border-brand-primary" 
											: "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200"
									)}
								>
									<div className="flex items-center gap-4">
										<div className={cn(
											"p-2.5 rounded-xl transition-colors",
											isActive ? "bg-brand-primary text-white" : "bg-white text-slate-500 shadow-sm"
										)}>
											<Icon className="size-5" />
										</div>
										<span className={cn(
											"text-base font-bold",
											isActive ? "text-brand-primary" : "text-slate-700"
										)}>
											{role.label}
										</span>
									</div>
									{isActive && (
										<div className="bg-brand-primary rounded-full p-1">
											<Check className="size-3.5 text-white stroke-[3px]" />
										</div>
									)}
								</Link>
							);
						})}
					</div>
				</div>
			</div>
		</>
	);
}
