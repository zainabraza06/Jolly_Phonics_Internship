import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from AsyncStorage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const removeUserFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  };

  const signUp = async (email, displayName = '') => {
    try {
      setError(null);
      const existing = await userService.getUser(email);
      if (existing) {
        const err = new Error('Email already registered. Please log in.');
        setError(err);
        throw err;
      }
      const result = await userService.createUser(email, displayName);
      const userData = result.user;
      setUser(userData);
      await saveUserToStorage(userData);
      return result;
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const signIn = async (email) => {
    try {
      setError(null);
      const existing = await userService.getUser(email);
      if (!existing) {
        const err = new Error('User not registered. Please sign up first.');
        setError(err);
        throw err;
      }
      setUser(existing);
      await saveUserToStorage(existing);
      return { success: true, user: existing };
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setUser(null);
      await removeUserFromStorage();
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
