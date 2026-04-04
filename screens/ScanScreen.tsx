import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function ScanScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.cameraIcon} accessibilityLabel="Camera icon">
          📷
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          Scan Receipt
        </Text>
        <Text style={styles.subtitle}>
          OCR receipt scanning via Claude API — Phase 2 (Week 5–6)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cameraIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
