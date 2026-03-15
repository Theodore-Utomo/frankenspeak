export type ChunkInput = {
  text: string;
  source?: string;
}

/**
 * Splits markdown content by level 2 (`##`) headings.
 *
 * Each section between `##` headings (including any content before the first `##`)
 * will become a separate chunk. The function removes leading and trailing whitespace
 * from each chunk and omits any empty resulting chunks.
 *
 * @param content - The markdown string to split into chunks.
 * @param source - (Optional) Source identifier to tag each chunk.
 * @returns An array of ChunkInput objects representing each markdown section.
 */
export function chunkMarkdown(
  content: string,
  source = ""
): ChunkInput[] {
  const sections = content.split(/\n##\s+/).filter(Boolean);
  const chunks: ChunkInput[] = [];

  for (const section of sections) {
    const text = section.trim();
    if (text.length > 0) {
      chunks.push({ text, source });
    }
  }

  return chunks;
}
