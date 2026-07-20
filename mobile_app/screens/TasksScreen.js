import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const TasksScreen = ({ navigation }) => {
  const [tasks] = useState([
    {
      id: '1',
      title: 'Complete Mathematics Assignment',
      description: 'Solve all problems in Chapter 5',
      dueDate: '2024-01-15',
      priority: 'High',
      status: 'Pending',
      subject: 'Mathematics',
    },
    {
      id: '2',
      title: 'Write Literature Essay',
      description: 'Analyze the theme of love in Romeo and Juliet',
      dueDate: '2024-01-18',
      priority: 'Medium',
      status: 'In Progress',
      subject: 'Literature',
    },
    {
      id: '3',
      title: 'Science Lab Report',
      description: 'Document the chemical reaction experiment',
      dueDate: '2024-01-20',
      priority: 'High',
      status: 'Completed',
      subject: 'Science',
    },
    {
      id: '4',
      title: 'Computer Science Project',
      description: 'Build a simple calculator app',
      dueDate: '2024-01-25',
      priority: 'Medium',
      status: 'Pending',
      subject: 'Computer Science',
    },
    {
      id: '5',
      title: 'History Presentation',
      description: 'Prepare slides on World War II',
      dueDate: '2024-01-22',
      priority: 'Low',
      status: 'In Progress',
      subject: 'History',
    },
  ]);

  const handleBackPress = () => {
    navigation.navigate('StudentDashboard');
  };

  const handleAddTask = () => {
    alert('Will be available in future version');
  };

  const handleTaskPress = (task) => {
    alert('Will be available in future version');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#FF6B6B';
      case 'Medium':
        return '#FFA726';
      case 'Low':
        return '#66BB6A';
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
      case 'Pending':
        return '#FFA726';
      default:
        return '#999';
    }
  };

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => handleTaskPress(item)}
    >
      <View style={styles.taskHeader}>
        <View style={styles.subjectTag}>
          <Text style={styles.subjectText}>{item.subject}</Text>
        </View>
        <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      
      <View style={styles.taskFooter}>
        <View style={styles.dueDateContainer}>
          <Text style={styles.dueDateLabel}>Due:</Text>
          <Text style={styles.dueDateText}>{item.dueDate}</Text>
        </View>
        <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Tasks</Text>

        {/* Right - Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tasks Content */}
      <View style={styles.content}>
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tasksList}
        />

        {/* Empty list for now */}
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
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 20,
    color: '#2D479D',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
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
  tasksSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tasksList: {
    paddingBottom: 20,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  priorityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  dueDateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
});

export default TasksScreen;
