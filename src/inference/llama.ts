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

export interface GenerateOptions {
  onToken?: (accumulatedText: string, token: string) => void;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
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
let initPromise: Promise<void> | null = null;
let initFailed = false;

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
  initFailed = false;
  console.log('[Llama] Model loaded from', currentConfig.modelPath);
}

export async function ensureLlamaReady(): Promise<boolean> {
  if (llamaContext) {
    return true;
  }

  if (initFailed) {
    return false;
  }

  if (!initPromise) {
    initPromise = initLlama().catch((error) => {
      initFailed = true;
      console.warn('[Llama] Falling back to stub mode:', error);
    }).finally(() => {
      initPromise = null;
    });
  }

  await initPromise;
  return llamaContext !== null;
}

export async function generate(
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  if (!llamaContext) {
    const ready = await ensureLlamaReady();
    if (!ready) return stubGenerate(prompt);
  }

  let streamed = '';
  const maxTokens = options?.maxTokens ?? currentConfig.maxTokens;
  const temperature = options?.temperature ?? currentConfig.temperature;
  const topP = options?.topP ?? currentConfig.topP;

  const result = await llamaContext.completion({
    prompt,
    n_predict: maxTokens,
    temperature,
    top_p: topP,
    top_k: 40,
    penalty_repeat: 1.1,
    stop: STOP_TOKENS,
  }, (data) => {
    if (!options?.onToken) return;

    const token = data.token ?? '';
    streamed = data.accumulated_text ?? `${streamed}${token}`;
    options.onToken(streamed, token);
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
