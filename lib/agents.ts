import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { makeSearchTool } from "./tools";
import { ASSISTANT_PROMPT, suspectPrompt } from "./prompts";

// Pass a model instance, not a "provider:model" string. The string form makes
// LangChain load the provider with a dynamic import that the Next.js bundler
// cannot resolve ("Cannot find module as expression is too dynamic").
const MODEL = new ChatOpenAI({ model: "gpt-5.4-mini" }); // any chat model your key supports

export const assistant = createAgent({
  model: MODEL,
  tools: [makeSearchTool("detective")],
  systemPrompt: ASSISTANT_PROMPT,
});

export const SUSPECTS = ["dani", "noa", "yossi", "maya"] as const;
export type SuspectId = (typeof SUSPECTS)[number];

const cache = new Map<SuspectId, ReturnType<typeof createAgent>>();

export function getSuspect(id: SuspectId) {
  if (!cache.has(id)) {
    cache.set(
      id,
      createAgent({
        model: MODEL,
        tools: [makeSearchTool(id)],
        systemPrompt: suspectPrompt(id),
      })
    );
  }
  return cache.get(id)!;
}
