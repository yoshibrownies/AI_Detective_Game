import { SOLUTION } from "@/lib/solution";
import { SUSPECTS, type SuspectId } from "@/lib/agents";

// The accusation is a plain route, not an agent tool. If an agent could call
// it, the agent could try every name until one was correct.
export async function POST(req: Request) {
  const { suspect } = await req.json();

  if (!SUSPECTS.includes(suspect as SuspectId)) {
    return Response.json({ error: "Unknown suspect" }, { status: 400 });
  }

  const correct = suspect === SOLUTION.culprit;

  return Response.json({
    correct,
    message: correct
      ? "Case closed. Maya Katz took the notebook. Well done, detective."
      : "Wrong suspect. The notebook is still missing. Check the evidence again.",
  });
}
