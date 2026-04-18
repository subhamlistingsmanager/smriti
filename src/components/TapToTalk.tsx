import React, { useState } from 'react';
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

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || isProcessing) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="What is on your mind..."
          placeholderTextColor="#B8A88A"
          multiline
          maxLength={2000}
          editable={!isProcessing}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[styles.voiceButton, voiceMode && styles.voiceButtonActive]}
          onPress={onToggleVoiceMode}
          disabled={isProcessing}
        >
          <Text style={styles.voiceIcon}>
            {voiceMode ? '🎙' : '🔇'}
          </Text>
        </TouchableOpacity>

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
          {voiceMode
            ? 'Voice mode ON - replies are spoken automatically (local LLM + local TTS)'
            : 'Voice mode OFF'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E8DCC8',
    backgroundColor: '#FFF9F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#3E2723',
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5EDE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#E9DFC9',
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  voiceIcon: {
    fontSize: 18,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B8860B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D4C5A9',
  },
  sendIcon: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  voiceIndicator: {
    marginTop: 8,
    padding: 8,
    alignItems: 'center',
  },
  voiceText: {
    color: '#B8860B',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
