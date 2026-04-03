import { getMyConcerns } from "@/app/actions/concerns";
import { MyConcernsClient } from "@/components/dashboard/my-concerns-client";

export default async function ConcernsPage() {
	const concerns = await getMyConcerns();

	return (
		<MyConcernsClient initialConcerns={concerns} />
	);
}
