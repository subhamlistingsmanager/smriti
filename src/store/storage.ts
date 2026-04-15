/**
 * MMKV persistence layer.
 * Stub for v0 — uses in-memory storage until react-native-mmkv is installed.
 */

// TODO: Replace with actual MMKV
// import { MMKV } from 'react-native-mmkv';
// const storage = new MMKV();

const memoryStore = new Map<string, string>();

export const storage = {
  getString(key: string): string | undefined {
    return memoryStore.get(key);
  },

  set(key: string, value: string): void {
    memoryStore.set(key, value);
  },

  delete(key: string): void {
    memoryStore.delete(key);
  },

  contains(key: string): boolean {
    return memoryStore.has(key);
  },

  getAllKeys(): string[] {
    return Array.from(memoryStore.keys());
  },
};
