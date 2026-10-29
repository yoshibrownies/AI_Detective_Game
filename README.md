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
- **Not tested:** the live chat and suspect replies. There was no OpenAI key in this environment, so the model calls were not run. The model name `openai:gpt-5.4-mini` comes from the assignment brief and was not checked against the API.

## Something that did not work as expected

The production build failed on `app/page.module.css` with "Selector "button" is not pure." CSS Modules only accept local class names, so the bare `button` rules were rejected. I wrapped those selectors in `:global(...)`, so they apply to every button on the page. The build then passed.

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
