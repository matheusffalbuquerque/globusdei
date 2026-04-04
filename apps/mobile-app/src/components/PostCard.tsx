import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, Repeat2, Share2, Heart, MoreHorizontal } from 'lucide-react-native';

interface PostCardProps {
  author: string;
  role: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
}

export default function PostCard({ author, role, content, time, likes, comments }: PostCardProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{author[0]}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>{author}</Text>
          <Text style={styles.authorRole}>{role}</Text>
          <Text style={styles.postTime}>{time}</Text>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.contentText}>{content}</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
           <Heart size={14} color="#ef4444" fill="#ef4444" />
           <Text style={styles.statText}>{likes}</Text>
        </View>
        <Text style={styles.statText}>{comments} comentários</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Heart size={20} color="#6b7280" />
          <Text style={styles.actionText}>Apoiar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MessageSquare size={20} color="#6b7280" />
          <Text style={styles.actionText}>Comentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Repeat2 size={20} color="#6b7280" />
          <Text style={styles.actionText}>Reenviar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={20} color="#6b7280" />
          <Text style={styles.actionText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 0, // LinkedIn cards often span full width on mobile or have minimal border
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8d472e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  authorRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  postTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 12,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
});
