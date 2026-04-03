/**
 * When account switching is enabled, the app loads another employee row from
 * `public.employees` (same real data as signing in as that person). Teams / Clerk
 * stay as the signed-in user; only the effective employee for the UI changes.
 */
export const ACCOUNT_PERSONA_IDS = ["management", "delivery_lead", "staff"] as const;

export type AccountPersonaId = (typeof ACCOUNT_PERSONA_IDS)[number];

/** Seed defaults — override with NEXT_PUBLIC_ACCOUNT_SWITCH_*_EMAIL if needed. */
export const DEFAULT_MANAGEMENT_EMAIL = "arnold.sebastian@sprout.co.id";
export const DEFAULT_SQUAD_LEAD_EMAIL = "reynaldo.damara@sprout.co.id";

export function isAccountPersonaId(value: string): value is AccountPersonaId {
	return (ACCOUNT_PERSONA_IDS as readonly string[]).includes(value);
}

export function impersonationEmailForPersona(persona: AccountPersonaId): string | null {
	if (persona === "management") {
		return (
			process.env.NEXT_PUBLIC_ACCOUNT_SWITCH_MANAGEMENT_EMAIL?.trim() || DEFAULT_MANAGEMENT_EMAIL
		);
	}
	if (persona === "delivery_lead") {
		return process.env.NEXT_PUBLIC_ACCOUNT_SWITCH_SQUAD_LEAD_EMAIL?.trim() || DEFAULT_SQUAD_LEAD_EMAIL;
	}
	// Staff: optional explicit email; otherwise resolved by role STAFF in DB
	return process.env.NEXT_PUBLIC_ACCOUNT_SWITCH_STAFF_EMAIL?.trim() || null;
}
