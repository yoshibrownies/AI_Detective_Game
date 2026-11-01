# The Shuk Recipe Heist

A detective game built with Next.js (App Router), TypeScript and LangChain.js. The player searches the case files with an AI assistant, interrogates four AI suspects, and makes an accusation.

## Run it locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and add your OpenAI key:

   ```bash
   cp .env.example .env.local
   ```

   Set `OPENAI_API_KEY` in `.env.local`. Never commit that file.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

4. Optional: check that each viewer can only retrieve their own documents. This uses fake embeddings, so no API key is needed:

   ```bash
   node scripts/check-filter.mjs
   ```

## Levels completed

- **Level 1 (Case Assistant): done.** The case files live in `data/case.json` with `visibleTo` metadata. A `MemoryVectorStore` is built once (`lib/store.ts`). The `search_files` tool (`lib/tools.ts`) filters by viewer. The assistant (`lib/agents.ts`) searches as `detective`, cites document IDs, and never names the thief. The Accuse button calls `/api/accuse`, which compares the choice to `lib/solution.ts`. The accusation is a plain route, not an agent tool.
- **Level 2 (Interrogation Room): done.** Four suspect agents (`dani`, `noa`, `yossi`, `maya`) use the same tool factory with their own viewer. Each has a system prompt with personality and rules. The UI shows four suspect cards, and each suspect keeps a separate chat history in the browser.
- **Level 3 (bonus): not done.**

## Verification

- `npm run build` passes.
- `npx tsc --noEmit` passes.
- `node scripts/check-filter.mjs` passes. It shows that each viewer sees exactly the documents they are allowed to see, and that Dani cannot retrieve Maya's private file (X4).
- The full agent loop was tested against a local mock of the OpenAI API (`OPENAI_BASE_URL` pointed at it). Every agent called `search_files` and got back only its own documents: the assistant got no private files, and Dani got B1, S1 and X1 but never X4. The routes returned the model's final answer, and the UI kept a separate history for each suspect. Accusing Maya returned the correct verdict.
- **Not tested with the real OpenAI API:** this environment had no key, so the quality of the real replies was not checked (whether suspects stay in character and follow their REVEAL rules). The model name `gpt-5.4-mini` comes from the assignment brief.

## Something that did not work as expected

The starter code passes the model as a string (`"openai:gpt-5.4-mini"`). Inside Next.js every agent call failed with "Cannot find module as expression is too dynamic". With a string, LangChain loads `@langchain/openai` through a dynamic import, and the Next.js bundler cannot follow it. I changed `lib/agents.ts` to pass a `new ChatOpenAI({ model: "gpt-5.4-mini" })` instance instead, and the agents started working. The routes now also return a JSON error instead of an empty 500, so the chat shows a readable message when something goes wrong.

The production build also failed on `app/page.module.css` with "Selector "button" is not pure." CSS Modules only accept local class names, so the bare `button` rules were rejected. I wrapped those selectors in `:global(...)`, so they apply to every button on the page. The build then passed.

## Project layout

```
app/
  page.tsx                   case board: assistant chat, suspect cards, accuse
  api/assistant/route.ts     POST - Case Assistant
  api/suspect/[id]/route.ts  POST - one suspect (dani | noa | yossi | maya)
  api/accuse/route.ts        POST - checks the accusation
lib/
  store.ts                   builds the vector store once
  tools.ts                   search_files tool factory (filtered by viewer)
  agents.ts                  assistant and suspect agents
  prompts.ts                 system prompts
  solution.ts                answer key (not in the vector store)
data/
  case.json                  all case documents with visibleTo metadata
scripts/
  check-filter.mjs           viewer filter check
```
