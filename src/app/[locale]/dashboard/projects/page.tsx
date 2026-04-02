import { getTranslations } from "next-intl/server";

import { ProjectCard } from "@/components/dashboard/project-card";
import { getDashboardProjects } from "@/app/actions/projects";

export default async function ProjectsPage() {
	const t = await getTranslations("Projects");
	const projects = await getDashboardProjects();

	return (
		<div className="max-w-5xl mx-auto space-y-12 pb-20">
			{/* Hero Section */}
			<div className="space-y-4">
				<p className="font-plus-jakarta text-[12px] font-semibold leading-[16px] tracking-[1.2px] uppercase text-[#B09100]">
					{t("label")}
				</p>
				<h1 className="font-plus-jakarta text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-brand-primary">
					{t("title")}
				</h1>
				<p className="font-plus-jakarta text-[18px] font-normal leading-[28px] text-dashboard-description max-w-2xl">
					{t("subtitle")}
				</p>
			</div>

			{/* Projects Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{projects.map((project) => (
					<ProjectCard key={project.id} project={project} />
				))}
			</div>
		</div>
	);
}
