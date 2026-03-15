export type Chunk = {
  text: string;
  embedding: number[];
  source: string;
}

export type VectorStore = {
  chunks: Chunk[];
}

export type ScoredChunk = Chunk & { score: number };