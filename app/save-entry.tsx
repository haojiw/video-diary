import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiService } from '../utils/apiService';
import { DiaryEntry, storageService } from '../utils/storage';

export default function SaveEntryScreen() {
  const { recordingUri, recordingMode } = useLocalSearchParams<{
    recordingUri: string;
    recordingMode: 'video' | 'audio';
  }>();

  const [isProcessing, setIsProcessing] = useState(true);
  const [currentStep, setCurrentStep] = useState('transcribing');

  useEffect(() => {
    if (!recordingUri) {
      Alert.alert('Error', 'No recording found.');
      router.back();
      return;
    }

    processRecording();
  }, [recordingUri]);

  const processRecording = async () => {
    try {
      setIsProcessing(true);
      setCurrentStep('transcribing');

      // Step 1: Transcribe using the service
      const transcript = await apiService.transcribeAudio(recordingUri);

      setCurrentStep('cleaning');

      // Step 2: Clean transcript using the service
      const cleaned = await apiService.cleanTranscript(transcript);

      setCurrentStep('saving');

      // Step 3: Save entry
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        audioUri: recordingUri,
        rawTranscript: transcript,
        cleanedTranscript: cleaned,
        type: recordingMode,
      };

      await storageService.saveEntry(newEntry);

      setCurrentStep('complete');
      setIsProcessing(false);

      // Navigate back to home after a brief delay
      setTimeout(() => {
        router.replace('/');
      }, 1500);

    } catch (error: any) {
      console.error('Error processing recording:', error);
      setIsProcessing(false);
      Alert.alert(
        'Processing Failed',
        `An error occurred: ${error.message || 'Please try again.'}`, // Display a more specific error
        [
          { text: 'Try Again', onPress: processRecording },
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
        ]
      );
    }
  };

  const getStepText = () => {
    switch (currentStep) {
      case 'transcribing':
        return recordingMode === 'video' 
          ? 'Transcribing your video...' 
          : 'Transcribing your audio...';
      case 'cleaning':
        return 'Organizing your thoughts...';
      case 'saving':
        return 'Saving your reflection...';
      case 'complete':
        return 'Complete! ✨';
      default:
        return 'Processing...';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'transcribing':
        return 'mic';
      case 'cleaning':
        return 'create';
      case 'saving':
        return 'save';
      case 'complete':
        return 'checkmark-circle';
      default:
        return 'ellipsis-horizontal';
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Processing?',
      'This will discard your recording. Are you sure?',
      [
        {
          text: 'Continue Processing',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFDFE" />
      
      {isProcessing && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <View style={styles.processingContainer}>
          <View style={styles.iconContainer}>
            {currentStep === 'complete' ? (
              <Ionicons 
                name={getStepIcon()} 
                size={80} 
                color="#2C3A61" 
              />
            ) : (
              <>
                <ActivityIndicator size="large" color="#2C3A61" />
                <Ionicons 
                  name={getStepIcon()} 
                  size={32} 
                  color="#2C3A61" 
                  style={styles.stepIcon}
                />
              </>
            )}
          </View>
          
          <Text style={styles.processingText}>{getStepText()}</Text>
          
          {currentStep !== 'complete' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    {
                      width: 
                        currentStep === 'transcribing' ? '33%' :
                        currentStep === 'cleaning' ? '66%' :
                        currentStep === 'saving' ? '90%' : '100%'
                    }
                  ]} 
                />
              </View>
            </View>
          )}

          {currentStep === 'complete' && (
            <Text style={styles.completeSubtext}>
              Your reflection has been saved
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFE',
  },
  cancelButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  processingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIcon: {
    position: 'absolute',
  },
  processingText: {
    fontSize: 20,
    color: '#1A1A1A',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2C3A61',
    borderRadius: 2,
  },
  completeSubtext: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 16,
  },
}); 