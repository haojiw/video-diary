import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AudioPlayerProps {
  audioUri: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUri }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playPauseAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          // If at the end, restart from beginning
          if (currentPosition >= duration) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        
        setSound(newSound);
        setIsPlaying(true);
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            setCurrentPosition(status.positionMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setCurrentPosition(0); // Reset to beginning when finished
            }
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const onSliderValueChange = async (value: number) => {
    if (!sound) return;
    const position = value * duration;
    setCurrentPosition(position);
    await sound.setPositionAsync(position);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playButton} onPress={playPauseAudio}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={24}
          color="#2C3A61"
        />
      </TouchableOpacity>
      
      {duration > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={duration > 0 ? currentPosition / duration : 0}
            onSlidingComplete={onSliderValueChange}
            minimumTrackTintColor="#2C3A61"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#2C3A61"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 24,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDFDFE',
    borderWidth: 2,
    borderColor: '#2C3A61',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
    color: '#2C3A61',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'center',
  },
}); 