import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Animated,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Directions, Gesture, GestureDetector, Swipeable } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { EntryCard } from '../components/EntryCard';
import { DiaryEntry, storageService } from '../utils/storage';

export default function HomeScreen() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
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

  const navigateToRecord = () => {
    router.push('/record');
  };

  const handleDelete = async (id: string) => {
    try {
      await storageService.deleteEntry(id);
      // Optimistically update UI
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Failed to delete entry:', error);
      // Optionally, show an alert to the user
    }
  };

  // Create gesture for swipe left navigation
  const swipeGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      runOnJS(navigateToRecord)();
    });

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, id: string) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(id)}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="trash-outline" size={28} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };
  
  const renderEntry = ({ item }: { item: DiaryEntry }) => (
    <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}>
      <EntryCard entry={item} />
    </Swipeable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>Your reflection begins here.</Text>
      <Text style={styles.hintText}>Swipe right to start recording →</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFDFE" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.cameraButton} onPress={navigateToRecord}>
          <Ionicons name="camera-outline" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Reflections</Text>
      </View>

      <GestureDetector gesture={swipeGesture}>
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
          // Ensure horizontal gestures don't interfere with vertical scrolling
          scrollEventThrottle={1}
        />
      </GestureDetector>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    left: 24,
    top: 20,
    padding: 8,
    zIndex: 1,
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
  hintText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.4,
    marginTop: 16,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
});
