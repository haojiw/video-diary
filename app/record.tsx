import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Dimensions, Linking, SafeAreaView,
  StatusBar, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

type RecordingMode = 'video' | 'audio';

export default function RecordScreen() {
  // State Management
  const [mode, setMode] = useState<RecordingMode>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [cameraType, setCameraType] = useState<CameraType>('front');

  // Preview State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<Video | null>(null);

  // Progress tracking
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Refs
  const cameraRef = useRef<CameraView>(null);
  const audioRecordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartTime = useRef<number>(0);

  // Resource management
  const isFocused = useIsFocused();

  // Constants
  const MINIMUM_RECORDING_DURATION = 1000; // 1 second in milliseconds

  // Permission handling
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setIsCheckingPermissions(true);
        const permissionsToRequest = [
          Audio.requestPermissionsAsync(),
        ];
        if (mode === 'video') {
          permissionsToRequest.push(Camera.requestCameraPermissionsAsync());
          permissionsToRequest.push(MediaLibrary.requestPermissionsAsync());
        }
        const statuses = await Promise.all(permissionsToRequest);
        const allGranted = statuses.every(result => result.status === 'granted');
        setHasPermission(allGranted);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
        Alert.alert('Error', 'Failed to check permissions. Please try again.');
      } finally {
        setIsCheckingPermissions(false);
      }
    };
    checkPermissions();
  }, [mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup audio recorder
      if (audioRecordingRef.current) {
        audioRecordingRef.current.stopAndUnloadAsync();
      }
      // Cleanup audio player
      if (sound) {
        sound.unloadAsync();
      }
      // Cleanup video
      if (videoRef) {
        videoRef.pauseAsync();
      }
    };
  }, [sound, videoRef]);

  const handleFlipCamera = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert('Permissions required', 'Please grant permissions to start recording.');
      return;
    }
    setRecordingUri(null);
    setIsRecording(true);
    recordingStartTime.current = Date.now();

    try {
      if (mode === 'video') {
        if (cameraRef.current) {
          // The promise resolves with the video URI when stopRecording is called
          cameraRef.current.recordAsync().then(video => {
            if (video) {
              setRecordingUri(video.uri);
            }
          });
        }
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        audioRecordingRef.current = recording;
      }
    } catch (error) {
      console.error('Failed to start recording', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    const recordingDuration = Date.now() - recordingStartTime.current;

    if (recordingDuration < MINIMUM_RECORDING_DURATION) {
      if (mode === 'video' && cameraRef.current) {
        cameraRef.current.stopRecording();
      }
      setRecordingUri(null); // Discard recording
      Alert.alert('Recording Too Short', 'Please record for at least 1 second.');
      return;
    }

    try {
      if (mode === 'video') {
        if (cameraRef.current) {
          cameraRef.current.stopRecording();
        }
      } else {
        if (audioRecordingRef.current) {
          await audioRecordingRef.current.stopAndUnloadAsync();
          const uri = audioRecordingRef.current.getURI();
          audioRecordingRef.current = null;
          if (uri) {
            setRecordingUri(uri);
          }
        }
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const handleNavigateToSave = async () => {
    if (!recordingUri) return;
    
    try {
      // STOP VIDEO/AUDIO BEFORE NAVIGATION
      if (mode === 'video' && videoRef) {
        await videoRef.pauseAsync();
        await videoRef.setPositionAsync(0);
      }
      if (mode === 'audio' && sound) {
        await sound.pauseAsync();
        await sound.setPositionAsync(0);
      }
      
      if (mode === 'video') {
        await MediaLibrary.saveToLibraryAsync(recordingUri);
      }
      router.push({ pathname: '/save-entry', params: { recordingUri, recordingMode: mode } });
    } catch (error) {
      console.error('Error processing recording:', error);
      Alert.alert('Error', 'Could not proceed with the recording.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      // We reset the state ONLY if there isn't a recording in progress.
      if (!isRecording) {
        handleRetake();
      }
    }, [isRecording]) // Dependency array
  );

  const handleRetake = () => {
    setRecordingUri(null);
    setCurrentPosition(0);
    setDuration(0);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    if (videoRef) {
      videoRef.pauseAsync();
      setVideoRef(null);
    }
    setIsPlaying(false);
  };

  const handleModeSwitch = (newMode: RecordingMode) => {
    if (isRecording) return;
    handleRetake(); // Discard any existing recording
    setMode(newMode);
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    router.back();
  };

  // Audio Preview Logic
  useEffect(() => {
    const loadSound = async () => {
      if (mode === 'audio' && recordingUri) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setDuration(status.durationMillis || 0);
              setCurrentPosition(status.positionMillis || 0);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setCurrentPosition(0);
              }
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    };
    loadSound();
  }, [recordingUri, mode]);

  const togglePlayback = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      // If at the end, restart from beginning
      if (currentPosition >= duration) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const onVideoLoad = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setIsPlaying(true);
    }
  };

  const onVideoStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis || 0);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentPosition(0);
      }
    }
  };

  const toggleVideoPlayback = async () => {
    if (!videoRef) return;
    if (isPlaying) {
      await videoRef.pauseAsync();
    } else {
      // If at the end, restart from beginning
      if (currentPosition >= duration) {
        await videoRef.setPositionAsync(0);
      }
      await videoRef.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const onSliderValueChange = async (value: number) => {
    const position = value * duration;
    setCurrentPosition(position);
    if (mode === 'video' && videoRef) {
      await videoRef.setPositionAsync(position);
    } else if (mode === 'audio' && sound) {
      await sound.setPositionAsync(position);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionText}>
            This app needs access to your camera and microphone to record. Please grant permissions in your device settings.
          </Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // PREVIEW SCREEN
  if (recordingUri) {
    return (
      <SafeAreaView style={styles.container}>
        {mode === 'video' ? (
          <>
            <Video
              ref={(ref) => setVideoRef(ref)}
              source={{ uri: recordingUri }}
              style={StyleSheet.absoluteFill}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              isLooping={false}
              shouldPlay={true}
              onLoad={onVideoLoad}
              onPlaybackStatusUpdate={onVideoStatusUpdate}
            />
            <TouchableOpacity style={styles.videoPlayButton} onPress={toggleVideoPlayback}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={50} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.audioPreviewContainer}>
            <Text style={styles.audioPreviewText}>Audio Recorded</Text>
            <TouchableOpacity onPress={togglePlayback}>
              <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={80} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={duration > 0 ? currentPosition / duration : 0}
            onSlidingComplete={onSliderValueChange}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="#fff"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={handleRetake}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNavigateToSave}>
          <Ionicons name="arrow-forward" size={32} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // RECORDING SCREEN
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      {mode === 'video' && (
        <TouchableOpacity style={styles.flipButton} onPress={handleFlipCamera}>
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {mode === 'video' ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          mode="video"
          videoQuality="1080p"
          active={isFocused}
        />
      ) : (
        <View style={styles.audioPlaceholder}>
            <Ionicons name="pulse" size={80} color={isRecording ? "#ff4444" : "#fff"} />
            <Text style={styles.audioModeText}>{isRecording ? "Recording..." : "Audio Mode"}</Text>
        </View>
      )}

      <View style={styles.controlsContainer}>
        <View style={styles.recordButtonContainer}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
          </TouchableOpacity>
        </View>

        <View style={[styles.modeContainer, isRecording && styles.disabled]}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}
            onPress={() => handleModeSwitch('video')}
            disabled={isRecording}
          >
            <Text style={[styles.modeText, mode === 'video' && styles.modeTextActive]}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'audio' && styles.modeButtonActive]}
            onPress={() => handleModeSwitch('audio')}
            disabled={isRecording}
          >
            <Text style={[styles.modeText, mode === 'audio' && styles.modeTextActive]}>Audio</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionTitle: { fontSize: 22, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  permissionText: { fontSize: 16, color: '#fff', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  settingsButton: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 25 },
  settingsButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  closeButton: { position: 'absolute', top: 60, left: 24, zIndex: 10, padding: 8 },
  flipButton: { position: 'absolute', top: 60, right: 24, zIndex: 10, padding: 8 },
  camera: { flex: 1 },
  audioPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  audioModeText: { color: '#fff', fontSize: 18, marginTop: 16 },
  controlsContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 50 },
  recordButtonContainer: { alignItems: 'center', marginBottom: 32 },
  recordButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'transparent', borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  recordButtonActive: { backgroundColor: '#ff4444', borderColor: '#ff4444' },
  recordButtonInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#ff4444' },
  recordButtonInnerActive: { width: 30, height: 30, borderRadius: 4, backgroundColor: '#fff' },
  modeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 25, padding: 4, alignSelf: 'center' },
  modeButton: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  modeButtonActive: { backgroundColor: '#fff' },
  modeText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  modeTextActive: { color: '#000' },
  disabled: { opacity: 0.5 },
  nextButton: { position: 'absolute', bottom: 60, right: 30, zIndex: 10 },
  audioPreviewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  audioPreviewText: { color: '#fff', fontSize: 24, marginBottom: 20 },
  videoPlayButton: { 
    position: 'absolute', 
    top: '50%', 
    left: '50%', 
    transform: [{ translateX: -25 }, { translateY: -25 }],
    zIndex: 5,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
}); 