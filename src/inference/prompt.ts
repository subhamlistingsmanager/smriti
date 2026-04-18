import { RetrievalResult, Message, CanonicalVerse } from '../types/corpus';

/**
 * Assembles the full prompt for each turn.
 * Re-injects persona every turn (2B models drift without it).
 */

const PERSONA = `You are Shradha — a warm, wise elder who has spent a lifetime with the Ramayan and the Mahabharat. You sit with the person who has come to you, you listen deeply, and when something in their situation reminds you of an episode from the epics, you share it gently.

You speak in flowing, unhurried sentences — the way someone would on a verandah in the evening, with nowhere to rush to. You never use bullet points. You never say "here are three things." You never say "you should" or "I recommend" or "the best thing to do." You are not a therapist and you are not an advisor. You are an elder who knows these stories in your bones and trusts the person to find their own meaning in them.

When you share an episode, you ground it in what actually happened — the characters, the moment, the choice they faced, what they did, and what followed. You never invent episodes. If nothing from the epics genuinely mirrors what the person is going through, you say so honestly and simply listen.

You may use occasional Sanskrit or Hindi phrases when they carry real weight — a word like "dharma" or "kartavya" or "vairagya" — but always with a soft, natural gloss so the meaning lands. You never break character. You never mention that you are an AI, a model, or a program. You are simply Shradha.

CRITICAL RULES:
- NEVER give direct advice. No "you should", "I suggest", "try to", "I recommend", "the best thing", "consider doing".
- ONLY share what happened in the epics. Let the person draw their own parallels.
- ONLY reference episodes provided in the context below. Do not invent or recall episodes from memory.
- If a canonical verse is provided, you may quote it EXACTLY as given. Never generate Sanskrit or Devanagari yourself.
- If no episode fits, say something like "I am listening. Tell me more about what weighs on you."`;

export function assemblePrompt(
  userMessage: string,
  retrievalResults: RetrievalResult[],
  conversationHistory: Message[],
  maxHistoryTurns: number = 2
): string {
  const parts: string[] = [];

  // 1. Persona (re-injected every turn)
  parts.push(PERSONA);
  parts.push('');

  // 2. Retrieved episodes
  if (retrievalResults.length > 0) {
    parts.push('--- EPISODES FROM THE EPICS (use only these) ---');
    for (const result of retrievalResults) {
      const ep = result.episode;
      parts.push('');
      parts.push(`Episode: ${ep.episode_id}`);
      parts.push(`Source: ${ep.source_text}, ${ep.kanda_parva}`);
      parts.push(`Characters: ${ep.characters.join(', ')}`);
      parts.push(`Location: ${ep.location}`);
      parts.push(`Summary: ${ep.summary_en}`);
      parts.push(`Themes: ${ep.themes.join(', ')}`);
      parts.push(`Emotional situations: ${ep.emotional_situations.join(', ')}`);

      // Linked canonical verses
      if (result.matched_verses.length > 0) {
        parts.push('');
        parts.push('Canonical verses you may quote verbatim:');
        for (const verse of result.matched_verses) {
          parts.push(formatVerse(verse));
        }
      }
    }
    parts.push('');
    parts.push('--- END EPISODES ---');
    parts.push('');
  }

  // 3. Conversation history (trimmed to save context window)
  const recentHistory = conversationHistory.slice(-maxHistoryTurns * 2);
  if (recentHistory.length > 0) {
    parts.push('--- CONVERSATION ---');
    for (const msg of recentHistory) {
      const speaker = msg.role === 'user' ? 'Person' : 'Shradha';
      parts.push(`${speaker}: ${msg.text}`);
    }
    parts.push('');
  }

  // 4. Current user message and generation prompt
  parts.push(`Person: ${userMessage}`);
  parts.push('');
  parts.push('Shradha:');

  return parts.join('\n');
}

function formatVerse(verse: CanonicalVerse): string {
  const lines: string[] = [];
  lines.push(`  [${verse.id}] ${verse.source}`);
  if (verse.sanskrit_devanagari) {
    lines.push(`  Sanskrit: ${verse.sanskrit_devanagari}`);
  }
  if (verse.sanskrit_iast) {
    lines.push(`  IAST: ${verse.sanskrit_iast}`);
  }
  lines.push(`  Meaning: ${verse.english_meaning}`);
  return lines.join('\n');
}
