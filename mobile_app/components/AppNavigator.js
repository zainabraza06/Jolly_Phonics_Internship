import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import LoginSuccessScreen from '../screens/LoginSuccessScreen';
import SignUpSuccessScreen from '../screens/SignUpSuccessScreen';
import RolesScreen from '../screens/RolesScreen';
import AdminDashboard from '../screens/AdminDashboard';
import InstructorDashboard from '../screens/InstructorDashboard';
import StudentDashboard from '../screens/StudentDashboard';
import StudentDashboard2 from '../screens/StudentDashboard2';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UploadVideoScreen from '../screens/UploadVideoScreen';
import TasksScreen from '../screens/TasksScreen';
import ProgressScreen from '../screens/ProgressScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="LoginSuccess"
          component={LoginSuccessScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SignUpSuccess"
          component={SignUpSuccessScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Roles"
          component={RolesScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="InstructorDashboard"
          component={InstructorDashboard}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="StudentDashboard"
          component={StudentDashboard}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="StudentDashboard2"
          component={StudentDashboard2}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="UploadVideo"
          component={UploadVideoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Progress"
          component={ProgressScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
