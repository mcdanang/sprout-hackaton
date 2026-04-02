// src/lib/get-current-employee.ts
"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

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

  let { data: emp } = await supabase
    .from("employees")
    .select("id, full_name, role_id")
    .eq("auth_id", userId)
    .maybeSingle();

  if (!emp) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (email) {
      const { data: byEmail } = await supabase
        .from("employees")
        .select("id, full_name, role_id")
        .eq("email", email)
        .maybeSingle();
      if (byEmail) emp = byEmail;
    }
  }

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
