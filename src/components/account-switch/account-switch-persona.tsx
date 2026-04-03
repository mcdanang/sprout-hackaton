"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { clearAccountPersona, setAccountPersona } from "@/app/actions/account-switch";
import { type AccountPersonaId, isAccountPersonaId } from "@/lib/constants/account-switch";
import { cn } from "@/lib/utils";

export function AccountSwitchPersona({
	accountSwitchEnabled,
	initialPersona,
	isCollapsed,
}: {
	accountSwitchEnabled: boolean;
	initialPersona: AccountPersonaId | null;
	isCollapsed: boolean;
}) {
	const router = useRouter();
	const t = useTranslations("AccountSwitch");

	if (!accountSwitchEnabled) return null;

	async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const v = e.target.value;
		if (v === "") {
			await clearAccountPersona();
		} else if (isAccountPersonaId(v)) {
			await setAccountPersona(v);
		}
		router.refresh();
	}

	return (
		<div className={cn("mb-4 w-full min-w-0", isCollapsed && "px-0")}>
			<p
				className={cn(
					"mb-1.5 font-semibold uppercase tracking-wide text-slate-400",
					isCollapsed ? "text-center text-[9px]" : "text-[10px]",
				)}
			>
				{isCollapsed ? "As" : t("personaLabel")}
			</p>
			<select
				value={initialPersona ?? ""}
				onChange={onChange}
				title={t("personaLabel")}
				className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-left text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FFD300]/40"
			>
				<option value="">{t("useSignedInUser")}</option>
				<option value="management">{t("management")}</option>
				<option value="delivery_lead">{t("deliveryLead")}</option>
				<option value="staff">{t("staff")}</option>
			</select>
			{!isCollapsed ? (
				<p className="mt-1.5 text-[11px] leading-snug text-slate-400">{t("hint")}</p>
			) : null}
		</div>
	);
}
