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

const RolesScreen = ({ navigation }) => {
  const handleAdminPress = () => {
    navigation.navigate('AdminDashboard');
  };

  const handleLearnerPress = () => {
    navigation.navigate('StudentDashboard');
  };

  const handleInstructorPress = () => {
    navigation.navigate('InstructorDashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <View style={styles.backIcon}>
          <Text style={styles.backArrow}>←</Text>
        </View>
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select the role that best describes you</Text>
      </View>

      {/* Role Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.roleButton} onPress={handleAdminPress}>
          <View style={styles.roleIconContainer}>
            <Text style={styles.roleIcon}>👨‍💼</Text>
          </View>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleButtonText}>Admin</Text>
            <Text style={styles.roleDescription}>Manage system & users</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.roleButton} onPress={handleLearnerPress}>
          <View style={styles.roleIconContainer}>
            <Text style={styles.roleIcon}>🎓</Text>
          </View>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleButtonText}>Learner</Text>
            <Text style={styles.roleDescription}>Learn & practice skills</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.roleButton} onPress={handleInstructorPress}>
          <View style={styles.roleIconContainer}>
            <Text style={styles.roleIcon}>👩‍🏫</Text>
          </View>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleButtonText}>Instructor</Text>
            <Text style={styles.roleDescription}>Teach & guide students</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorativeContainer}>
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeCircle} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D479D',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D479D',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  roleButton: {
    width: width - 40,
    height: 90,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    paddingHorizontal: 20,
  },
  roleIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#2D479D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  roleIcon: {
    fontSize: 26,
  },
  roleTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D479D',
    marginBottom: 4,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2D479D',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  decorativeContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
});

export default RolesScreen;
