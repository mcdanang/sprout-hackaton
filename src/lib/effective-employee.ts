import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import {
	impersonationEmailForPersona,
	type AccountPersonaId,
	isAccountPersonaId,
} from "@/lib/constants/account-switch";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export const ACCOUNT_PERSONA_COOKIE = "signal-account-persona";

export function isAccountSwitchEnabled(): boolean {
	return (
		process.env.NEXT_PUBLIC_ENABLE_ACCOUNT_SWITCH === "true" ||
		process.env.NEXT_PUBLIC_DEMO_MODE === "true"
	);
}

export async function getAccountPersonaFromCookie(): Promise<AccountPersonaId | null> {
	if (!isAccountSwitchEnabled()) return null;
	const cookieStore = await cookies();
	const raw = cookieStore.get(ACCOUNT_PERSONA_COOKIE)?.value;
	if (!raw || !isAccountPersonaId(raw)) return null;
	return raw;
}

export async function resolveEmployeeIdForPersona(
	supabase: SupabaseServer,
	persona: AccountPersonaId,
): Promise<string | null> {
	const email = impersonationEmailForPersona(persona);
	if (email) {
		const { data } = await supabase
			.from("employees")
			.select("id")
			.ilike("email", email.toLowerCase())
			.maybeSingle();
		if (data?.id) return data.id;
	}

	const { data: role } = await supabase.from("roles").select("id").eq("name", "STAFF").maybeSingle();
	if (!role?.id) return null;

	const { data: emp } = await supabase
		.from("employees")
		.select("id")
		.eq("role_id", role.id)
		.limit(1)
		.maybeSingle();

	return emp?.id ?? null;
}

function orderedEmailsFromUser(user: Awaited<ReturnType<typeof currentUser>>): string[] {
	if (!user) return [];
	const primaryEmailId = user.primaryEmailAddressId;
	const ordered: string[] = [];

	if (primaryEmailId) {
		const primary = user.emailAddresses.find(e => e.id === primaryEmailId)?.emailAddress;
		if (primary) ordered.push(primary);
	}

	for (const e of user.emailAddresses) {
		if (!ordered.includes(e.emailAddress)) {
			ordered.push(e.emailAddress);
		}
	}

	return ordered;
}

/**
 * Effective `employees` row for the session: optional account switch (cookie) overrides
 * the row that would match the signed-in Clerk user.
 */
export async function getEffectiveEmployeeRow(
	supabase: SupabaseServer,
): Promise<{ id: string; full_name: string; role_id: string | null } | null> {
	const { userId } = await auth();
	if (!userId) return null;

	const persona = await getAccountPersonaFromCookie();
	if (persona && isAccountSwitchEnabled()) {
		const empId = await resolveEmployeeIdForPersona(supabase, persona);
		if (empId) {
			const { data } = await supabase
				.from("employees")
				.select("id, full_name, role_id")
				.eq("id", empId)
				.maybeSingle();
			if (data) return data;
		}
	}

	let { data: emp } = await supabase
		.from("employees")
		.select("id, full_name, role_id")
		.eq("auth_id", userId)
		.maybeSingle();

	if (!emp) {
		const user = await currentUser();
		for (const rawEmail of orderedEmailsFromUser(user)) {
			const normalizedEmail = rawEmail.trim().toLowerCase();
			if (!normalizedEmail) continue;

			const { data: byEmail } = await supabase
				.from("employees")
				.select("id, full_name, role_id")
				.ilike("email", normalizedEmail)
				.maybeSingle();

			if (byEmail) {
				emp = byEmail;
				break;
			}
		}
	}

	return emp ?? null;
}
