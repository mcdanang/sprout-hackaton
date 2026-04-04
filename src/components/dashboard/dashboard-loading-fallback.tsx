import { Loader2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function DashboardLoadingFallback() {
	const t = await getTranslations("Common");
	return (
		<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-16">
			<Loader2 className="h-10 w-10 animate-spin text-[#B09100]" aria-hidden />
			<p className="text-center text-sm font-medium text-slate-500">{t("loadingDashboard")}</p>
		</div>
	);
}
