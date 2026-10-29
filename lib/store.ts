import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import caseFiles from "@/data/case.json";

// Build the store once and reuse the same promise for every request.
let storePromise: Promise<MemoryVectorStore> | null = null;

export function getStore() {
  if (!storePromise) {
    storePromise = (async () => {
      const store = new MemoryVectorStore(
        new OpenAIEmbeddings({ model: "text-embedding-3-small" })
      );
      await store.addDocuments(
        caseFiles.map((f) => ({
          pageContent: f.content,
          metadata: { id: f.id, title: f.title, visibleTo: f.visibleTo },
        }))
      );
      return store;
    })();
  }
  return storePromise;
}
