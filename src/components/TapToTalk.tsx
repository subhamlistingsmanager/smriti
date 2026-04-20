import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';

interface Props {
  onSend: (text: string) => void;
  isProcessing: boolean;
  voiceMode: boolean;
  onToggleVoiceMode: () => void;
}

export function TapToTalk({ onSend, isProcessing, voiceMode, onToggleVoiceMode }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || isProcessing) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.modeRow}>
        <Text style={styles.modeLabel}>Voice Replies</Text>
        <TouchableOpacity
          style={[styles.voiceModePill, voiceMode && styles.voiceModePillActive]}
          onPress={onToggleVoiceMode}
          disabled={isProcessing}
        >
          <Text style={[styles.voiceModePillText, voiceMode && styles.voiceModePillTextActive]}>
            {voiceMode ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.micShortcut}
          onPress={() => inputRef.current?.focus()}
          disabled={isProcessing}
        >
          <Text style={styles.micShortcutIcon}>🎤</Text>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Share what weighs on your heart..."
          placeholderTextColor="#C9B287"
          multiline
          maxLength={2000}
          editable={!isProcessing}
          returnKeyType="default"
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (text.trim().length === 0 || isProcessing) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={text.trim().length === 0 || isProcessing}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.voiceIndicator}>
        <Text style={styles.voiceText}>
          Tap the mic, then use your keyboard dictation to speak your message.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(242,174,61,0.24)',
    backgroundColor: 'rgba(20,12,9,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modeLabel: {
    color: '#E9D0A2',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  voiceModePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(242,174,61,0.42)',
    backgroundColor: 'rgba(242,174,61,0.08)',
  },
  voiceModePillActive: {
    backgroundColor: 'rgba(242,174,61,0.2)',
    borderColor: '#F2AE3D',
  },
  voiceModePillText: {
    color: '#E9D0A2',
    fontSize: 12,
    fontWeight: '700',
  },
  voiceModePillTextActive: {
    color: '#FBE7C0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micShortcut: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(227,122,29,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(242,174,61,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  micShortcutIcon: {
    fontSize: 18,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#231712',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F8E7C4',
    maxHeight: 128,
    borderWidth: 1,
    borderColor: 'rgba(242,174,61,0.35)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E37A1D',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    backgroundColor: '#8F5E35',
  },
  sendIcon: {
    color: '#FFF4DF',
    fontSize: 20,
    fontWeight: '700',
  },
  voiceIndicator: {
    marginTop: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  voiceText: {
    color: '#CFA96C',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
