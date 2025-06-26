import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EntryCard } from '../components/EntryCard';
import { RecordingModal } from '../components/RecordingModal';
import { DiaryEntry, storageService } from '../utils/storage';

export default function HomeScreen() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isRecordingModalVisible, setIsRecordingModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = async () => {
    try {
      const loadedEntries = await storageService.getAllEntries();
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  const handleSaveRecording = async (
    audioUri: string,
    rawTranscript: string,
    cleanedTranscript: string
  ) => {
    try {
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        audioUri,
        rawTranscript,
        cleanedTranscript,
      };

      await storageService.saveEntry(newEntry);
      setEntries(prev => [newEntry, ...prev]);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const renderEntry = ({ item }: { item: DiaryEntry }) => (
    <EntryCard entry={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>Your reflection begins here.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFDFE" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Reflections</Text>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          entries.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsRecordingModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#FDFDFE" />
      </TouchableOpacity>

      <RecordingModal
        visible={isRecordingModalVisible}
        onClose={() => setIsRecordingModalVisible(false)}
        onSave={handleSaveRecording}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFE',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    color: '#1A1A1A',
    fontFamily: 'System',
    fontWeight: '300',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 100,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#1A1A1A',
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2C3A61',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
