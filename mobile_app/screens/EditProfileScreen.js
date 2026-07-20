import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const EditProfileScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: 'Learner Name',
    email: 'learner@email.com',
    phone: '+1 234 567 8900',
    dateOfBirth: 'January 1, 2000',
    studentId: 'LEA123456',
    course: 'Gesture informatives',
    yearLevel: 'Intermediate',
   
  });


  const handleBackPress = () => {
    navigation.navigate('StudentDashboard');
  };

  const handleSaveChanges = () => {
    // Here you would typically save the data to your backend
    Alert.alert(
      'Success',
      'Profile updated successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Profile'),
        },
      ]
    );
  };

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
        <Text style={styles.headerTitle}>Edit Profile</Text>

        {/* Right - Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              <Text style={styles.profilePictureText}>👤</Text>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Personal Information */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.fullName}
                onChangeText={(text) => updateField('fullName', text)}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput
                style={styles.textInput}
                value={formData.dateOfBirth}
                onChangeText={(text) => updateField('dateOfBirth', text)}
                placeholder="Enter your date of birth"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Academic Information */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Academic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Learner ID</Text>
              <TextInput
                value={formData.studentId}
                onChangeText={(text) => updateField('studentId', text)}
                placeholder="Enter your Learner ID"
                placeholderTextColor="#999"
                editable={false}
                style={[styles.textInput, styles.disabledInput]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course</Text>
              <TextInput
                style={styles.textInput}
                value={formData.course}
                onChangeText={(text) => updateField('course', text)}
                placeholder="Enter your course"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Year Level</Text>
              <TextInput
                style={styles.textInput}
                value={formData.yearLevel}
                onChangeText={(text) => updateField('yearLevel', text)}
                placeholder="Enter your year level"
                placeholderTextColor="#999"
              />
            </View>
  
          </View>

          {/* Additional Settings */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Additional Settings</Text>
            
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>Privacy Settings</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingRow}>
              <Text style={styles.settingLabel}>Notification Preferences</Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
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
  saveButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#2D479D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2D479D',
  },
  profilePictureText: {
    fontSize: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#2D479D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  cameraIcon: {
    fontSize: 16,
    color: 'white',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 18,
    color: '#2D479D',
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
