/** A narrative episode from the epics — the primary retrieval target */
export interface Episode {
  episode_id: string;
  /** "ramayan" | "mahabharat" | "harivamsha" */
  source_text: 'ramayan' | 'mahabharat' | 'harivamsha';
  /** Kanda (Ramayan) or Parva (Mahabharat) or section (Harivamsha) */
  kanda_parva: string;
  characters: string[];
  location: string;
  summary_en: string;
  summary_hi?: string;
  source_excerpt: string;
  themes: string[];
  emotional_situations: string[];
  linked_verses: string[];
}

/** A canonical verse — Sanskrit/Awadhi original + translation. Never LLM-generated. */
export interface CanonicalVerse {
  id: string;
  source: string;
  chapter?: number;
  verse?: number;
  sanskrit_devanagari: string;
  sanskrit_iast?: string;
  english_meaning: string;
  linked_episodes: string[];
  themes: string[];
}

/** A single message in the conversation */
export interface Message {
  id: string;
  role: 'user' | 'smriti';
  text: string;
  timestamp: number;
  /** Episodes retrieved for this turn (Smriti messages only) */
  retrieved_episodes?: string[];
  /** Verses quoted in this turn */
  quoted_verses?: string[];
  /** Debug: raw model output before refusal layer */
  raw_output?: string;
  /** Debug: refusal layer result */
  refusal_result?: RefusalResult;
}

export interface RefusalResult {
  passed: boolean;
  checks: {
    no_prescriptive_language: boolean;
    cites_retrieved_episode: boolean;
    no_character_break: boolean;
    no_unverified_devanagari: boolean;
  };
  failed_check?: string;
}

/** Search result from the vector index */
export interface RetrievalResult {
  episode: Episode;
  score: number;
  matched_verses: CanonicalVerse[];
}
