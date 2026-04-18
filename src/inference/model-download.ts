import * as FileSystem from 'expo-file-system/legacy';

export const MODEL_FILENAME = 'gemma-2-2b-it-Q4_K_M.gguf';
export const MODEL_URL =
  'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf';
const MIN_EXPECTED_BYTES = 1_500_000_000;

export interface DownloadProgress {
  bytesWritten: number;
  totalBytes: number;
  fraction: number;
}

export function getModelPath(): string {
  return `${FileSystem.documentDirectory}${MODEL_FILENAME}`;
}

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(getModelPath(), { size: true });
  return info.exists && !info.isDirectory && (info.size ?? 0) >= MIN_EXPECTED_BYTES;
}

export async function downloadModel(
  onProgress?: (p: DownloadProgress) => void
): Promise<string> {
  const path = getModelPath();
  const resumable = FileSystem.createDownloadResumable(
    MODEL_URL,
    path,
    {},
    (p) => {
      if (!onProgress) return;
      const total = p.totalBytesExpectedToWrite || MIN_EXPECTED_BYTES;
      onProgress({
        bytesWritten: p.totalBytesWritten,
        totalBytes: total,
        fraction: total > 0 ? p.totalBytesWritten / total : 0,
      });
    }
  );

  const result = await resumable.downloadAsync();
  if (!result) throw new Error('Model download returned no result');
  return result.uri;
}

export async function deleteModel(): Promise<void> {
  const path = getModelPath();
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) await FileSystem.deleteAsync(path, { idempotent: true });
}
