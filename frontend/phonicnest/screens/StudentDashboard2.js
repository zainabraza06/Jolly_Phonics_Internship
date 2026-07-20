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

const StudentDashboard2 = ({ navigation }) => {
  const handleBackPress = () => {
    navigation.navigate('StudentDashboard');
  };

  const handleMenuPress = (menuItem) => {
    // TODO: Implement menu item functionality
    console.log(`${menuItem} pressed`);
  };

  const handleTasks = () => {
    navigation.navigate('Tasks');
  };

  const handleUploadVideo = () => {
    navigation.navigate('UploadVideo');
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Section */}
      <View style={styles.header}>
        {/* Left - Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <View style={styles.backIcon}>
            <Text style={styles.backArrow}>←</Text>
            <View style={styles.backLines}>
              <View style={styles.backLine} />
              <View style={styles.backLine} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Center - User Profile */}
        <View style={styles.userProfile}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileText}>👤</Text>
          </View>
          <Text style={styles.userName}>Learner-name</Text>
        </View>

        {/* Center-Right - Robot Icon */}
        <View style={styles.robotContainer}>
          <View style={styles.robot}>
            <View style={styles.robotBody}>
              <View style={styles.robotEye} />
              <View style={styles.robotEye} />
            </View>
          </View>
        </View>

        {/* Right - Notification Button */}
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Left Sidebar Menu */}
        <View style={styles.sidebar}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleMenuPress('Dashboard')}
          >
            <View style={styles.menuIcon}>
              <View style={styles.gridIcon}>
                <View style={styles.gridRow}>
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                </View>
                <View style={styles.gridRow}>
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                </View>
                <View style={styles.gridRow}>
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                </View>
              </View>
            </View>
            <Text style={styles.menuText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleProfilePress}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.profileIconText}>👤</Text>
            </View>
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleMenuPress('Contact')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.contactIconText}>📖</Text>
            </View>
            <Text style={styles.menuText}>Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleMenuPress('Complaints')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.complaintsIconText}>💬</Text>
            </View>
            <Text style={styles.menuText}>Complaints</Text>
          </TouchableOpacity>

          {/* Spacing */}
          <View style={styles.menuSpacing} />

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleMenuPress('Help')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.helpIconText}>❓</Text>
            </View>
            <Text style={styles.menuText}>Help</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleMenuPress('Settings')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.settingsIconText}>⚙️</Text>
            </View>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleMenuPress('Log Out')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.logoutIconText}>🚪</Text>
            </View>
            <Text style={styles.menuText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Right Content Area */}
        <View style={styles.contentArea}>
          {/* Tasks Card */}
          <TouchableOpacity style={styles.card} onPress={handleTasks}>
            <View style={styles.cardIconContainer}>
              <View style={styles.tasksIcon}>
                <Text style={styles.tasksIconText}>📋</Text>
              </View>
            </View>
            <Text style={styles.cardText}>Tasks</Text>
          </TouchableOpacity>

          {/* Upload Video Card */}
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
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  backLines: {
    marginTop: 2,
  },
  backLine: {
    width: 16,
    height: 2,
    backgroundColor: 'white',
    marginVertical: 1,
    borderRadius: 1,
  },
  userProfile: {
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#808080',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  profileText: {
    fontSize: 18,
  },
  userName: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  robotContainer: {
    alignItems: 'center',
  },
  robot: {
    width: 30,
    height: 30,
    backgroundColor: '#87CEEB',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  robotBody: {
    flexDirection: 'row',
    gap: 4,
  },
  robotEye: {
    width: 6,
    height: 6,
    backgroundColor: '#FFA500',
    borderRadius: 3,
  },
  notificationButton: {
    backgroundColor: '#2D479D',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'white',
  },
  bellIcon: {
    fontSize: 16,
    color: 'white',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: width * 0.4,
    backgroundColor: 'white',
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridIcon: {
    width: 20,
    height: 20,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  gridCell: {
    width: 5,
    height: 5,
    backgroundColor: 'black',
    marginRight: 2,
  },
  profileIconText: {
    fontSize: 20,
  },
  contactIconText: {
    fontSize: 20,
  },
  complaintsIconText: {
    fontSize: 20,
  },
  helpIconText: {
    fontSize: 20,
  },
  settingsIconText: {
    fontSize: 20,
  },
  logoutIconText: {
    fontSize: 20,
  },
  menuText: {
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
  },
  menuSpacing: {
    height: 40,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    paddingTop: 30,
  },
  card: {
    backgroundColor: '#2D479D',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
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
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});

export default StudentDashboard2;
