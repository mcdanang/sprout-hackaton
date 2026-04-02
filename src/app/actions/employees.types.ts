export type EmployeesListFilters = {
	organizationId?: string;
	roleId?: string;
	organizationName?: string;
	roleName?: string;
	onlyActive?: boolean;
	projectId?: string;
};

export type EmployeeRecord = {
	id: string;
	fullName: string;
	email: string;
	jobPosition: string;
	organization: string;
	project: string;
	role: string;
	isActive: boolean;
};

export type EmployeesListResult =
	| { status: "success"; employees: EmployeeRecord[] }
	| { status: "error"; message: string };
