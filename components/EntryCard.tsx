import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface DiaryEntry {
  id: string;
  timestamp: string;
  audioUri: string;
  rawTranscript: string;
  cleanedTranscript: string;
}

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

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Text style={styles.date}>{formatDate(entry.timestamp)}</Text>
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
  date: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'System',
    fontWeight: '400',
    marginBottom: 8,
  },
  snippet: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'System',
    lineHeight: 24,
  },
}); 