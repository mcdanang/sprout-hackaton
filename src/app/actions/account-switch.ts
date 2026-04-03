"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { ACCOUNT_PERSONA_COOKIE, isAccountSwitchEnabled } from "@/lib/effective-employee";
import { isAccountPersonaId, type AccountPersonaId } from "@/lib/constants/account-switch";

const cookieOptions = {
	path: "/",
	maxAge: 60 * 60 * 24 * 7,
	sameSite: "lax" as const,
	secure: process.env.NODE_ENV === "production",
};

export async function setAccountPersona(persona: string) {
	if (!isAccountSwitchEnabled() || !isAccountPersonaId(persona)) {
		return { ok: false as const };
	}
	const store = await cookies();
	store.set(ACCOUNT_PERSONA_COOKIE, persona as AccountPersonaId, cookieOptions);
	revalidatePath("/", "layout");
	return { ok: true as const };
}

export async function clearAccountPersona() {
	if (!isAccountSwitchEnabled()) {
		return { ok: false as const };
	}
	const store = await cookies();
	store.delete(ACCOUNT_PERSONA_COOKIE);
	revalidatePath("/", "layout");
	return { ok: true as const };
}
