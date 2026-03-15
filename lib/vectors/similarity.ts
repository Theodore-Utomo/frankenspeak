import type { Chunk, ScoredChunk } from "./types";

/**
 * Computes the cosine similarity between two vectors.
 *
 * Cosine similarity is defined as the dot product of the two vectors divided by the product
 * of their magnitudes. The result is a value between -1 and 1, where 1 means the vectors
 * are identical in direction, 0 means they are orthogonal, and -1 means they are
 * diametrically opposed.
 *
 * @param a - The first input vector.
 * @param b - The second input vector.
 * @returns The cosine similarity between vectors a and b.
 * @throws Will throw an error if the vectors are not of the same length.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const product = Math.sqrt(normA) * Math.sqrt(normB);
  if (product === 0) return 0;
  return dot / product;
}

/**
 * Finds the top-k most similar chunks to a provided query embedding using cosine similarity.
 *
 * Each chunk is scored by computing its cosine similarity to the query embedding.
 * The function returns the top k chunks with the highest similarity score, in descending order.
 *
 * @param queryEmbedding - The embedding vector representing the query.
 * @param chunks - An array of Chunk objects to compare against the query.
 * @param k - The number of most similar chunks to return.
 * @returns An array of ScoredChunk objects representing the k most similar chunks,
 *   sorted from highest to lowest similarity score.
 */
export function findTopK(
  queryEmbedding: number[],
  chunks: Chunk[],
  k: number
): ScoredChunk[] {
  const scored = chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
