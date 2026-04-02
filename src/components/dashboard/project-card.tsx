"use client";

import Image from "next/image";
import { AlertCircle, Trophy, ArrowRight, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import Link from "next/link";
import { Project } from "@/lib/types/project";
import { healthStyles } from "@/lib/constants/project-ui";
import { useTranslations } from "next-intl";

interface ProjectCardProps {
	project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
	const t = useTranslations("Dashboard");

	return (
		<Link
			href={`/dashboard/projects/${project.id}`}
			className="group relative block bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
		>
			{/* Background Glow Effect on Hover */}
			<div className="absolute -inset-1 bg-linear-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl" />

			{/* Rotating Border on Hover */}
			<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
				<div className="absolute -inset-full [background:conic-gradient(from_0deg,transparent_0_80%,#FFD300_100%)] animate-[border-rotate_4s_linear_infinite]" />
				<div className="absolute inset-px bg-white rounded-[31px]" />
			</div>

			<div className="relative z-10 space-y-6">
				{/* Top Section: Team */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<ArrowRight className="h-4 w-4 text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
					</div>

					<div className="flex -space-x-2">
						{project.team.slice(0, 3).map((member, i) => (
							<div
								key={i}
								className="relative h-8 w-8 rounded-full border-2 border-white overflow-hidden shadow-sm ring-1 ring-slate-100 bg-slate-100 flex items-center justify-center"
							>
								{member.avatar ? (
									<Image src={member.avatar} alt={member.name} fill className="object-cover" />
								) : (
									<User className="h-4 w-4 text-slate-400" />
								)}
							</div>
						))}
						{project.team.length > 3 && (
							<div className="h-8 w-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 ring-1 ring-slate-100">
								+{project.team.length - 3}
							</div>
						)}
					</div>
				</div>

				{/* Project Title & Description */}
				<div className="space-y-2">
					<h3 className="font-plus-jakarta text-xl font-bold text-brand-primary tracking-tight transition-colors group-hover:text-black">
						{project.name}
					</h3>
					<p className="font-plus-jakarta text-sm text-slate-500 line-clamp-2 leading-relaxed">
						{project.description}
					</p>
				</div>

				{/* Health Progress Section */}
				<div className="space-y-3 pt-2">
					<div className="flex justify-between items-end">
						<div className="flex flex-col gap-0.5">
							<span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 transition-colors group-hover:text-slate-500">
								Team Pulse
							</span>
							<span className="text-sm font-bold font-plus-jakarta text-slate-900">
								{project.healthStatus}
							</span>
						</div>
					</div>
					<Progress value={project.health} className="h-2 w-full overflow-hidden rounded-full">
						<ProgressTrack className="h-full w-full bg-slate-50">
							<ProgressIndicator
								className={cn(
									"h-full transition-all duration-1000",
									healthStyles[project.healthStatus],
								)}
							/>
						</ProgressTrack>
					</Progress>
				</div>

				{/* Project Metrics: Icon Only Refinement */}
				<div className="flex items-center gap-6 pt-2 border-t border-slate-50 group-hover:border-slate-100 transition-colors">
					<div className="flex items-center gap-2 group/metric">
						<div className="p-2 rounded-xl bg-red-50 text-red-500 transition-colors group-hover/metric:bg-red-500 group-hover/metric:text-white">
							<AlertCircle className="h-4 w-4" />
						</div>
						<span className="text-sm font-bold font-plus-jakarta text-slate-700">
							{project.concernsCount}
						</span>
					</div>

					<div className="flex items-center gap-2 group/metric">
						<div className="p-2 rounded-xl bg-emerald-50 text-emerald-500 transition-colors group-hover/metric:bg-emerald-500 group-hover/metric:text-white">
							<Trophy className="h-4 w-4" />
						</div>
						<span className="text-sm font-bold font-plus-jakarta text-slate-700">
							{project.achievementsCount}
						</span>
					</div>

					<div className="flex items-center gap-2 group/metric">
						<div className="p-2 rounded-xl bg-pink-50 text-pink-500 transition-colors group-hover/metric:bg-pink-500 group-hover/metric:text-white">
							<Heart className="h-4 w-4 fill-pink-500/10 group-hover/metric:fill-white" />
						</div>
						<span className="text-sm font-bold font-plus-jakarta text-slate-700">
							{project.kudosCount}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
