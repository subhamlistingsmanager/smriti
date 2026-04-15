/**
 * Speech-to-text using whisper.rn (base model, Hindi + English).
 * Stub for v0 — returns empty transcription until whisper.rn is integrated.
 */

let isInitialized = false;

export async function initSTT(): Promise<void> {
  // TODO: Load whisper.rn with base model
  // import { initWhisper } from 'whisper.rn';
  // await initWhisper({ model: 'base', language: 'auto' });
  isInitialized = true;
  console.log('[STT] Stub mode — voice input disabled');
}

export async function transcribe(_audioUri: string): Promise<string> {
  if (!isInitialized) {
    throw new Error('STT not initialized. Call initSTT() first.');
  }
  // TODO: Real whisper.rn transcription
  return '';
}

export function isSTTReady(): boolean {
  return isInitialized;
}
