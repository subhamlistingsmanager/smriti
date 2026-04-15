import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Soft ambient background — a warm glow suggesting a diya.
 * SVG illustrations will replace this in the design pass.
 */
export function AmbientIllustration() {
  return (
    <View style={styles.container}>
      <View style={styles.glowOuter} />
      <View style={styles.glowInner} />
      <View style={styles.flame} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.15,
  },
  glowOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F5A623',
  },
  glowInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F7C948',
  },
  flame: {
    position: 'absolute',
    width: 40,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFD700',
  },
});
