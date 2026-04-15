import { create } from 'zustand';
import { Message } from '../types/corpus';
import { runPipeline, PipelineResult } from '../inference/pipeline';

interface ConversationState {
  messages: Message[];
  isProcessing: boolean;
  debugMode: boolean;
  debugPin: string;

  sendMessage: (text: string) => Promise<void>;
  toggleDebugMode: (pin: string) => boolean;
  clearConversation: () => void;
}

const DEBUG_PIN = '1947'; // Default PIN, user can change

export const useConversationStore = create<ConversationState>((set, get) => ({
  messages: [],
  isProcessing: false,
  debugMode: false,
  debugPin: DEBUG_PIN,

  sendMessage: async (text: string) => {
    const { messages } = get();

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    set({ messages: [...messages, userMessage], isProcessing: true });

    try {
      const result: PipelineResult = await runPipeline(
        text,
        [...messages, userMessage]
      );

      const smritiMessage: Message = {
        id: `smriti_${Date.now()}`,
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
        messages: [...state.messages, smritiMessage],
        isProcessing: false,
      }));
    } catch (error) {
      console.error('[Conversation] Pipeline error:', error);

      const errorMessage: Message = {
        id: `smriti_${Date.now()}`,
        role: 'smriti',
        text: 'I am listening. Tell me more about what weighs on you.',
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isProcessing: false,
      }));
    }
  },

  toggleDebugMode: (pin: string) => {
    if (pin === get().debugPin) {
      set((state) => ({ debugMode: !state.debugMode }));
      return true;
    }
    return false;
  },

  clearConversation: () => {
    set({ messages: [] });
  },
}));
