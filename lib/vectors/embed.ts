const GEMINI_EMBED_BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Returns the full URL for the Gemini embedding API, including the API key.
 *
 * @returns The Gemini embed endpoint URL as a string.
 * @throws If the GEMINI_API_KEY environment variable is not set.
 */
function getEmbedUrl(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return `${GEMINI_EMBED_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${key}`;
}

/**
 * Fetches the embedding vector for a search query using the Gemini embed API.
 *
 * Use this for the user's message at chat time (`taskType: RETRIEVAL_QUERY`).
 *
 * @param text - The text to embed.
 * @returns A promise that resolves to an array of numbers representing the embedding vector.
 * @throws If the API call fails or returns an invalid response.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(getEmbedUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embeddings failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values) throw new Error("Gemini embed response missing embedding.values");
  return values;
}

/**
 * Fetches embedding vectors for documents (e.g., RAG chunks) using the Gemini embed API.
 *
 * Use this at ingest time (`taskType: RETRIEVAL_DOCUMENT`).  
 * Sends one request per text to match Gemini's embedContent API.
 * For large batches, you could switch to batchEmbedContents later.
 *
 * @param texts - An array of strings, each representing a document or chunk to embed.
 * @returns A promise that resolves to a two-dimensional array of numbers, where each sub-array is an embedding vector.
 * @throws If any API call fails or returns an invalid response.
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const url = getEmbedUrl();
  const results = await Promise.all(
    texts.map(async (text) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_DOCUMENT",
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini embeddings failed: ${res.status} ${err}`);
      }
      const data = (await res.json()) as { embedding?: { values?: number[] } };
      const values = data.embedding?.values;
      if (!values) throw new Error("Gemini embed response missing embedding.values");
      return values;
    })
  );
  return results;
}
