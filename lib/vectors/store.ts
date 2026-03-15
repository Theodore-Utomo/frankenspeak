import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { Chunk, VectorStore } from "./types";

const VECTORS_FILENAME = "cat-vectors.json";

/**
 * Returns the full file path to the vector store JSON file.
 *
 * @returns The absolute path to the vector store file on disk.
 */
function getVectorsPath(): string {
  return path.join(process.cwd(), "lib", "vectors", VECTORS_FILENAME);
}

/**
 * Loads the vector store from disk, parsing the JSON file and returning the array of chunks.
 *
 * @returns A promise that resolves to an array of Chunk objects loaded from the vector store.
 * @throws If the file cannot be read or parsed.
 */
export async function loadVectorStore(): Promise<Chunk[]> {
  const filePath = getVectorsPath();
  const raw = await readFile(filePath, "utf-8");
  const store = JSON.parse(raw) as VectorStore;
  return store.chunks;
}

/**
 * Saves an array of Chunk objects to disk as a vector store JSON file.
 *
 * @param chunks - The array of Chunk objects to be saved.
 * @returns A promise that resolves when the file has been written.
 * @throws If the file cannot be written.
 */
export async function saveVectorStore(chunks: Chunk[]): Promise<void> {
  const filePath = getVectorsPath();
  const store: VectorStore = { chunks };
  await writeFile(filePath, JSON.stringify(store, null, 2), "utf-8");
}
