import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ConversationView } from './src/components/ConversationView';
import { TapToTalk } from './src/components/TapToTalk';
import { AmbientIllustration } from './src/components/AmbientIllustration';
import { useConversationStore } from './src/store/conversation';
import { initEmbeddingModel } from './src/retrieval/embeddings';
import { initLlama } from './src/inference/llama';
import {
  downloadModel,
  isModelDownloaded,
  DownloadProgress,
} from './src/inference/model-download';
import { loadPlaceholderCorpus } from './src/retrieval/loader';

type InitPhase = 'starting' | 'downloading' | 'loading' | 'ready' | 'error';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [phase, setPhase] = useState<InitPhase>('starting');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const messages = useConversationStore((s) => s.messages);
  const isProcessing = useConversationStore((s) => s.isProcessing);
  const sendMessage = useConversationStore((s) => s.sendMessage);
  const debugMode = useConversationStore((s) => s.debugMode);
  const voiceMode = useConversationStore((s) => s.voiceMode);
  const setVoiceMode = useConversationStore((s) => s.setVoiceMode);
  const toggleDebugMode = useConversationStore((s) => s.toggleDebugMode);
  const clearConversation = useConversationStore((s) => s.clearConversation);

  useEffect(() => {
    async function init() {
      try {
        await initEmbeddingModel();
        await loadPlaceholderCorpus();

        if (!(await isModelDownloaded())) {
          setPhase('downloading');
          await downloadModel((p) => setProgress(p));
        }

        setPhase('loading');
        await initLlama();

        setPhase('ready');
        setIsReady(true);
      } catch (err) {
        console.error('[App] Init failed:', err);
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }
    }
    init();
  }, []);

  const handleDebugToggle = () => {
    if (debugMode) {
      toggleDebugMode(useConversationStore.getState().debugPin);
      return;
    }
    setShowPinModal(true);
    setPinInput('');
  };

  const handlePinSubmit = () => {
    const success = toggleDebugMode(pinInput);
    setShowPinModal(false);
    if (!success) {
      Alert.alert('Incorrect PIN');
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{renderPhaseMessage(phase)}</Text>
        {phase === 'downloading' && progress && (
          <>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round(progress.fraction * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {formatMB(progress.bytesWritten)} / {formatMB(progress.totalBytes)} MB
            </Text>
          </>
        )}
        {phase === 'error' && errorMsg && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}
          <StatusBar style="light" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.bgTopOrb} />
      <View style={styles.bgMidOrb} />
      <View style={styles.bgBaseGlow} />

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Sankat Sathi</Text>
            <Text style={styles.subtitle}>Converse with Hanuman Ji</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => clearConversation()} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDebugToggle} style={styles.debugToggle}>
              <Text style={styles.debugToggleText}>
                {debugMode ? '◉' : '○'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ambient background */}
        {messages.length === 0 && <AmbientIllustration />}

        {/* Conversation */}
        <ConversationView messages={messages} isProcessing={isProcessing} />

        {/* Input */}
        <TapToTalk
          onSend={sendMessage}
          isProcessing={isProcessing}
          voiceMode={voiceMode}
          onToggleVoiceMode={() => setVoiceMode(!voiceMode)}
        />

        {/* PIN Modal */}
        <Modal visible={showPinModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Debug PIN</Text>
              <TextInput
                style={styles.pinInput}
                value={pinInput}
                onChangeText={setPinInput}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                autoFocus
                onSubmitEditing={handlePinSubmit}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setShowPinModal(false)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePinSubmit}
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    Enter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function renderPhaseMessage(phase: InitPhase): string {
  switch (phase) {
    case 'downloading':
      return 'Hanuman Ji is gathering the kathas... (first launch only)';
    case 'loading':
      return 'Hanuman Ji is settling in...';
    case 'error':
      return 'Something went wrong waking Hanuman Ji up.';
    default:
      return 'Hanuman Ji is waking up...';
  }
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(0);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#130D0A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#130D0A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  bgTopOrb: {
    position: 'absolute',
    top: -130,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#B63A2B',
    opacity: 0.28,
  },
  bgMidOrb: {
    position: 'absolute',
    top: 170,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E37A1D',
    opacity: 0.18,
  },
  bgBaseGlow: {
    position: 'absolute',
    bottom: -120,
    alignSelf: 'center',
    width: 460,
    height: 260,
    borderRadius: 180,
    backgroundColor: '#F2AE3D',
    opacity: 0.12,
  },
  loadingText: {
    fontSize: 18,
    color: '#F5E8C9',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  progressBarTrack: {
    width: '80%',
    height: 6,
    backgroundColor: '#5F3A2A',
    borderRadius: 3,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F2AE3D',
  },
  progressText: {
    marginTop: 12,
    fontSize: 14,
    color: '#F5E8C9',
  },
  errorText: {
    marginTop: 16,
    fontSize: 13,
    color: '#FFB19A',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242,174,61,0.25)',
    backgroundColor: 'rgba(19,13,10,0.72)',
  },
  title: {
    fontSize: 25,
    color: '#F7E5BE',
    letterSpacing: 1.2,
    fontFamily: 'serif',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#E3C98F',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(242,174,61,0.45)',
    backgroundColor: 'rgba(242,174,61,0.08)',
  },
  clearButtonText: {
    color: '#F1D8A6',
    fontSize: 12,
    fontWeight: '600',
  },
  debugToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(242,174,61,0.45)',
    backgroundColor: 'rgba(242,174,61,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugToggleText: {
    fontSize: 15,
    color: '#F1D8A6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2A1A14',
    borderRadius: 16,
    padding: 24,
    width: 280,
    borderWidth: 1,
    borderColor: 'rgba(242,174,61,0.28)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F7E5BE',
    marginBottom: 16,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: '#1A100C',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: 'rgba(242,174,61,0.35)',
    color: '#F7E5BE',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#E37A1D',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#F5E8C9',
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#FFF',
  },
});
