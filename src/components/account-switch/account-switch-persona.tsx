"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

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
	const [isPending, setIsPending] = useState(false);

	if (!accountSwitchEnabled) return null;

	async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const v = e.target.value;
		setIsPending(true);
		try {
			if (v === "") {
				await clearAccountPersona();
			} else if (isAccountPersonaId(v)) {
				await setAccountPersona(v);
			}
			router.refresh();
		} finally {
			setIsPending(false);
		}
	}

	return (
		<div
			className={cn("mb-4 w-full min-w-0", isCollapsed && "px-0")}
			aria-busy={isPending}
		>
			<div className="mb-1.5 flex items-center justify-between gap-2">
				<p
					className={cn(
						"font-semibold uppercase tracking-wide text-slate-400",
						isCollapsed ? "text-center text-[9px] flex-1" : "text-[10px]",
					)}
				>
					{isCollapsed ? "As" : t("personaLabel")}
				</p>
				{isPending ? (
					<span className="flex items-center gap-1 text-[10px] font-medium text-[#B09100]">
						<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
						<span className={cn(isCollapsed && "sr-only")}>{t("switching")}</span>
					</span>
				) : null}
			</div>
			<select
				value={initialPersona ?? ""}
				onChange={onChange}
				disabled={isPending}
				title={t("personaLabel")}
				className={cn(
					"w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-left text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FFD300]/40",
					isPending && "cursor-wait opacity-60",
				)}
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
