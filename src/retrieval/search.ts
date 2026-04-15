import { RetrievalResult } from '../types/corpus';
import { embedText } from './embeddings';
import { VectorIndex } from './vector-index';

let index: VectorIndex | null = null;

export function setIndex(vectorIndex: VectorIndex): void {
  index = vectorIndex;
}

export function getIndex(): VectorIndex | null {
  return index;
}

/**
 * Retrieve the most relevant episodes for a user's message.
 * Embeds the message, searches the vector index, returns top-k results
 * with any linked canonical verses attached.
 */
export async function retrieveEpisodes(
  userMessage: string,
  topK: number = 5
): Promise<RetrievalResult[]> {
  if (!index) {
    throw new Error('Vector index not initialized. Call setIndex() first.');
  }

  const queryEmbedding = await embedText(userMessage);
  return index.search(queryEmbedding, topK);
}
