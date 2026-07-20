import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { progressService } from '../services/firebase';

const { width, height } = Dimensions.get('window');

const CircularProgress = ({ size = 100, strokeWidth = 10, percent = 0, color = '#2D479D' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
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
    </View>
  );
};

const ProgressScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        if (!user?.email) return;
        const stats = await progressService.getUserProgress(user.email);
        const recentAttempts = await progressService.getUserAttempts(user.email, 30);
        setUserStats(stats);
        setAttempts(recentAttempts);
      } catch (e) {
        console.error('Failed to load progress:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [user?.email]);

  const handleBackPress = () => {
    navigation.navigate('StudentDashboard');
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A':
        return '#66BB6A';
      case 'A-':
        return '#81C784';
      case 'B+':
        return '#42A5F5';
      case 'B':
        return '#64B5F6';
      case 'B-':
        return '#90CAF9';
      case 'C+':
        return '#FFA726';
      case 'C':
        return '#FFB74D';
      case 'C-':
        return '#FFCC02';
      default:
        return '#999';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#66BB6A';
      case 'In Progress':
        return '#42A5F5';
      default:
        return '#999';
    }
  };

  const renderCourseItem = ({ item }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseName}>{item.name}</Text>
        <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(item.grade) }]}>
          <Text style={styles.gradeText}>{item.grade}</Text>
        </View>
      </View>
      
      <View style={styles.courseDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Credits:</Text>
          <Text style={styles.detailValue}>{item.credits}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Score:</Text>
          <Text style={styles.detailValue}>{item.score}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const averageScore = useMemo(() => Number.isFinite(userStats?.averageScore) ? userStats.averageScore : 0, [userStats]);
  
  // Calculate averages from the last 5 attempts
  const last5Attempts = attempts.slice(0, 5);
  const audioScores = last5Attempts.map(a => Number(a.audioScore) || 0);
  const videoScores = last5Attempts.map(a => Number(a.videoScore) || 0);
  
  const averageAudioScore = audioScores.length > 0 ? Math.round(audioScores.reduce((sum, score) => sum + score, 0) / audioScores.length) : 0;
  const averageVideoScore = videoScores.length > 0 ? Math.round(videoScores.reduce((sum, score) => sum + score, 0) / videoScores.length) : 0;
  
  const phonicsPercent = Math.max(0, Math.min(100, averageAudioScore));
  const gesturesPercent = Math.max(0, Math.min(100, averageVideoScore));

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
        <Text style={styles.headerTitle}>Progress</Text>

        {/* Right - Share Button */}
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

             {/* Progress Content */}
       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                 {/* Skills Progress Rings - At the Top */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>Skills Progress</Text>
          <View style={styles.skillsRow}>
            {/* Phonics Progress Ring */}
            <View style={styles.skillCard}>
              <View style={styles.progressRingContainer}>
                <CircularProgress size={100} strokeWidth={10} percent={phonicsPercent} color="#2D479D" />
              </View>
              <Text style={styles.skillLabel}>Phonics</Text>
            </View>

            {/* Gestures Progress Ring */}
            <View style={styles.skillCard}>
              <View style={styles.progressRingContainer}>
                <CircularProgress size={100} strokeWidth={10} percent={gesturesPercent} color="#1E88E5" />
              </View>
              <Text style={styles.skillLabel}>Gestures</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.recentActivitySection}>
          <View style={styles.recentActivityCard}>
            <Text style={styles.recentActivityTitle}>Recent Activity</Text>
            <View style={styles.activityList}>
              {(attempts && attempts.length > 0) ? (
                attempts.slice(0, 5).map((a) => {
                  const dateStr = a.timestamp?.toDate ? a.timestamp.toDate().toLocaleDateString() : '';
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={styles.activityItem}
                                             onPress={() => {
                         // Show complete attempt details
                         let attemptDetails = `Attempt on ${dateStr}\nPhoneme: ${a.phoneme}\nAudio: ${a.audioScore}%\nVideo: ${a.videoScore}%\nCombined: ${a.combinedScore}%`;
                         
                         // Add mismatch info if available
                         if (a.mismatchMessage) {
                           attemptDetails += `\n\n${a.mismatchMessage}`;
                         }
                         
                         // Add top matches if available
                         if (a.audioTopMatch && a.audioScore < 50) {
                           attemptDetails += `\nAudio top match: ${a.audioTopMatch}`;
                         }
                         
                         if (a.videoTopMatch && a.videoScore < 50) {
                           attemptDetails += `\nVideo top match: ${a.videoTopMatch}`;
                         }
                         
                         // Add detected phoneme if different
                         if (a.detectedPhoneme && a.detectedPhoneme !== a.phoneme) {
                           attemptDetails += `\n\nSystem detected: ${a.detectedPhoneme}`;
                         }
                         
                         alert(attemptDetails);
                       }}
                    >
                      <Text style={styles.activityText}>Practiced Phoneme: {a.phoneme} — Score {a.combinedScore}%</Text>
                      <Text style={styles.activityDate}>{dateStr}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ textAlign: 'center', color: '#666' }}>No recent activity yet</Text>
              )}
            </View>
          </View>
        </View>
        {/* ...existing code... */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  progressRingNoBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
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
  shareButton: {
    padding: 5,
  },
  shareIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summarySection: {
    marginTop: 20,
    marginBottom: 20,
  },
  summaryCard: {
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#fff',
  },
  // phonicsProgressRingFill: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   width: 100,
  //   height: 100,
  //   borderRadius: 50,
  //   borderWidth: 10,
  //   borderColor: '#2D479D',
  //   borderTopColor: 'transparent',
  //   borderRightColor: 'transparent',
  //   backgroundColor: 'transparent',
  //   zIndex: 1,
  //   transform: [{ rotate: '-90deg' }],
  // },
  // gesturesProgressRingFill: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   width: 100,
  //   height: 100,
  //   borderRadius: 50,
  //   borderWidth: 10,
  //   borderColor: '#1E88E5',
  //   borderTopColor: 'transparent',
  //   borderRightColor: 'transparent',
  //   backgroundColor: 'transparent',
  //   zIndex: 1,
  //   transform: [{ rotate: '-90deg' }],
  // },
  progressRingCenterFix: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 80,
    height: 80,
    borderRadius: 40,
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
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D479D',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  coursesSection: {
    marginBottom: 30,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  courseDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  skillsSection: {
    marginBottom: 20,
  },
  skillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    alignItems: 'flex-start',
  },
  skillCard: {
    alignItems: 'center',
    width: '48%',
  },
  progressRingContainer: {
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'center',
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressRingFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
    borderColor: '#2D479D',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-90deg' }],
  },
  phonicsProgressRingFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
    borderColor: '#2D479D',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-90deg' }],
  },
  gesturesProgressRingFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
    borderColor: '#1E88E5',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-90deg' }],
  },
  progressRingCenterFix: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 80,
    height: 80,
    borderRadius: 40,
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
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D479D',
    textAlign: 'center',
  },
  skillLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  recentActivitySection: {
    marginBottom: 20,
  },
  recentActivityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  activityList: {
    gap: 15,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
});

export default ProgressScreen;
