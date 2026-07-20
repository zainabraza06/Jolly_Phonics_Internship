import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const StudentDashboard = ({ navigation }) => {
  const handleHamburgerPress = () => {
    navigation.navigate('StudentDashboard2');
  };

  const handleRecordVideo = () => {
    // TODO: Implement record video functionality
    console.log('Record Video pressed');
  };

  const handleTasks = () => {
    navigation.navigate('Tasks');
  };

  const handleProgress = () => {
    navigation.navigate('Progress');
  };

  const handleUploadVideo = () => {
    navigation.navigate('UploadVideo');
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Left - Hamburger Menu */}
        <TouchableOpacity style={styles.hamburgerButton} onPress={handleHamburgerPress}>
          <View style={styles.hamburgerIcon}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>

        {/* Center - Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Hi! Learner-name</Text>
          <Text style={styles.waveEmoji}>👋</Text>
        </View>

        {/* Right - Notifications and Profile */}
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileText}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {/* Four Cards Grid - Vertical Zig-Zag Pattern */}
        <View style={styles.cardsGrid}>
          {/* Row 1: Record Video - Left Aligned */}
          <View style={styles.cardRow}>
            <TouchableOpacity style={styles.card} onPress={handleRecordVideo}>
              <View style={styles.cardIconContainer}>
                <View style={styles.recordVideoIcon}>
                  <Text style={styles.cameraIcon}>🎥</Text>
                </View>
              </View>
              <Text style={styles.cardText}>Record Video</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Tasks - Right Aligned */}
          <View style={styles.cardRow}>
            <View style={styles.rightAlignedCard}>
              <TouchableOpacity style={styles.card} onPress={handleTasks}>
                <View style={styles.cardIconContainer}>
                  <View style={styles.tasksIcon}>
                    <Text style={styles.tasksIconText}>📋</Text>
                  </View>
                </View>
                <Text style={styles.cardText}>Tasks</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 3: Progress - Left Aligned */}
          <View style={styles.cardRow}>
            <TouchableOpacity style={styles.card} onPress={handleProgress}>
              <View style={styles.cardIconContainer}>
                <View style={styles.progressIcon}>
                  <Text style={styles.progressIconText}>📊</Text>
                </View>
              </View>
              <Text style={styles.cardText}>Progress</Text>
            </TouchableOpacity>
          </View>

          {/* Row 4: Upload Video - Right Aligned */}
          <View style={styles.cardRow}>
            <View style={styles.rightAlignedCard}>
              <TouchableOpacity style={styles.card} onPress={handleUploadVideo}>
                <View style={styles.cardIconContainer}>
                  <View style={styles.uploadIcon}>
                    <Text style={styles.uploadIconText}>📤</Text>
                  </View>
                </View>
                <Text style={styles.cardText}>Upload Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
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
  hamburgerButton: {
    padding: 5,
  },
  hamburgerIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 24,
    height: 3,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  waveEmoji: {
    fontSize: 16,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
  },
  bellIcon: {
    fontSize: 20,
    color: 'white',
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 16,
  },
  contentArea: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  cardsGrid: {
    flex: 1,
    paddingVertical: 10,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  rightAlignedCard: {
    flex: 1,
    alignItems: 'flex-end',
  },
  card: {
    width: (width - 60) / 2,
    backgroundColor: '#2D479D',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  recordVideoIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
  },
  cameraIcon: {
    fontSize: 32,
  },
  tasksIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
  },
  tasksIconText: {
    fontSize: 32,
  },
  progressIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
  },
  progressIconText: {
    fontSize: 32,
  },
  uploadIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
  },
  uploadIconText: {
    fontSize: 32,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});                   export default StudentDashboard;  