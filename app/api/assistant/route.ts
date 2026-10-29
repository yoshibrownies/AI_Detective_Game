import { assistant } from "@/lib/agents";

export async function POST(req: Request) {
  // messages = [{ role: "user" | "assistant", content: string }, ...]
  const { messages } = await req.json();

  const result = await assistant.invoke({ messages });
  return Response.json({ reply: result.messages.at(-1)?.text });
}
