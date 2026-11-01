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
  const { messages } = await req.json().catch(() => ({}));
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages must be a non-empty array" }, { status: 400 });
  }

  try {
    const result = await getSuspect(id as SuspectId).invoke({ messages });
    return Response.json({ reply: result.messages.at(-1)?.text });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "The suspect could not answer. Check the server logs." }, { status: 500 });
  }
}
