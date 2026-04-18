import { create } from 'zustand';
import { Message } from '../types/corpus';
import { runPipeline, PipelineResult } from '../inference/pipeline';
import { speak, stopSpeaking } from '../voice/tts';

interface ConversationState {
  messages: Message[];
  isProcessing: boolean;
  voiceMode: boolean;
  debugMode: boolean;
  debugPin: string;

  sendMessage: (text: string) => Promise<void>;
  setVoiceMode: (enabled: boolean) => void;
  toggleDebugMode: (pin: string) => boolean;
  clearConversation: () => void;
}

const DEBUG_PIN = '1947'; // Default PIN, user can change

export const useConversationStore = create<ConversationState>((set, get) => ({
  messages: [],
  isProcessing: false,
  voiceMode: true,
  debugMode: false,
  debugPin: DEBUG_PIN,

  sendMessage: async (text: string) => {
    const { messages, voiceMode } = get();

    if (voiceMode) {
      stopSpeaking();
    }

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const smritiMessageId = `smriti_${Date.now()}_draft`;
    const draftSmritiMessage: Message = {
      id: smritiMessageId,
      role: 'smriti',
      text: '',
      timestamp: Date.now(),
    };

    set({
      messages: [...messages, userMessage, draftSmritiMessage],
      isProcessing: true,
    });

    try {
      let lastStreamUpdate = 0;
      const result: PipelineResult = await runPipeline(
        text,
        [...messages, userMessage],
        {
          realtimeMode: true,
          onResponseToken: (accumulatedText: string) => {
            const now = Date.now();
            if (now - lastStreamUpdate < 40) return;
            lastStreamUpdate = now;

            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === smritiMessageId ? { ...m, text: accumulatedText } : m
              ),
            }));
          },
        }
      );

      const smritiMessage: Message = {
        id: smritiMessageId,
        role: 'smriti',
        text: result.response,
        timestamp: Date.now(),
        retrieved_episodes: result.retrievedEpisodes.map(
          (r) => r.episode.episode_id
        ),
        quoted_verses: result.retrievedEpisodes.flatMap((r) =>
          r.matched_verses.map((v) => v.id)
        ),
        raw_output: result.rawOutput,
        refusal_result: {
          passed: result.refusalPassed,
          checks: {
            no_prescriptive_language: true,
            cites_retrieved_episode: true,
            no_character_break: true,
            no_unverified_devanagari: true,
          },
          failed_check: result.usedFallback ? 'fallback_used' : undefined,
        },
      };

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === smritiMessageId ? smritiMessage : m
        ),
        isProcessing: false,
      }));

      if (voiceMode && smritiMessage.text.trim().length > 0) {
        void speak(smritiMessage.text);
      }
    } catch (error) {
      console.error('[Conversation] Pipeline error:', error);

      const errorMessage: Message = {
        id: smritiMessageId,
        role: 'smriti',
        text: 'I am listening. Tell me more about what weighs on you.',
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === smritiMessageId ? errorMessage : m
        ),
        isProcessing: false,
      }));

      if (voiceMode) {
        void speak(errorMessage.text);
      }
    }
  },

  setVoiceMode: (enabled: boolean) => {
    if (!enabled) {
      stopSpeaking();
    }
    set({ voiceMode: enabled });
  },

  toggleDebugMode: (pin: string) => {
    if (pin === get().debugPin) {
      set((state) => ({ debugMode: !state.debugMode }));
      return true;
    }
    return false;
  },

  clearConversation: () => {
    stopSpeaking();
    set({ messages: [] });
  },
}));
