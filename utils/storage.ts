import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DiaryEntry {
  id: string;
  timestamp: string;
  audioUri: string;
  rawTranscript: string;
  cleanedTranscript: string;
  type?: 'video' | 'audio'; // Optional field for backward compatibility
}

const STORAGE_KEY = 'diary_entries';

export const storageService = {
  async getAllEntries(): Promise<DiaryEntry[]> {
    try {
      const entriesJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (!entriesJson) return [];
      
      const entries = JSON.parse(entriesJson);
      return entries.sort((a: DiaryEntry, b: DiaryEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error loading entries:', error);
      return [];
    }
  },

  async getEntryById(id: string): Promise<DiaryEntry | null> {
    try {
      const entries = await this.getAllEntries();
      return entries.find(entry => entry.id === id) || null;
    } catch (error) {
      console.error('Error loading entry:', error);
      return null;
    }
  },

  async saveEntry(entry: DiaryEntry): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const updatedEntries = [entry, ...entries];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  },

  async deleteEntry(id: string): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries));
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  },
}; 