import { Episode, CanonicalVerse, RetrievalResult } from '../types/corpus';

/**
 * Lightweight vector index for episode retrieval.
 * Uses brute-force cosine similarity — fast enough for ~700 episodes × 384 dims.
 * No native FAISS dependency needed.
 */

interface IndexEntry {
  episode_id: string;
  embedding: Float32Array;
}

export class VectorIndex {
  private entries: IndexEntry[] = [];
  private episodes: Map<string, Episode> = new Map();
  private verses: Map<string, CanonicalVerse> = new Map();
  private versesByEpisode: Map<string, CanonicalVerse[]> = new Map();

  /** Load pre-computed embeddings from bundled binary */
  async loadFromBundle(
    episodes: Episode[],
    verses: CanonicalVerse[],
    embeddingsBinary: ArrayBuffer,
    dims: number = 384
  ): Promise<void> {
    // Store episodes and verses for lookup
    for (const ep of episodes) {
      this.episodes.set(ep.episode_id, ep);
    }
    for (const v of verses) {
      this.verses.set(v.id, v);
      for (const epId of v.linked_episodes) {
        const existing = this.versesByEpisode.get(epId) || [];
        existing.push(v);
        this.versesByEpisode.set(epId, existing);
      }
    }

    // Parse flat binary: [ep1_dim1, ep1_dim2, ..., ep2_dim1, ...]
    const floats = new Float32Array(embeddingsBinary);
    const numEpisodes = floats.length / dims;

    for (let i = 0; i < numEpisodes; i++) {
      const embedding = floats.subarray(i * dims, (i + 1) * dims);
      this.entries.push({
        episode_id: episodes[i].episode_id,
        embedding,
      });
    }
  }

  /** Load from episode objects with inline embeddings (for dev/placeholder mode) */
  loadFromEpisodes(
    episodes: Episode[],
    verses: CanonicalVerse[],
    embeddings: Map<string, Float32Array>
  ): void {
    for (const ep of episodes) {
      this.episodes.set(ep.episode_id, ep);
      const emb = embeddings.get(ep.episode_id);
      if (emb) {
        this.entries.push({ episode_id: ep.episode_id, embedding: emb });
      }
    }
    for (const v of verses) {
      this.verses.set(v.id, v);
      for (const epId of v.linked_episodes) {
        const existing = this.versesByEpisode.get(epId) || [];
        existing.push(v);
        this.versesByEpisode.set(epId, existing);
      }
    }
  }

  /** Search for top-k most similar episodes to the query embedding */
  search(queryEmbedding: Float32Array, topK: number = 5): RetrievalResult[] {
    const scores: { episode_id: string; score: number }[] = [];

    for (const entry of this.entries) {
      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      scores.push({ episode_id: entry.episode_id, score });
    }

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map(({ episode_id, score }) => {
      const episode = this.episodes.get(episode_id)!;
      const matched_verses = this.versesByEpisode.get(episode_id) || [];
      return { episode, score, matched_verses };
    });
  }

  getEpisode(id: string): Episode | undefined {
    return this.episodes.get(id);
  }

  getVerse(id: string): CanonicalVerse | undefined {
    return this.verses.get(id);
  }
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
