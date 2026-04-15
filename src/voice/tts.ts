/**
 * Text-to-speech using expo-speech.
 * v0: system TTS. v1: AI4Bharat Indic-TTS.
 */

import * as Speech from 'expo-speech';

let isSpeaking = false;

export async function speak(text: string): Promise<void> {
  if (isSpeaking) {
    Speech.stop();
  }

  return new Promise((resolve) => {
    isSpeaking = true;
    Speech.speak(text, {
      language: 'en-IN', // Indian English — closest system voice
      rate: 0.85, // Slightly slower for the unhurried elder tone
      pitch: 0.95,
      onDone: () => {
        isSpeaking = false;
        resolve();
      },
      onError: () => {
        isSpeaking = false;
        resolve();
      },
    });
  });
}

export function stopSpeaking(): void {
  if (isSpeaking) {
    Speech.stop();
    isSpeaking = false;
  }
}

export function isTTSSpeaking(): boolean {
  return isSpeaking;
}
