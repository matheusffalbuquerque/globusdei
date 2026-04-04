import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Search, Calendar, User } from 'lucide-react-native';

export default function TopBar() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Profile Button */}
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.avatar}>
            <User size={20} color="#8d472e" />
          </View>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pessoas, iniciativas..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Calendar Button */}
        <TouchableOpacity style={styles.iconButton}>
          <Calendar size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        paddingTop: 8,
      },
      android: {
        paddingTop: 40, // Standard android status bar padding if not using SafeView
      }
    })
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffe5dd',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd0c1',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  iconButton: {
    padding: 4,
  },
});
