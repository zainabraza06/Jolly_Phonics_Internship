import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { progressService } from '../services/firebase';

const { width, height } = Dimensions.get('window');

const CircularProgress = ({ size = 80, strokeWidth = 8, percent = 0, color = '#2D479D', label = '' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ 
      width: size, 
      height: size + 30, // Extra height for label
      justifyContent: 'flex-start', 
      alignItems: 'center' 
    }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F0F0F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.progressRingCenterFix}>
        <Text style={styles.progressPercentage}>{clamped}%</Text>
      </View>
      {label && (
        <Text style={[styles.progressLabel, { marginTop: 10 }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const UploadVideoScreen = ({ navigation }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedPhoneme, setSelectedPhoneme] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { user } = useAuth();

  const handleBackPress = () => {
    navigation.navigate('StudentDashboard');
  };

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const connected = await apiService.testConnection();
      setBackendConnected(connected);
      if (!connected) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to backend server. Please make sure the backend is running.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Backend connection check failed:', error);
      setBackendConnected(false);
    }
  };

  const handleSelectVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedVideo(file);
      setGradingResult(null); // Clear previous results
      console.log('Selected video:', file);
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  const handleCancelVideo = () => {
    setSelectedVideo(null);
    setSelectedPhoneme('');
    setGradingResult(null);
    setUploadProgress(0);
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  const handleUploadVideo = async () => {
    if (!selectedVideo) {
      Alert.alert('Error', 'Please select a video file');
      return;
    }

    if (!selectedPhoneme.trim()) {
      Alert.alert('Error', 'Please select a phoneme to practice');
      return;
    }

    // Re-check backend connection just before uploading
    try {
      const connectedNow = await apiService.testConnection();
      setBackendConnected(connectedNow);
      if (!connectedNow) {
        Alert.alert('Error', 'Backend server is not connected. Please make sure it is running and reachable on your network.');
        return;
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to verify backend connection.');
      return;
    }

    setIsUploading(true);
    const progressInterval = simulateProgress();

    try {
      // Create file object for upload
      const videoFile = {
        uri: selectedVideo.uri,
        type: selectedVideo.mimeType || 'video/mp4',
        name: selectedVideo.name || 'video.mp4',
      };

      console.log('Sending video file:', videoFile);
      console.log('Selected phoneme:', selectedPhoneme);

      // Send to backend for analysis
      const result = await apiService.gradePronunciation(videoFile, selectedPhoneme);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setGradingResult(result);
      
      // Save progress to Firebase if user is logged in
      if (user) {
        try {
          await progressService.saveAttempt(
            user.email,
            result.user_phoneme,
            result.audio_score,
            result.video_score,
            result.audio_top_match || null,
            result.video_top_match || null,
            result.is_correct,
            result.mismatch_message || null,
            result.detected_phoneme || null
          );
        } catch (error) {
          console.error('Failed to save progress:', error);
        }
      }
      
      setIsUploading(false);
      
    } catch (error) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to analyze video. Please try again.');
    }
  };

  const phonemes = [
    'ai', 'y', 'z','g', 's', 'c/k', 'qu'
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';  // Green for excellent
    if (score >= 60) return '#FF9800';  // Orange for good
    if (score >= 40) return '#FFC107';  // Yellow for fair
    if (score >= 20) return '#FF5722';  // Red-orange for poor
    return '#F44336';  // Red for very poor
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Left - Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <View style={styles.backIcon}>
            <Text style={styles.backArrow}>←</Text>
          </View>
        </TouchableOpacity>

        {/* Center - Title */}
        <Text style={styles.headerTitle}>Upload Video</Text>

        {/* Right - Upload Button */}
        <TouchableOpacity 
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]} 
          onPress={handleUploadVideo}
          disabled={isUploading}
        >
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Analyzing...' : 'Upload'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upload Video Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Preview Section */}
        <View style={styles.videoPreviewSection}>
          <View style={styles.videoPreviewContainer}>
            <View style={styles.videoPreview}>
              <Text style={styles.videoPreviewIcon}>🎥</Text>
              <Text style={styles.videoPreviewText}>
                {selectedVideo ? selectedVideo.name : 'No video selected'}
              </Text>
              {selectedVideo && (
                <Text style={styles.videoInfoText}>
                  Size: {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              )}
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.selectVideoButton} onPress={handleSelectVideo}>
                <Text style={styles.selectVideoButtonText}>
                  {selectedVideo ? 'Change Video' : 'Select Video'}
                </Text>
              </TouchableOpacity>
              {selectedVideo && (
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelVideo}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Phoneme Selection */}
        <View style={styles.formSection}>
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Select Phoneme to Practice</Text>
            <View style={styles.categoryContainer}>
              {phonemes.map((phoneme) => (
                <TouchableOpacity
                  key={phoneme}
                  style={[
                    styles.categoryChip,
                    selectedPhoneme === phoneme && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedPhoneme(phoneme)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedPhoneme === phoneme && styles.categoryChipTextSelected,
                    ]}
                  >
                    {phoneme}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Analysis Progress</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {uploadProgress < 30 && 'Extracting audio and video...'}
                {uploadProgress >= 30 && uploadProgress < 60 && 'Analyzing pronunciation...'}
                {uploadProgress >= 60 && uploadProgress < 90 && 'Processing results...'}
                {uploadProgress >= 90 && 'Finalizing analysis...'}
              </Text>
            </View>
          )}

          {/* Results Section */}
          {gradingResult && !isUploading && (
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Analysis Results</Text>
              
              {/* Selected Phoneme */}
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Selected Phoneme:</Text>
                <Text style={styles.resultValue}>{gradingResult.user_phoneme}</Text>
              </View>

              {/* Mismatch Message */}
              {gradingResult.mismatch_message && (
                <View style={styles.mismatchContainer}>
                  <Text style={styles.mismatchText}>{gradingResult.mismatch_message}</Text>
                </View>
              )}

              {/* Progress Circles */}
              <View style={styles.progressCirclesContainer}>
                <CircularProgress 
                  size={80} 
                  strokeWidth={8} 
                  percent={gradingResult.audio_score} 
                  color={getScoreColor(gradingResult.audio_score)}
                  label="Audio"
                />
                <CircularProgress 
                  size={80} 
                  strokeWidth={8} 
                  percent={gradingResult.video_score} 
                  color={getScoreColor(gradingResult.video_score)}
                  label="Video"
                />
              </View>

              {/* Top Matches */}
              {(gradingResult.audio_top_match || gradingResult.video_top_match) && (
                <View style={styles.topMatchesContainer}>
                  <Text style={styles.topMatchesTitle}>Best Matches:</Text>
                  {gradingResult.audio_top_match && (
                    <Text style={styles.topMatchText}>
                      Audio: {gradingResult.audio_top_match}
                    </Text>
                  )}
                  {gradingResult.video_top_match && (
                    <Text style={styles.topMatchText}>
                      Video: {gradingResult.video_top_match}
                    </Text>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.resultActions}>
                <TouchableOpacity 
                  style={styles.viewProgressButton}
                  onPress={() => navigation.navigate('Progress')}
                >
                  <Text style={styles.viewProgressButtonText}>View Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tryAgainButton}
                  onPress={() => {
                    setGradingResult(null);
                    setSelectedVideo(null);
                    setSelectedPhoneme('');
                    setUploadProgress(0);
                  }}
                >
                  <Text style={styles.tryAgainButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2D479D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  uploadButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  uploadButtonText: {
    color: '#2D479D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  videoPreviewSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  videoPreviewContainer: {
    alignItems: 'center',
  },
  videoPreview: {
    width: 280,
    height: 180,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  videoPreviewIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  videoPreviewText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  selectVideoButton: {
    backgroundColor: '#2D479D',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  selectVideoButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#2D479D',
    borderColor: '#2D479D',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2D479D',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  videoInfoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  // New styles for results
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    color: '#2D479D',
    fontWeight: 'bold',
  },
  mismatchContainer: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  mismatchText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  progressCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    alignItems: 'flex-start',
    minHeight: 120,
    paddingHorizontal: 20,
  },
  progressRingCenterFix: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D479D',
    textAlign: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
  },
  topMatchesContainer: {
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  topMatchesTitle: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  topMatchText: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 4,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  viewProgressButton: {
    flex: 1,
    backgroundColor: '#2D479D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewProgressButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tryAgainButton: {
    flex: 1,
    backgroundColor: '#6C757D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default UploadVideoScreen;

