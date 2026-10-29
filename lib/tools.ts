import { tool } from "langchain";
import * as z from "zod";
import { getStore } from "./store";

// One tool factory for every agent. The viewer decides which documents
// the search can return, so each agent only sees what it is allowed to see.
export function makeSearchTool(viewer: string) {
  return tool(
    async ({ query }) => {
      const store = await getStore();

      const docs = await store.similaritySearch(query, 4, (doc) =>
        doc.metadata.visibleTo.includes(viewer) // the key line
      );

      if (docs.length === 0) return "No documents found.";

      return docs
        .map((d) => `[${d.metadata.id}] ${d.metadata.title}\n${d.pageContent}`)
        .join("\n\n");
    },
    {
      name: "search_files",
      description: "Search the documents you have access to. Use it before answering.",
      schema: z.object({ query: z.string().describe("What to look for") }),
    }
  );
}
