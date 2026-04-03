// src/lib/get-current-employee.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveEmployeeRow } from "@/lib/effective-employee";

export type CurrentEmployee = {
	id: string;
	fullName: string;
	roleName: string;
	isTopManagement: boolean;
	projectIds: string[];
};

export async function getCurrentEmployee(): Promise<CurrentEmployee | null> {
	const { userId } = await auth();
	if (!userId) return null;

	const supabase = await createClient();
	const emp = await getEffectiveEmployeeRow(supabase);

	if (!emp) return null;

	const [{ data: role }, { data: links }] = await Promise.all([
		supabase.from("roles").select("name").eq("id", emp.role_id).maybeSingle(),
		supabase.from("employee_projects").select("project_id").eq("employee_id", emp.id),
	]);

	return {
		id: emp.id,
		fullName: emp.full_name,
		roleName: role?.name ?? "",
		isTopManagement: role?.name === "TOP MANAGEMENT",
		projectIds: (links ?? []).map(l => l.project_id),
	};
}
