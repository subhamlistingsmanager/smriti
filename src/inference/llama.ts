import { Platform } from 'react-native';
import { initLlama as llamaInit, LlamaContext } from 'llama.rn';
import { getModelPath } from './model-download';

export interface LlamaConfig {
  modelPath: string;
  contextSize: number;
  maxTokens: number;
  temperature: number;
  topP: number;
}

const DEFAULT_CONFIG: LlamaConfig = {
  modelPath: '',
  contextSize: 2048,
  maxTokens: 512,
  temperature: 0.7,
  topP: 0.9,
};

const STOP_TOKENS = ['Person:', '\nPerson:', '---', '<end_of_turn>', '<|im_end|>'];

let llamaContext: LlamaContext | null = null;
let currentConfig: LlamaConfig = DEFAULT_CONFIG;

export async function initLlama(config?: Partial<LlamaConfig>): Promise<void> {
  currentConfig = { ...DEFAULT_CONFIG, ...config };
  if (!currentConfig.modelPath) currentConfig.modelPath = getModelPath();

  if (Platform.OS === 'web') {
    console.log('[Llama] Web platform — stub mode only');
    return;
  }

  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }

  llamaContext = await llamaInit({
    model: currentConfig.modelPath,
    n_ctx: currentConfig.contextSize,
    n_gpu_layers: Platform.OS === 'ios' ? 99 : 0,
    n_batch: 512,
    use_mlock: false,
  });
  console.log('[Llama] Model loaded from', currentConfig.modelPath);
}

export async function generate(prompt: string): Promise<string> {
  if (!llamaContext) return stubGenerate(prompt);

  const result = await llamaContext.completion({
    prompt,
    n_predict: currentConfig.maxTokens,
    temperature: currentConfig.temperature,
    top_p: currentConfig.topP,
    top_k: 40,
    penalty_repeat: 1.1,
    stop: STOP_TOKENS,
  });
  return (result.text ?? '').trim();
}

function stubGenerate(_prompt: string): string {
  return (
    'You know, what you are describing reminds me of something from the ' +
    'epics. There was a time when even the wisest among them felt exactly ' +
    'this way — uncertain, torn between what the heart wants and what ' +
    'dharma asks. Let me share what happened, and perhaps you will find ' +
    'something in it that speaks to your own situation.\n\n' +
    '[Stub response — model not loaded on this platform]'
  );
}

export function isModelLoaded(): boolean {
  return llamaContext !== null;
}

export function getConfig(): LlamaConfig {
  return { ...currentConfig };
}

export async function releaseLlama(): Promise<void> {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }
}
