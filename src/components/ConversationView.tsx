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

  useEffect(() => {
    // Scroll to bottom on new message
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          What is on your mind?{'\n'}I am here to listen.
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
      {!isUser && <Text style={styles.speakerName}>Smriti</Text>}
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
      <Text style={styles.thinkingText}>Smriti is reflecting...</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 28,
  },
  bubble: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    maxWidth: '90%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#F5EDE0',
    borderBottomRightRadius: 4,
  },
  smritiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  speakerName: {
    fontSize: 12,
    color: '#B8860B',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#3E2723',
  },
  userText: {
    color: '#5D4037',
  },
  thinkingContainer: {
    alignSelf: 'flex-start',
    padding: 12,
  },
  thinkingText: {
    fontSize: 14,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  debugContainer: {
    marginLeft: 4,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F5A623',
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
    color: '#795548',
    lineHeight: 18,
    marginBottom: 2,
  },
});
