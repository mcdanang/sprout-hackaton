import { getEmployees, getEmployeeFilterOptions } from "@/app/actions/employees";
import { initialSignalActionState } from "@/app/actions/signal.types";
import { createSignal, getSignals } from "@/app/actions/signals";

export default async function Page() {
	return <SignalsTest />;
}

async function SignalsTest() {
	const [signalsRes, employeesRes, filterOptionsRes] = await Promise.all([
		getSignals().catch(e => {
			console.error(e);
			return [];
		}),
		getEmployees({ onlyActive: true }),
		getEmployeeFilterOptions(),
	]);

	const employees = employeesRes.status === "success" ? employeesRes.employees : [];

	const roles = filterOptionsRes.roles;
	const projects = filterOptionsRes.projects;

	const defaultAuthorEmployeeId = employees[0]?.id ?? "";
	const defaultTargetRoleId = roles[0]?.id ?? "";
	const defaultTargetEmployeeId = employees[1]?.id ?? employees[0]?.id ?? "";

	if (employees.length === 0 || roles.length === 0) {
		return (
			<main className="p-6">
				<h1 className="text-xl font-semibold">Signals Test</h1>
				<p className="mt-4 rounded border p-3 text-sm">
					No employees/roles found. Make sure you re-ran your Supabase `supabase/init.sql` and that
					the tables are populated.
				</p>
			</main>
		);
	}

	const submitSignal = async (formData: FormData) => {
		"use server";
		const signal = await createSignal(initialSignalActionState, formData);
		console.log({ signal });
		return signal;
	};

	return (
		<main className="p-6">
			<h1 className="text-xl font-semibold">Signals Test</h1>

			<section className="mt-6 rounded border p-4">
				<h2 className="text-lg font-medium">Create Signal</h2>

				<form action={submitSignal} className="mt-4 space-y-3">
					<div className="grid gap-2">
						<label className="text-sm font-medium">Category</label>
						<select name="category" defaultValue="concern" className="rounded border px-3 py-2">
							<option value="concern">concern</option>
							<option value="achievement">achievement</option>
							<option value="appreciation">appreciation</option>
						</select>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium">Title</label>
						<input
							type="text"
							name="title"
							placeholder="Example: Risk in API dependency"
							className="rounded border px-3 py-2"
							defaultValue=""
						/>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium">Details</label>
						<textarea
							name="details"
							placeholder="Add enough context so others can take action."
							className="rounded border px-3 py-2"
							rows={4}
							defaultValue=""
						/>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium">Project scope</label>
						<select name="projectId" defaultValue="" className="rounded border px-3 py-2">
							<option value="">General (company-wide)</option>
							{projects.map(p => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium">Author (employee)</label>
						<select
							name="authorEmployeeId"
							defaultValue={defaultAuthorEmployeeId}
							className="rounded border px-3 py-2"
						>
							{employees.map(e => (
								<option key={e.id} value={e.id}>
									{e.fullName} ({e.role})
								</option>
							))}
						</select>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium">Send to</label>
						<select name="targetType" defaultValue="all" className="rounded border px-3 py-2">
							<option value="all">all employees</option>
							<option value="role">all employees in role</option>
							<option value="employee">specific employee</option>
						</select>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium">Target role (used when targetType=role)</label>
						<select
							name="targetRoleId"
							defaultValue={defaultTargetRoleId}
							className="rounded border px-3 py-2"
						>
							{roles.map(r => (
								<option key={r.id} value={r.id}>
									{r.name}
								</option>
							))}
						</select>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium">
							Target employee (used when targetType=employee)
						</label>
						<select
							name="targetEmployeeId"
							defaultValue={defaultTargetEmployeeId}
							className="rounded border px-3 py-2"
						>
							{employees.map(e => (
								<option key={e.id} value={e.id}>
									{e.fullName}
								</option>
							))}
						</select>
					</div>

					<div className="flex items-center gap-3">
						<label className="flex items-center gap-2 text-sm">
							<input type="checkbox" name="isAnonymous" value="on" />
							Submit as anonymous
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input type="checkbox" name="isPublic" value="on" />
							Public within scope
						</label>
					</div>

					<button type="submit" className="rounded bg-black px-4 py-2 text-white">
						Create Signal
					</button>
				</form>
			</section>

			<h2 className="mt-6 text-sm font-medium">Signals</h2>
			<pre className="mt-2 overflow-auto rounded border p-3 text-xs">
				{JSON.stringify(signalsRes, null, 2)}
			</pre>
		</main>
	);
}
