import { Message, RetrievalResult } from '../types/corpus';
import { retrieveEpisodes } from '../retrieval/search';
import { assemblePrompt } from './prompt';
import { generate } from './llama';
import {
  checkRefusal,
  buildAllowedDevanagari,
  getSafeFallback,
} from './refusal';

export interface PipelineResult {
  response: string;
  retrievedEpisodes: RetrievalResult[];
  rawOutput: string;
  usedFallback: boolean;
  refusalPassed: boolean;
}

/**
 * Full turn pipeline:
 * 1. Retrieve relevant episodes
 * 2. Assemble prompt with persona + episodes + history
 * 3. Generate response
 * 4. Run refusal layer
 * 5. If refusal fails, regenerate once, then fall back
 */
export async function runPipeline(
  userMessage: string,
  conversationHistory: Message[]
): Promise<PipelineResult> {
  // Step 1: Retrieve
  const retrievedEpisodes = await retrieveEpisodes(userMessage, 5);

  // Step 2: Assemble prompt
  const prompt = assemblePrompt(
    userMessage,
    retrievedEpisodes,
    conversationHistory
  );

  // Step 3: Generate
  let rawOutput = await generate(prompt);
  let response = rawOutput;

  // Step 4: Refusal check
  const allowedDevanagari = buildAllowedDevanagari(retrievedEpisodes);
  let refusalResult = checkRefusal(response, retrievedEpisodes, allowedDevanagari);

  if (!refusalResult.passed) {
    console.log(
      `[Pipeline] Refusal failed (${refusalResult.failed_check}), regenerating...`
    );

    // One retry
    rawOutput = await generate(prompt);
    response = rawOutput;
    refusalResult = checkRefusal(response, retrievedEpisodes, allowedDevanagari);

    if (!refusalResult.passed) {
      console.log('[Pipeline] Second refusal failure, using safe fallback');
      response = getSafeFallback();
      return {
        response,
        retrievedEpisodes,
        rawOutput,
        usedFallback: true,
        refusalPassed: false,
      };
    }
  }

  return {
    response,
    retrievedEpisodes,
    rawOutput,
    usedFallback: false,
    refusalPassed: true,
  };
}
