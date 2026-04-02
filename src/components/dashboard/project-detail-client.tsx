"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, AlertCircle, Trophy, Heart, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/constants/activity";
import type { Project } from "@/lib/types/project";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { healthStyles } from "@/lib/constants/project-ui";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { SignalModal } from "@/components/dashboard/signal-modal";

interface Props {
	project: Project;
	activities: ActivityItem[];
}

export function ProjectDetailClient({ project, activities }: Props) {
	const router = useRouter();
	const t = useTranslations("ProjectDetail");
	const [scrolled, setScrolled] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => setScrolled(!entry.isIntersecting),
			{ threshold: 0 },
		);
		if (sentinelRef.current) observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, []);

	return (
		<div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
			{/* Sticky header */}
			<div className={cn(
				"md:sticky z-30 flex items-center justify-between transition-all duration-500",
				scrolled
					? "md:top-3 py-3 px-5 md:rounded-2xl md:bg-white/60 md:backdrop-blur-xl md:border md:border-slate-200/50 md:shadow-md"
					: "md:top-0 py-4 bg-transparent",
			)}>
				<button
					onClick={() => router.back()}
					className="group flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-colors font-plus-jakarta text-sm font-semibold"
				>
					<ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
					{t("back")}
				</button>

				{/* Desktop only */}
				<button
					onClick={() => setIsModalOpen(true)}
					className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary text-white font-plus-jakarta text-sm font-bold hover:bg-brand-primary/90 active:scale-95 transition-all shadow-sm"
				>
					<Plus className="h-3.5 w-3.5" />
					Signal
				</button>
			</div>

			{/* Sentinel for scroll detection */}
			<div ref={sentinelRef} className="h-0" />

			{/* Hero Header Card */}
			<div className="group relative rounded-[32px] p-[1.5px] overflow-hidden border border-slate-100">
				<div className="absolute -inset-full [background:conic-gradient(from_0deg,transparent_0_80%,#FFD300_100%)] animate-[border-rotate_8s_linear_infinite]" />
				<div className="relative z-10 bg-white rounded-[30.5px] p-8 md:p-12 space-y-10">
					<div className="space-y-6">
						<h1 className="font-plus-jakarta text-4xl md:text-5xl font-bold text-brand-primary tracking-tight">
							{project.name}
						</h1>
						<p className="font-plus-jakarta text-lg text-slate-500 max-w-3xl leading-relaxed">
							{project.description}
						</p>
					</div>
					<div className="pt-8 border-t border-slate-100/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
						<div className="space-y-4">
							<span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block">
								{project.team.length} Members Collaborating
							</span>
							<div className="flex -space-x-3">
								{project.team.map((avatar: string, i: number) => (
									<div
										key={i}
										className="relative h-12 w-12 rounded-full border-4 border-white shadow-sm overflow-hidden bg-slate-50 transition-transform hover:scale-110 hover:z-20 cursor-pointer"
									>
										<Image src={avatar} alt="Squad member" fill className="object-cover" />
									</div>
								))}
							</div>
						</div>
						<div className="hidden md:block">
							<button className="px-5 py-2.5 rounded-2xl bg-brand-primary/5 text-brand-primary font-plus-jakarta text-sm font-bold hover:bg-brand-primary hover:text-white transition-all">
								Manage Squad
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Team Pulse */}
			<div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<h2 className="font-plus-jakarta text-xl font-bold text-brand-primary">{t("healthLabel")}</h2>
						<p className="text-sm text-slate-600 leading-none font-medium">
							Real-time team performance and psychological safety indicator
						</p>
					</div>
					<div className="flex flex-col items-end gap-1 text-right">
						<span className="text-2xl font-bold font-plus-jakarta text-slate-900">
							{project.healthStatus}
						</span>
					</div>
				</div>
				<Progress value={project.health} className="h-3 w-full">
					<ProgressTrack className="h-full w-full bg-slate-50">
						<ProgressIndicator
							className={cn("h-full transition-all duration-1000", healthStyles[project.healthStatus])}
						/>
					</ProgressTrack>
				</Progress>
			</div>

			{/* Tri-Metric Summary */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-100 transition-all hover:shadow-md">
					<div className="space-y-1">
						<span className="font-plus-jakarta text-[13px] font-bold text-slate-500 uppercase tracking-wider">
							{t("concernsLabel")}
						</span>
						<p className="text-3xl font-bold font-plus-jakarta text-brand-primary group-hover:text-red-600 transition-colors">
							{project.concernsCount}
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
						<AlertCircle className="h-6 w-6" />
					</div>
				</div>

				<div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-100 transition-all hover:shadow-md">
					<div className="space-y-1">
						<span className="font-plus-jakarta text-[13px] font-bold text-slate-500 uppercase tracking-wider">
							{t("achievementsLabel")}
						</span>
						<p className="text-3xl font-bold font-plus-jakarta text-brand-primary group-hover:text-emerald-600 transition-colors">
							{project.achievementsCount}
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
						<Trophy className="h-6 w-6" />
					</div>
				</div>

				<div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-pink-100 transition-all hover:shadow-md">
					<div className="space-y-1">
						<span className="font-plus-jakarta text-[13px] font-bold text-slate-500 uppercase tracking-wider">
							Team Kudos
						</span>
						<p className="text-3xl font-bold font-plus-jakarta text-brand-primary group-hover:text-pink-600 transition-colors">
							{project.kudosCount}
						</p>
					</div>
					<div className="p-3 rounded-2xl bg-pink-50 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
						<Heart className="h-6 w-6 fill-pink-500/10" />
					</div>
				</div>
			</div>

			{/* Activity Feed */}
			<ActivityFeed activities={activities} projectName={project.name} />

			{/* Mobile FAB */}
			<button
				onClick={() => setIsModalOpen(true)}
				className="md:hidden fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center hover:bg-brand-primary/90 active:scale-95 transition-all"
			>
				<Plus className="h-5 w-5" />
			</button>

			<SignalModal
				isOpen={isModalOpen}
				projectId={project.id}
				projectName={project.name}
				onClose={() => setIsModalOpen(false)}
			/>
		</div>
	);
}
