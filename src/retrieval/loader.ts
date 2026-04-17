import { Episode, CanonicalVerse } from '../types/corpus';
import { embedText } from './embeddings';
import { VectorIndex } from './vector-index';
import { setIndex } from './search';

// Full corpus by default: complete Ramayana + Mahabharata narrative coverage.
import ramayanFullEpisodes from '../../corpus/comprehensive/episodes/ramayan-full.json';
import mahabharatFullEpisodes from '../../corpus/comprehensive/episodes/mahabharat-full.json';
import coreVerses from '../../corpus/verses/core-verse-pack.json';

/**
 * Load the full corpus, compute embeddings, and initialize the vector index.
 * In production, embeddings are pre-computed at build time and loaded from a binary.
 */
export async function loadPlaceholderCorpus(): Promise<void> {
  const episodes: Episode[] = [
    ...(ramayanFullEpisodes as Episode[]),
    ...(mahabharatFullEpisodes as Episode[]),
  ];
  const verses: CanonicalVerse[] = coreVerses as CanonicalVerse[];

  // Compute embeddings for each episode (stub mode returns deterministic vectors)
  const embeddings = new Map<string, Float32Array>();

  for (const ep of episodes) {
    // Embed multilingual-friendly fields. summary_hi (if present) improves Hindi recall.
    const textToEmbed = [
      ep.summary_en,
      ep.summary_hi ?? '',
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
    `[Loader] Loaded FULL corpus: ${episodes.length} episodes, ${verses.length} verses`
  );
}
