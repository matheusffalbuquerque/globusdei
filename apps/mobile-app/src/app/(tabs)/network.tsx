import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NetworkScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rede Global</Text>
      <Text style={styles.subtitle}>Encontre conexões e iniciativas ao redor do mundo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
