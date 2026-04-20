import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Ambient scene for the conversation opening state.
 */
export function AmbientIllustration() {
  return (
    <View style={styles.container}>
      <View style={styles.haloLarge} />
      <View style={styles.haloMid} />
      <View style={styles.haloSmall} />
      <View style={styles.pillar} />
      <View style={styles.flameCore} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 136,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.22,
  },
  haloLarge: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#A8321F',
  },
  haloMid: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D95A1A',
  },
  haloSmall: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#F2AE3D',
  },
  pillar: {
    position: 'absolute',
    bottom: -50,
    width: 70,
    height: 92,
    borderRadius: 16,
    backgroundColor: '#3E2016',
  },
  flameCore: {
    position: 'absolute',
    width: 38,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#FCE7A6',
  },
});
