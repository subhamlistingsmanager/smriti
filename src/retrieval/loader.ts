import { Episode, CanonicalVerse } from '../types/corpus';
import { embedText } from './embeddings';
import { VectorIndex } from './vector-index';
import { setIndex } from './search';

// Placeholder data — will be replaced by bundled corpus
import placeholderEpisodes from '../../corpus/placeholder/episodes.json';
import placeholderVerses from '../../corpus/placeholder/verses.json';

/**
 * Load the placeholder corpus, compute embeddings, and initialize the vector index.
 * In production, embeddings are pre-computed at build time and loaded from a binary.
 */
export async function loadPlaceholderCorpus(): Promise<void> {
  const episodes: Episode[] = placeholderEpisodes as Episode[];
  const verses: CanonicalVerse[] = placeholderVerses as CanonicalVerse[];

  // Compute embeddings for each episode (stub mode returns deterministic vectors)
  const embeddings = new Map<string, Float32Array>();

  for (const ep of episodes) {
    // Embed the concatenation of summary + themes + emotional situations
    const textToEmbed = [
      ep.summary_en,
      ...ep.themes,
      ...ep.emotional_situations,
    ].join('. ');

    const embedding = await embedText(textToEmbed);
    embeddings.set(ep.episode_id, embedding);
  }

  // Build and register the vector index
  const index = new VectorIndex();
  index.loadFromEpisodes(episodes, verses, embeddings);
  setIndex(index);

  console.log(
    `[Loader] Loaded ${episodes.length} episodes, ${verses.length} verses`
  );
}
