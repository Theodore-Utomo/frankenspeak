import { config } from "dotenv";
import { readdir, readFile } from "fs/promises";
import path from "path";
import {
  chunkMarkdown,
  getEmbeddings,
  saveVectorStore,
  type Chunk,
  type ChunkInput,
} from "../lib/vectors";

const CONTENT_DIR = path.join(process.cwd(), "content", "cat");

async function main() {
  config({ path: path.join(process.cwd(), ".env") });

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("GEMINI_API_KEY is not set. Add it to .env.local and run again.");
    process.exit(1);
  }

  let files: string[];
  try {
    files = await readdir(CONTENT_DIR);
  } catch (err) {
    console.error("Could not read content/cat:", err);
    process.exit(1);
  }

  // Just have md files for now, maybe add txt later
  const mdFiles = files.filter((f) => f.endsWith(".md"));
  if (mdFiles.length === 0) {
    console.warn("No .md files in content/cat. Add some, then run ingest again.");
    await saveVectorStore([]);
    console.log("Wrote empty lib/vectors/cat-vectors.json");
    return;
  }

  const allInputs: ChunkInput[] = [];

  for (const file of mdFiles) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = await readFile(filePath, "utf-8");
    const inputs = chunkMarkdown(content, file);
    allInputs.push(...inputs);
  }

  if (allInputs.length === 0) {
    console.warn("No chunks produced. Check that your markdown has content.");
    await saveVectorStore([]);
    return;
  }

  console.log(`Embedding ${allInputs.length} chunks...`);
  const texts = allInputs.map((i) => i.text);
  const embeddings = await getEmbeddings(texts);

  const chunks: Chunk[] = allInputs.map((input, i) => ({
    text: input.text,
    embedding: embeddings[i],
    source: input.source ?? "",
  }));

  await saveVectorStore(chunks);
  console.log(`Saved ${chunks.length} chunks to lib/vectors/cat-vectors.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
