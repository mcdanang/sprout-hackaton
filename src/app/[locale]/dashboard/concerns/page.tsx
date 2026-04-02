import { getConcernFormOptions, getMyConcerns } from "@/app/actions/concerns";
import { MyConcernsClient } from "@/components/dashboard/my-concerns-client";

export default async function ConcernsPage() {
	const [concerns, options] = await Promise.all([getMyConcerns(), getConcernFormOptions()]);

	return (
		<MyConcernsClient
			initialConcerns={concerns}
			organizations={options.organizations}
			employees={options.employees}
		/>
	);
}
