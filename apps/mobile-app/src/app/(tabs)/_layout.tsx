import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Users, Briefcase, Bell, Search, LayoutGrid } from 'lucide-react-native';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import TopBar from '../../components/TopBar';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <TopBar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#8d472e',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            backgroundColor: '#ffffff',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="network"
          options={{
            title: 'Rede',
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="actions"
          options={{
            title: 'Ações',
            tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notificações',
            tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="opportunities"
          options={{
            title: 'Oportunidades',
            tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
