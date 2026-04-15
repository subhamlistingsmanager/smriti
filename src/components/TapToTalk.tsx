import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface Props {
  onSend: (text: string) => void;
  isProcessing: boolean;
}

export function TapToTalk({ onSend, isProcessing }: Props) {
  const [text, setText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || isProcessing) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
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

          {/* Voice button — placeholder for whisper.rn integration */}
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() => setIsVoiceMode(!isVoiceMode)}
            disabled={isProcessing}
          >
            <Text style={styles.voiceIcon}>
              {isVoiceMode ? '⏹' : '🎙'}
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

        {isVoiceMode && (
          <View style={styles.voiceIndicator}>
            <Text style={styles.voiceText}>
              Listening... (tap to stop)
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
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
