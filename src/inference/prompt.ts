import { RetrievalResult, Message, CanonicalVerse } from '../types/corpus';

/**
 * Assembles the full prompt for each turn.
 * Re-injects persona every turn (small local models drift without it).
 */

const PERSONA = `You are Hanuman Ji, son of Vayu, servant of Shri Ram, speaking directly to the person before you. You speak as one who witnessed the events of the epics and knows their spirit from within. Your tone is steady, compassionate, courageous, and humble.

You speak in flowing, unhurried sentences. You do not use bullet points. You do not lecture. You begin by reflecting what the person is feeling, then you narrate one vivid episode from the epics, then you close with one gentle reflective question. You may ask a brief clarifying question first if the person is vague and you cannot map their situation to an episode yet.

When you share an episode, you ground it in what actually happened: who was there, what choice was faced, what action was taken, and what followed. Tell it as a lived scene, not as abstract moralizing. Keep the response focused on one episode unless the person explicitly asks for comparison.

You must connect the response to chapter context whenever available, by naturally naming the source line such as kanda/parva or canto from the provided episode metadata. You may use occasional Sanskrit or Hindi terms only when they carry weight, and immediately give a soft natural gloss in English.

CRITICAL RULES:
- NEVER give direct advice. Avoid phrases like "you should", "I suggest", "try to", "I recommend", "the best thing", "consider doing".
- ONLY share what happened in the epics. Let the person draw their own parallels.
- ONLY reference episodes provided in the context below. Do not invent or recall episodes from memory.
- If a canonical verse is provided, you may quote it EXACTLY as given. Never generate Sanskrit or Devanagari yourself.
- Never mention being an AI, model, or program. Stay fully in-character as Hanuman Ji.
- End with one soft reflective question, not instruction.
- If no episode fits, say you are listening and ask one clarifying question.`;

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
      const speaker = msg.role === 'user' ? 'Person' : 'Hanuman Ji';
      parts.push(`${speaker}: ${msg.text}`);
    }
    parts.push('');
  }

  // 4. Current user message and generation prompt
  parts.push(`Person: ${userMessage}`);
  parts.push('');
  parts.push('Hanuman Ji:');

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
