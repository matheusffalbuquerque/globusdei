import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ActivityIndicator, StatusBar } from 'react-native';

/**
 * Utilizing 3000 as the mapped Local port referencing DataService inside Nx structure.
 * In a real mobile device, this must resolve to the IP address of the local machine.
 */
const API_BASE_URL = 'http://localhost:3000';

export default function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Core API Integration Logic
  // Mount-time fetch fetching the analytics/unstructured stats from the Mongo/Express Service
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('[Expo Mobile] Core API fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Mobile Top App Bar adhering identically to the Terracota Brand Primary */}
      <View style={styles.header}>
        <Text style={styles.title}>Globus Dei</Text>
        <Text style={styles.subtitle}>Tracker Financeiro de Missões</Text>
      </View>
      
      {/* Dynamic Data Content Panel */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#8d472e" />
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status do Core Backend</Text>
            <Text style={styles.cardText}>
              {data ? data.message : 'Falha na conexão com DataService API REST.'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',  // Mimicking bg-gray-50 from Tailwind Web
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#8d472e',  // Primary Brand Terracota
    borderBottomWidth: 1,
    borderBottomColor: '#7a3e28',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffdfdf',            // Brand Lighter Accent from Tailwind Config
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,             // Simulating rounded-lg / classic borders
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: '#4b5563',
  },
});
