import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const InstructorDashboard = ({ navigation }) => {
  const handleBackPress = () => {
    navigation.navigate('Roles');
  };

  const handleHamburgerPress = () => {
    alert('Will be available in future version');
  };

  const handleNotificationPress = () => {
    alert('Will be available in future version');
  };

  const handleProfilePress = () => {
    alert('Will be available in future version');
  };

  const handleAssignTasksPress = () => {
    alert('Will be available in future version');
  };

  const handleTotalStudentsPress = () => {
    alert('Will be available in future version');
  };

  const handleProgressOverviewPress = () => {
    alert('Will be available in future version');
  };

  const handleViewFullReportPress = () => {
    alert('Will be available in future version');
  };

  const handleStudentOptionsPress = () => {
    alert('Will be available in future version');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerButton} onPress={handleHamburgerPress}>
          <View style={styles.hamburgerIcon}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Hi, Instructor Name!</Text>

        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
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
        {/* Four Buttons Grid */}
        <View style={styles.buttonsGrid}>
          <TouchableOpacity style={styles.gridButton} onPress={handleAssignTasksPress}>
            <Text style={styles.gridButtonText}>Assign Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleTotalStudentsPress}>
            <Text style={styles.gridButtonText}>Total Students</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleProgressOverviewPress}>
            <Text style={styles.gridButtonText}>Progress overview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleViewFullReportPress}>
            <Text style={styles.gridButtonText}>View full report</Text>
          </TouchableOpacity>
        </View>

        {/* Separator Line */}
        <View style={styles.separatorLine} />

        {/* Student Highlights Section */}
        <View style={styles.studentHighlightsSection}>
          <Text style={styles.sectionTitle}>Student Highlights</Text>
          
          {/* Student List Card */}
          <View style={styles.studentListCard}>
            {/* Hira */}
            <View style={styles.studentItem}>
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>👧</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>Hira</Text>
                <Text style={styles.studentId}>ID #3124</Text>
              </View>
              <View style={styles.studentScores}>
                <Text style={styles.scoreText}>Pronunciation 92%</Text>
                <Text style={styles.scoreText}>Gesture 88%</Text>
              </View>
              <TouchableOpacity style={styles.optionsButton} onPress={handleStudentOptionsPress}>
                <Text style={styles.optionsIcon}>⋯</Text>
              </TouchableOpacity>
            </View>

            {/* Aqsa */}
            <View style={styles.studentItem}>
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>👩</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>Aqsa</Text>
                <Text style={styles.studentId}>ID #3124</Text>
              </View>
              <View style={styles.studentScores}>
                <Text style={styles.scoreText}>Pronunciation 77%</Text>
                <Text style={styles.scoreText}>Gesture 89%</Text>
              </View>
            </View>

            {/* Raza */}
            <View style={styles.studentItem}>
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>👨</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>Raza</Text>
                <Text style={styles.studentId}>ID #3124</Text>
              </View>
              <View style={styles.studentScores}>
                <Text style={styles.scoreText}>Pronunciation 55%</Text>
                <Text style={styles.scoreText}>Gesture 90%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <View style={styles.backIcon}>
          <Text style={styles.backArrow}>←</Text>
        </View>
      </TouchableOpacity>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  gridButton: {
    width: (width - 60) / 2,
    height: 80,
    backgroundColor: '#2D479D',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  gridButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
  },
  separatorLine: {
    height: 2,
    backgroundColor: '#2D479D',
    marginBottom: 30,
  },
  studentHighlightsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  studentListCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  studentAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 22,
  },
  studentInfo: {
    flex: 1,
    marginRight: 15,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 12,
    color: '#666',
  },
  studentScores: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 15,
  },
  scoreText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
    textAlign: 'right',
  },
  optionsButton: {
    padding: 5,
  },
  optionsIcon: {
    fontSize: 18,
    color: '#666',
  },
  backButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1,
  },
  backIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2D479D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default InstructorDashboard;
