import { getSuspect, SUSPECTS, type SuspectId } from "@/lib/agents";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!SUSPECTS.includes(id as SuspectId)) {
    return Response.json({ error: "Unknown suspect" }, { status: 404 });
  }

  // messages = [{ role: "user" | "assistant", content: string }, ...]
  const { messages } = await req.json();

  const result = await getSuspect(id as SuspectId).invoke({ messages });
  return Response.json({ reply: result.messages.at(-1)?.text });
}
