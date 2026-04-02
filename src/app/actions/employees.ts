"use server";

import { createClient } from "@/lib/supabase/server";

import {
	type EmployeeRecord,
	type EmployeesListFilters,
	type EmployeesListResult,
} from "./employees.types";

function unique<T>(arr: T[]): T[] {
	return Array.from(new Set(arr));
}

async function resolveIdByName(params: {
	supabase: Awaited<ReturnType<typeof createClient>>;
	table: "organizations" | "roles" | "projects";
	name: string;
}): Promise<string | undefined> {
	const { data, error } = await params.supabase
		.from(params.table)
		.select("id")
		.eq("name", params.name)
		.maybeSingle();

	if (error) return undefined;
	return data?.id ?? undefined;
}

export async function getEmployees(filters?: EmployeesListFilters) {
	const supabase = await createClient();

	let organizationId: string | null | undefined = filters?.organizationId;
	let roleId: string | null | undefined = filters?.roleId;

	if (!organizationId && filters?.organizationName) {
		organizationId = await resolveIdByName({
			supabase,
			table: "organizations",
			name: filters.organizationName,
		});
	}

	if (!roleId && filters?.roleName) {
		roleId = await resolveIdByName({
			supabase,
			table: "roles",
			name: filters.roleName,
		});
	}

	// If name filters were provided but didn't resolve, return empty.
	if (filters?.organizationName && !organizationId) {
		return { status: "success", employees: [] } satisfies EmployeesListResult;
	}
	if (filters?.roleName && !roleId) {
		return { status: "success", employees: [] } satisfies EmployeesListResult;
	}

	const projectFilter = filters?.projectId;
	const selectProjects = projectFilter
		? "employee_projects!inner(project_id)"
		: "employee_projects(project_id)";

	let query = supabase
		.from("employees")
		.select(
			`id, full_name, email, job_position, organization_id, role_id, is_active, ${selectProjects}`,
		)
		.order("full_name", { ascending: true });

	if (filters?.onlyActive) query = query.eq("is_active", true);
	if (organizationId) query = query.eq("organization_id", organizationId);
	if (roleId) query = query.eq("role_id", roleId);
	if (projectFilter) query = query.eq("employee_projects.project_id", projectFilter);

	const { data: employees, error } = await query;

	if (error || !employees) {
		return {
			status: "error",
			message: error?.message ?? "Failed to load employees.",
		} satisfies EmployeesListResult;
	}

	if (employees.length === 0) {
		return { status: "success", employees: [] } satisfies EmployeesListResult;
	}

	const organizationIds = unique(employees.map(e => e.organization_id));
	const projectIds = unique(
		employees.flatMap(e => {
			const links = e.employee_projects as { project_id: string }[] | null | undefined;
			return (links ?? []).map(l => l.project_id);
		}),
	);
	const roleIds = unique(employees.map(e => e.role_id));

	const [{ data: orgs }, { data: projects }, { data: roles }] = await Promise.all([
		supabase.from("organizations").select("id, name").in("id", organizationIds),
		supabase.from("projects").select("id, name").in("id", projectIds),
		supabase.from("roles").select("id, name").in("id", roleIds),
	]);

	const orgById = new Map((orgs ?? []).map(o => [o.id, o.name]));
	const projectById = new Map((projects ?? []).map(p => [p.id, p.name]));
	const roleById = new Map((roles ?? []).map(r => [r.id, r.name]));

	const result: EmployeeRecord[] = employees.map(e => {
		const links = e.employee_projects as { project_id: string }[] | null | undefined;
		const names = (links ?? [])
			.map(l => projectById.get(l.project_id))
			.filter(Boolean) as string[];
		return {
			id: e.id,
			fullName: e.full_name,
			email: e.email,
			jobPosition: e.job_position,
			organization: orgById.get(e.organization_id) ?? "",
			projects: names.length ? names.sort().join(", ") : "",
			role: roleById.get(e.role_id) ?? "",
			isActive: e.is_active,
		};
	});

	return { status: "success", employees: result } satisfies EmployeesListResult;
}

export async function getEmployeeFilterOptions() {
	const supabase = await createClient();

	const [{ data: organizations }, { data: roles }, { data: projects }] = await Promise.all([
		supabase.from("organizations").select("id, name").order("name"),
		supabase.from("roles").select("id, name").order("name"),
		supabase.from("projects").select("id, name").order("name"),
	]);

	return {
		organizations: organizations ?? [],
		roles: roles ?? [],
		projects: projects ?? [],
	};
}
