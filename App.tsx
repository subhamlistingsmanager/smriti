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
  const toggleDebugMode = useConversationStore((s) => s.toggleDebugMode);

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
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Smriti</Text>
        <TouchableOpacity onPress={handleDebugToggle} style={styles.debugToggle}>
          <Text style={styles.debugToggleText}>
            {debugMode ? '◉' : '○'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ambient background */}
      {messages.length === 0 && <AmbientIllustration />}

      {/* Conversation */}
      <ConversationView messages={messages} isProcessing={isProcessing} />

      {/* Input */}
      <TapToTalk onSend={sendMessage} isProcessing={isProcessing} />

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: '#5D4037',
    letterSpacing: 2,
  },
  debugToggle: {
    padding: 8,
  },
  debugToggleText: {
    fontSize: 16,
    color: '#B8A88A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF9F0',
    borderRadius: 16,
    padding: 24,
    width: 280,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 16,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#E8DCC8',
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
    backgroundColor: '#B8860B',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#FFF',
  },
});
