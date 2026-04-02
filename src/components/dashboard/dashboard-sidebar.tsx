"use client";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
	ViewGrid,
	Folder,
	ChatLines,
	Star,
	ShieldCheck,
	Flash,
	Menu,
	Xmark,
	NavArrowLeft,
	NavArrowRight,
} from "iconoir-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/language-switcher";

const navItems = [
	{ href: "/dashboard", icon: ViewGrid, label: "dashboard" },
	{ href: "/dashboard/projects", icon: Folder, label: "projects" },
	{ href: "/dashboard/concerns", icon: ChatLines, label: "myConcern" },
	{ href: "/dashboard/achievements", icon: Star, label: "myAchievement" },
	{ href: "/dashboard/feedback", icon: ShieldCheck, label: "privateFeedback" },
	{ href: "/dashboard/ai-assistant", icon: Flash, label: "aiAssistant" },
];

interface DashboardSidebarProps {
	isCollapsed: boolean;
	onToggle: () => void;
}

export function DashboardSidebar({ isCollapsed, onToggle }: DashboardSidebarProps) {
	const t = useTranslations("Dashboard");
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	const sidebarContent = (
		<div
			className={cn(
				"flex h-full flex-col bg-background py-6 transition-all duration-300 ease-in-out",
				isCollapsed ? "px-3" : "px-4",
			)}
		>
			{/* Logo */}
			<div
				className={cn(
					"mb-10 px-2 transition-all duration-300",
					isCollapsed ? "flex justify-center" : "",
				)}
			>
				<Link href="/dashboard" className="flex items-center gap-3">
					<Image
						src="/signal_logo.svg"
						alt="Signal Logo"
						width={32}
						height={32}
						className="object-contain min-w-[32px]"
					/>
					{!isCollapsed && (
						<span className="font-open-sans text-[22px] font-bold tracking-tight text-[#081021] whitespace-nowrap animate-in fade-in duration-300">
							Signal
						</span>
					)}
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex-1 space-y-2">
				{navItems.map(item => {
					const isActive =
						item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
					const Icon = item.icon;

					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={() => setIsOpen(false)}
							className={cn(
								"flex items-center transition-all duration-300 rounded-full font-open-sans text-[14px] leading-[19px] tracking-[0.25px]",
								isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
								isActive
									? "bg-[#FFD300] text-[#282828] font-bold shadow-sm"
									: "text-[#64748B] font-semibold hover:bg-slate-50 hover:text-slate-900",
							)}
						>
							<Icon
								className={cn(
									"h-5 w-5 min-w-[20px]",
									isActive ? "stroke-[2.5px]" : "stroke-[1.5px]",
								)}
							/>
							{!isCollapsed && (
								<span className="whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-300">
									{t(`nav.${item.label}`)}
								</span>
							)}
						</Link>
					);
				})}
			</nav>

			{/* Footer / Account Settings */}
			<div
				className={cn(
					"mt-auto border-t pt-6 transition-all duration-300",
					isCollapsed ? "px-0" : "px-2",
				)}
			>
				<div
					className={cn("flex items-center gap-4", isCollapsed ? "flex-col" : "justify-between")}
				>
					<LanguageSwitcher />
					<UserButton />
				</div>
			</div>
		</div>
	);

	return (
		<>
			{/* Mobile Trigger */}
			<div className="fixed top-4 right-4 z-50 md:hidden">
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border"
				>
					{isOpen ? <Xmark className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
				</button>
			</div>

			{/* Desktop Sidebar Container */}
			<div
				className={cn(
					"hidden bg-background md:block transition-all duration-300 ease-in-out h-screen sticky top-0 rounded-tr-[40px] rounded-br-[40px] z-10",
					isCollapsed ? "w-20" : "w-72",
				)}
			>
				{/* Toggle Button */}
				<button
					onClick={onToggle}
					className={cn(
						"absolute -right-4 top-12 z-50 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition-transform hover:scale-110",
					)}
				>
					{isCollapsed ? (
						<NavArrowRight className="h-5 w-5 text-slate-600" />
					) : (
						<NavArrowLeft className="h-5 w-5 text-slate-600" />
					)}
				</button>

				{sidebarContent}
			</div>

			{/* Mobile Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden transition-opacity"
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* Mobile Drawer */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Pass dummy props for mobile always expanded */}
				<div className="flex h-full flex-col bg-background px-4 py-6">
					{/* Logo */}
					<div className="mb-10 px-2">
						<Link href="/dashboard" className="flex items-center gap-3">
							<Image
								src="/signal_logo.svg"
								alt="Signal Logo"
								width={32}
								height={32}
								className="object-contain"
							/>
							<span className="font-open-sans text-[22px] font-bold tracking-tight text-[#081021]">
								Signal
							</span>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="flex-1 space-y-2">
						{navItems.map(item => {
							const isActive =
								item.href === "/dashboard"
									? pathname === item.href
									: pathname.startsWith(item.href);
							const Icon = item.icon;

							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={() => setIsOpen(false)}
									className={cn(
										"flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-full font-open-sans text-[14px] leading-[19px] tracking-[0.25px]",
										isActive
											? "bg-[#FFD300] text-[#282828] font-bold shadow-sm"
											: "text-[#64748B] font-semibold hover:bg-slate-50 hover:text-slate-900",
									)}
								>
									<Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
									<span>{t(`nav.${item.label}`)}</span>
								</Link>
							);
						})}
					</nav>
					<div className="mt-auto border-t pt-6 flex items-center justify-between px-2">
						<LanguageSwitcher />
						<UserButton />
					</div>
				</div>
			</aside>
		</>
	);
}
