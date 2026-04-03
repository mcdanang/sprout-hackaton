"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { setAccountPersona } from "@/app/actions/account-switch";
import type { AccountPersonaId } from "@/lib/constants/account-switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const personaButtonClass = (active: boolean) =>
	cn(
		"min-w-28 rounded-full font-medium transition-colors",
		active
			? "border-transparent bg-[#FFD300] text-[#282828] font-bold shadow-sm hover:bg-[#FFD300]/90"
			: "border-slate-200 bg-background hover:bg-slate-50",
	);

export function AccountSwitchLogin({
	initialPersona,
}: {
	initialPersona: AccountPersonaId | null;
}) {
	const t = useTranslations("AccountSwitch");
	const [selected, setSelected] = useState<AccountPersonaId | null>(initialPersona);

	useEffect(() => {
		setSelected(initialPersona);
	}, [initialPersona]);

	async function pick(persona: AccountPersonaId) {
		const r = await setAccountPersona(persona);
		if (r.ok) {
			setSelected(persona);
			toast.success(t("loginSaved"));
		}
	}

	return (
		<div className="mt-8 border-t border-border pt-6">
			<p className="text-center text-xs text-muted-foreground">{t("loginHint")}</p>
			<div className="mt-4 flex flex-wrap items-center justify-center gap-2">
				<Button
					type="button"
					variant="outline"
					className={personaButtonClass(selected === "management")}
					onClick={() => pick("management")}
					aria-pressed={selected === "management"}
				>
					{t("management")}
				</Button>
				<Button
					type="button"
					variant="outline"
					className={personaButtonClass(selected === "delivery_lead")}
					onClick={() => pick("delivery_lead")}
					aria-pressed={selected === "delivery_lead"}
				>
					{t("deliveryLead")}
				</Button>
				<Button
					type="button"
					variant="outline"
					className={personaButtonClass(selected === "staff")}
					onClick={() => pick("staff")}
					aria-pressed={selected === "staff"}
				>
					{t("staff")}
				</Button>
			</div>
		</div>
	);
}
