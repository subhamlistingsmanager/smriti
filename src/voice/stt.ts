/**
 * Speech-to-text using expo-av for audio recording + Whisper API transcription.
 * Supports Hindi and English.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

let recording: Audio.Recording | null = null;
let isInitialized = false;
let whisperApiKey: string | null = null;

export async function initSTT(apiKey?: string): Promise<void> {
  try {
    // Request microphone permissions
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Microphone permission not granted');
    }

    // Configure audio session for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    whisperApiKey = apiKey;
    isInitialized = true;
    console.log('[STT] Initialized with expo-av');
  } catch (error) {
    console.error('[STT] Initialization failed:', error);
    throw error;
  }
}

export async function startRecording(): Promise<void> {
  if (!isInitialized) {
    throw new Error('STT not initialized. Call initSTT() first.');
  }

  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
    }

    const { recording: newRecording } = await Audio.startRecordingAsync({
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RecordingOptionsPresets.HIGH_QUALITY.ios.outputFormat,
        audioQuality: Audio.RecordingOptionsPresets.HIGH_QUALITY.ios.audioQuality,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      android: {
        extension: '.m4a',
        outputFormat: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.outputFormat,
        audioQuality: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.audioQuality,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    });

    recording = newRecording;
    console.log('[STT] Recording started');
  } catch (error) {
    console.error('[STT] Failed to start recording:', error);
    throw error;
  }
}

export async function stopRecording(): Promise<string> {
  if (!recording) {
    throw new Error('No active recording');
  }

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    if (!uri) {
      throw new Error('Failed to get recording URI');
    }

    console.log('[STT] Recording saved to:', uri);
    return uri;
  } catch (error) {
    console.error('[STT] Failed to stop recording:', error);
    throw error;
  }
}

export async function transcribe(audioUri: string): Promise<string> {
  if (!isInitialized) {
    throw new Error('STT not initialized. Call initSTT() first.');
  }

  // Fallback if no API key configured
  if (!whisperApiKey) {
    console.warn('[STT] No Whisper API key configured. Using keyboard dictation only.');
    return '';
  }

  try {
    // Read audio file as base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Send to Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whisperApiKey}`,
      },
      body: (() => {
        const formData = new FormData();
        formData.append('file', {
          uri: audioUri,
          type: 'audio/m4a',
          name: 'audio.m4a',
        } as any);
        formData.append('model', 'whisper-1');
        formData.append('language', 'hi'); // Default to Hindi; can be auto-detected
        return formData;
      })(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Whisper API error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const text = result.text || '';

    console.log('[STT] Transcription successful:', text);

    // Clean up audio file
    try {
      await FileSystem.deleteAsync(audioUri);
    } catch (e) {
      console.warn('[STT] Failed to delete recording:', e);
    }

    return text;
  } catch (error) {
    console.error('[STT] Transcription failed:', error);
    throw error;
  }
}

export function isSTTReady(): boolean {
  return isInitialized;
}

export function isRecording(): boolean {
  return recording !== null;
}
