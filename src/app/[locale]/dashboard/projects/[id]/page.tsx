import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getProjectDetail } from "@/app/actions/projects";
import { ProjectDetailClient } from "@/components/dashboard/project-detail-client";

export default async function ProjectDetailPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>;
}) {
	const { id, locale } = await params;
	const { project, activities } = await getProjectDetail(id);
	if (!project) {
		const t = await getTranslations("ProjectDetail");
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<p className="text-slate-500 font-plus-jakarta">Project not found</p>
				<Link
					href={`/${locale}/dashboard/projects`}
					className="text-brand-primary font-bold hover:underline"
				>
					{t("back")}
				</Link>
			</div>
		);
	}

	return <ProjectDetailClient project={project} activities={activities} />;
}
