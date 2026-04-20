import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { Message } from '../types/corpus';
import { useConversationStore } from '../store/conversation';

interface Props {
  messages: Message[];
  isProcessing: boolean;
}

export function ConversationView({ messages, isProcessing }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const debugMode = useConversationStore((s) => s.debugMode);
  const lastMessageText = messages[messages.length - 1]?.text ?? '';

  useEffect(() => {
    // Scroll to bottom on new message and while streamed text is growing.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, lastMessageText]);

  if (messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Speak freely.{'\n'}Hanuman Ji is listening.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((msg) => (
        <View key={msg.id}>
          <MessageBubble message={msg} />
          {debugMode && msg.role === 'smriti' && (
            <DebugInfo message={msg} />
          )}
        </View>
      ))}
      {isProcessing && <ThinkingIndicator />}
    </ScrollView>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.smritiBubble,
      ]}
    >
      {!isUser && <Text style={styles.speakerName}>Hanuman Ji</Text>}
      <Text style={[styles.messageText, isUser && styles.userText]}>
        {message.text}
      </Text>
    </View>
  );
}

function DebugInfo({ message }: { message: Message }) {
  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugLabel}>Debug</Text>
      {message.retrieved_episodes && (
        <Text style={styles.debugText}>
          Episodes: {message.retrieved_episodes.join(', ')}
        </Text>
      )}
      {message.quoted_verses && message.quoted_verses.length > 0 && (
        <Text style={styles.debugText}>
          Verses: {message.quoted_verses.join(', ')}
        </Text>
      )}
      {message.refusal_result && (
        <Text style={styles.debugText}>
          Refusal: {message.refusal_result.passed ? 'PASSED' : `FAILED (${message.refusal_result.failed_check})`}
        </Text>
      )}
      {message.raw_output && message.raw_output !== message.text && (
        <>
          <Text style={styles.debugLabel}>Raw output:</Text>
          <Text style={styles.debugText}>{message.raw_output}</Text>
        </>
      )}
    </View>
  );
}

function ThinkingIndicator() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.thinkingContainer, { opacity }]}>
      <Text style={styles.thinkingText}>Hanuman Ji is reflecting...</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 28,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#F1D8A6',
    textAlign: 'center',
    fontFamily: 'serif',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bubble: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    maxWidth: '90%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#F2D7B5',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#E8BB83',
  },
  smritiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37,23,17,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(242,174,61,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  speakerName: {
    fontSize: 12,
    color: '#F2AE3D',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#F7E5BE',
  },
  userText: {
    color: '#402015',
  },
  thinkingContainer: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(37,23,17,0.6)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(242,174,61,0.25)',
  },
  thinkingText: {
    fontSize: 14,
    color: '#E3C98F',
    fontStyle: 'italic',
  },
  debugContainer: {
    marginLeft: 4,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#2D201A',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F2AE3D',
  },
  debugLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F5A623',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  debugText: {
    fontSize: 12,
    color: '#E6CFAC',
    lineHeight: 18,
    marginBottom: 2,
  },
});
