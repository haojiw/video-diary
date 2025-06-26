import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { AudioPlayer } from '../../components/AudioPlayer';
import { DiaryEntry, storageService } from '../../utils/storage';

type TranscriptMode = 'cleaned' | 'raw';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [transcriptMode, setTranscriptMode] = useState<TranscriptMode>('cleaned');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    if (!id) return;
    
    try {
      const loadedEntry = await storageService.getEntryById(id);
      setEntry(loadedEntry);
    } catch (error) {
      console.error('Error loading entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FDFDFE" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2C3A61" />
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FDFDFE" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Entry not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFDFE" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(entry.timestamp)}</Text>
        </View>

        <AudioPlayer audioUri={entry.audioUri} />

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setTranscriptMode('cleaned')}
          >
            <Text
              style={[
                styles.toggleText,
                transcriptMode === 'cleaned' && styles.toggleTextActive,
              ]}
            >
              Cleaned
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setTranscriptMode('raw')}
          >
            <Text
              style={[
                styles.toggleText,
                transcriptMode === 'raw' && styles.toggleTextActive,
              ]}
            >
              Raw
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transcriptContainer}>
          <Text style={styles.transcript}>
            {transcriptMode === 'cleaned' ? entry.cleanedTranscript : entry.rawTranscript}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  errorText: {
    fontSize: 18,
    color: '#1A1A1A',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2C3A61',
    fontFamily: 'System',
  },
  dateContainer: {
    marginBottom: 16,
  },
  date: {
    fontSize: 18,
    color: '#1A1A1A',
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.7,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 48,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  toggleText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'System',
    opacity: 0.5,
  },
  toggleTextActive: {
    opacity: 1,
    fontWeight: '600',
    textDecorationLine: 'underline',
    color: '#2C3A61',
  },
  transcriptContainer: {
    paddingHorizontal: 16,
  },
  transcript: {
    fontSize: 18,
    color: '#1A1A1A',
    fontFamily: 'System',
    lineHeight: 28,
    textAlign: 'left',
  },
}); 