import { getMyConcerns, getTeamConcerns } from "@/app/actions/concerns";
import { MyConcernsClient } from "@/components/dashboard/my-concerns-client";

export default async function ConcernsPage() {
  const [myConcerns, teamConcerns] = await Promise.all([
    getMyConcerns(),
    getTeamConcerns(),
  ]);

  return (
    <MyConcernsClient
      initialConcerns={myConcerns}
      initialTeamConcerns={teamConcerns}
    />
  );
}
