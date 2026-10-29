// Checks that each viewer can only retrieve documents whose visibleTo includes them.
// Uses fake embeddings, so it runs without an OpenAI key.
// Run with: node scripts/check-filter.mjs
import { readFile } from "node:fs/promises";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { FakeEmbeddings } from "@langchain/core/utils/testing";

const caseFiles = JSON.parse(await readFile(new URL("../data/case.json", import.meta.url), "utf8"));

const store = new MemoryVectorStore(new FakeEmbeddings());
await store.addDocuments(
  caseFiles.map((f) => ({
    pageContent: f.content,
    metadata: { id: f.id, title: f.title, visibleTo: f.visibleTo },
  }))
);

const viewers = ["detective", "dani", "noa", "yossi", "maya"];
let failures = 0;

for (const viewer of viewers) {
  // Ask for every document (k = total) so the filter is the only thing limiting results.
  const docs = await store.similaritySearch("notebook", caseFiles.length, (doc) =>
    doc.metadata.visibleTo.includes(viewer)
  );
  const ids = docs.map((d) => d.metadata.id).sort();
  const expected = caseFiles
    .filter((f) => f.visibleTo.includes(viewer))
    .map((f) => f.id)
    .sort();

  const leaked = ids.filter((id) => !expected.includes(id));
  const missing = expected.filter((id) => !ids.includes(id));

  if (leaked.length || missing.length) {
    failures++;
    console.log(`FAIL ${viewer}: leaked=[${leaked}] missing=[${missing}]`);
  } else {
    console.log(`OK   ${viewer}: ${ids.join(", ")}`);
  }
}

// The specific case from the brief: Dani must never retrieve Maya's private file.
const daniDocs = await store.similaritySearch("Maya private file truth", caseFiles.length, (doc) =>
  doc.metadata.visibleTo.includes("dani")
);
if (daniDocs.some((d) => d.metadata.id === "X4")) {
  failures++;
  console.log("FAIL dani can retrieve X4 (Maya's private file)");
} else {
  console.log("OK   dani cannot retrieve X4 (Maya's private file)");
}

if (failures) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("All filter checks passed");
