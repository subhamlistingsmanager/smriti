import { RefusalResult, RetrievalResult } from '../types/corpus';

/**
 * Refusal layer — validates every model response before it reaches the user.
 *
 * Checks:
 * 1. No prescriptive language ("you should", "I recommend", etc.)
 * 2. Response references at least one retrieved episode
 * 3. No character break ("as an AI", "I'm a language model", etc.)
 * 4. No Devanagari that isn't a verbatim match to a canonical verse
 *
 * If any check fails: regenerate once, then fall back to a safe response.
 */

// Prescriptive patterns — phrases that give direct advice
const PRESCRIPTIVE_PATTERNS = [
  /\byou should\b/i,
  /\byou must\b/i,
  /\byou need to\b/i,
  /\byou have to\b/i,
  /\bi (?:would )?(?:suggest|recommend|advise)\b/i,
  /\bthe best thing (?:to do|would be|is)\b/i,
  /\btry to\b/i,
  /\bmake sure (?:you|to)\b/i,
  /\bdon'?t (?:forget to|hesitate)\b/i,
  /\bconsider doing\b/i,
  /\bwhat you (?:can|could) do is\b/i,
  /\bmy advice\b/i,
  /\bhere (?:are|is) (?:what|how|some|a few|three|two)\b/i,
  /^\s*[-•*]\s/m, // Bullet points
  /^\s*\d+\.\s/m, // Numbered lists
];

// Character-break patterns
const CHARACTER_BREAK_PATTERNS = [
  /\bas an ai\b/i,
  /\bi'?m (?:a |an )?(?:ai|artificial|language model|chatbot|assistant|program|bot)\b/i,
  /\blarge language model\b/i,
  /\bi (?:don'?t|cannot) (?:have|feel|experience) (?:emotions|feelings)\b/i,
  /\bmy training\b/i,
  /\bmy (?:knowledge )?cutoff\b/i,
  /\bi was (?:trained|programmed|designed|created)\b/i,
];

// Devanagari Unicode range: U+0900 to U+097F
const DEVANAGARI_REGEX = /[\u0900-\u097F]+/g;

export function checkRefusal(
  response: string,
  retrievedEpisodes: RetrievalResult[],
  allowedDevanagari: Set<string>
): RefusalResult {
  const checks = {
    no_prescriptive_language: true,
    cites_retrieved_episode: true,
    no_character_break: true,
    no_unverified_devanagari: true,
  };

  // Check 1: No prescriptive language
  for (const pattern of PRESCRIPTIVE_PATTERNS) {
    if (pattern.test(response)) {
      checks.no_prescriptive_language = false;
      break;
    }
  }

  // Check 2: References at least one retrieved episode
  if (retrievedEpisodes.length > 0) {
    const episodeSignals = retrievedEpisodes.flatMap((r) => [
      ...r.episode.characters,
      ...r.episode.themes,
      r.episode.location,
    ]);
    const responseLower = response.toLowerCase();
    const hasReference = episodeSignals.some(
      (signal) => signal.length > 2 && responseLower.includes(signal.toLowerCase())
    );
    checks.cites_retrieved_episode = hasReference;
  }

  // Check 3: No character break
  for (const pattern of CHARACTER_BREAK_PATTERNS) {
    if (pattern.test(response)) {
      checks.no_character_break = false;
      break;
    }
  }

  // Check 4: Any Devanagari must be in the verified verse table
  const devanagariMatches = response.match(DEVANAGARI_REGEX);
  if (devanagariMatches) {
    for (const match of devanagariMatches) {
      if (!allowedDevanagari.has(match.trim())) {
        checks.no_unverified_devanagari = false;
        break;
      }
    }
  }

  const passed = Object.values(checks).every(Boolean);
  const failedCheck = !passed
    ? Object.entries(checks).find(([, v]) => !v)?.[0]
    : undefined;

  return { passed, checks, failed_check: failedCheck };
}

/** Build the set of allowed Devanagari strings from canonical verses */
export function buildAllowedDevanagari(
  retrievedResults: RetrievalResult[]
): Set<string> {
  const allowed = new Set<string>();
  for (const result of retrievedResults) {
    for (const verse of result.matched_verses) {
      if (verse.sanskrit_devanagari) {
        // Add the full verse text
        allowed.add(verse.sanskrit_devanagari.trim());
        // Also add individual words for partial quoting
        const words = verse.sanskrit_devanagari.match(DEVANAGARI_REGEX);
        if (words) {
          for (const word of words) {
            allowed.add(word.trim());
          }
        }
      }
    }
  }
  return allowed;
}

/** Safe fallback when the model fails refusal checks twice */
export const SAFE_FALLBACK_RESPONSES = [
  'I am listening. Tell me more about what weighs on you.',
  'I hear you. Sometimes just speaking it aloud changes something. Go on.',
  'This is not easy, what you carry. I am here. Tell me more.',
  'There is no rush. Take your time. I am sitting right here with you.',
  'Hmm. I am thinking of what you have shared. Tell me — what feels heaviest right now?',
];

export function getSafeFallback(): string {
  const idx = Math.floor(Math.random() * SAFE_FALLBACK_RESPONSES.length);
  return SAFE_FALLBACK_RESPONSES[idx];
}
