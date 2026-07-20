import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const handleBackPress = () => {
    navigation.navigate('Roles');
  };

  const handleHamburgerPress = () => {
    // TODO: Implement hamburger menu functionality
    console.log('Hamburger menu pressed');
  };

  const handleNotificationPress = () => {
    // TODO: Implement notification functionality
    console.log('Notification pressed');
  };

  const handleProfilePress = () => {
    // TODO: Implement profile functionality
    console.log('Profile pressed');
  };

  const handleNewStudentsPress = () => {
    alert('Will be available in future version');
  };

  const handleTotalStudentsPress = () => {
    alert('Will be available in future version');
  };

  const handleRequestsPress = () => {
    alert('Will be available in future version');
  };

  const handleSuggestionsPress = () => {
    alert('Will be available in future version');
  };

  const handleStudentsListPress = () => {
    alert('Will be available in future version');
  };

  const handleTeachersListPress = () => {
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

        <Text style={styles.headerTitle}>Admin Dashboard</Text>

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
      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
        {/* Top Row - Large Buttons */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.largeButton} onPress={handleNewStudentsPress}>
            <Text style={styles.largeButtonText}>New Students</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.largeButton} onPress={handleTotalStudentsPress}>
            <Text style={styles.largeButtonText}>Total Students</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Row - Small Buttons */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.smallButton} onPress={handleRequestsPress}>
            <View style={styles.smallButtonContent}>
              <Text style={styles.smallButtonText}>Requests</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={handleSuggestionsPress}>
            <View style={styles.smallButtonContent}>
              <Text style={styles.smallButtonText}>Suggestions</Text>
              <Text style={styles.suggestionIcon}>💬</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Lists Section */}
        <View style={styles.listsSection}>
          {/* Students List */}
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Students List</Text>
              <TouchableOpacity onPress={handleStudentsListPress}>
                <Text style={styles.ellipsis}>⋯</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👧</Text>
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>Hira</Text>
                <Text style={styles.listItemId}>ID #3124</Text>
              </View>
            </View>
            <View style={[styles.listItem, styles.highlightedItem]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👩</Text>
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>Aqsa</Text>
                <Text style={styles.listItemId}>ID #3124</Text>
              </View>
            </View>
            <View style={styles.listItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👨</Text>
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>Raza</Text>
                <Text style={styles.listItemId}>ID #3124</Text>
              </View>
            </View>
            <View style={[styles.listItem, styles.highlightedItem]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👱‍♀️</Text>
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>Alia</Text>
                <Text style={styles.listItemId}>ID #3124</Text>
              </View>
            </View>
          </View>

          {/* Teachers List */}
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Teachers List</Text>
              <TouchableOpacity onPress={handleTeachersListPress}>
                <Text style={styles.ellipsis}>⋯</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👧</Text>
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>Hira</Text>
                <Text style={styles.listItemId}>ID #3124</Text>
              </View>
            </View>
            <View style={[styles.listItem, styles.highlightedItem]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👩</Text>
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>Aqsa</Text>
                <Text style={styles.listItemId}>ID #3124</Text>
              </View>
            </View>
            <View style={styles.listItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👨</Text>
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>Raza</Text>
                <Text style={styles.listItemId}>ID #3124</Text>
              </View>
            </View>
            <View style={[styles.listItem, styles.highlightedItem]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👱‍♀️</Text>
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>Alia</Text>
                <Text style={styles.listItemId}>ID #3124</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  largeButton: {
    width: (width - 60) / 2,
    height: 80,
    backgroundColor: '#2D479D',
    borderRadius: 15,
    justifyContent: 'center',
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
  largeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  smallButton: {
    width: (width - 60) / 2,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  smallButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
  },
  editIcon: {
    fontSize: 16,
  },
  suggestionIcon: {
    fontSize: 16,
  },
  listsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ellipsis: {
    fontSize: 20,
    color: '#666',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  highlightedItem: {
    backgroundColor: '#F0F0F0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  listItemId: {
    fontSize: 12,
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

export default AdminDashboard;
