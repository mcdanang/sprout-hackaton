import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isAccountPersonaId } from "@/lib/constants/account-switch";
import { ACCOUNT_PERSONA_COOKIE, isAccountSwitchEnabled } from "@/lib/effective-employee";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { userId } = await auth();
	const locale = await getLocale();

	if (!userId) {
		redirect({ href: "/unauthorized", locale });
	}

	const accountSwitchEnabled = isAccountSwitchEnabled();
	const cookieStore = await cookies();
	const raw = cookieStore.get(ACCOUNT_PERSONA_COOKIE)?.value;
	const accountPersona =
		accountSwitchEnabled && raw && isAccountPersonaId(raw) ? raw : null;

	return (
		<DashboardShell accountSwitchEnabled={accountSwitchEnabled} accountPersona={accountPersona}>
			{children}
		</DashboardShell>
	);
}
