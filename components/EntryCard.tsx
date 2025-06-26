import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DiaryEntry } from '../utils/storage';

interface EntryCardProps {
  entry: DiaryEntry;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSnippet = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const handlePress = () => {
    router.push(`/entry/${entry.id}`);
  };

  const getTypeIcon = () => {
    return entry.type === 'video' ? 'videocam' : 'mic';
  };

  const getTypeLabel = () => {
    return entry.type === 'video' ? 'Video' : 'Audio';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(entry.timestamp)}</Text>
        {entry.type && (
          <View style={styles.typeContainer}>
            <Ionicons 
              name={getTypeIcon()} 
              size={14} 
              color="#2C3A61" 
              style={styles.typeIcon}
            />
            <Text style={styles.typeLabel}>{getTypeLabel()}</Text>
          </View>
        )}
      </View>
      <Text style={styles.snippet}>{getSnippet(entry.cleanedTranscript)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FDFDFE',
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'System',
    fontWeight: '400',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeIcon: {
    marginRight: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#2C3A61',
    fontFamily: 'System',
    fontWeight: '500',
  },
  snippet: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'System',
    lineHeight: 24,
  },
}); 