import { getEmployees, getEmployeeFilterOptions } from "@/app/actions/employees";

export default async function Page() {
	return <EmployeesTest />;
}

async function EmployeesTest() {
	const [employeesRes, filterOptionsRes] = await Promise.all([
		getEmployees({ onlyActive: true }),
		getEmployeeFilterOptions(),
	]);

	console.log({ employeesRes, filterOptionsRes });

	return (
		<main className="p-6">
			<h1 className="text-xl font-semibold">Employees Test</h1>

			<h2 className="mt-6 text-sm font-medium">Filter Options</h2>
			<pre className="mt-2 overflow-auto rounded border p-3 text-xs">
				{JSON.stringify(filterOptionsRes, null, 2)}
			</pre>

			<h2 className="mt-6 text-sm font-medium">Employees</h2>
			<pre className="mt-2 overflow-auto rounded border p-3 text-xs">
				{JSON.stringify(employeesRes, null, 2)}
			</pre>
		</main>
	);
}
