'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('phonicnest_user');
      if (saved) setUser(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const saveUser = (userData) => {
    try { localStorage.setItem('phonicnest_user', JSON.stringify(userData)); } catch {}
    setUser(userData);
  };

  const signUp = async (email, displayName = '') => {
    setError(null);
    const existing = await userService.getUser(email);
    if (existing) throw new Error('Email already registered. Please log in.');
    const result = await userService.createUser(email, displayName);
    saveUser(result.user);
    return result;
  };

  const signIn = async (email) => {
    setError(null);
    const existing = await userService.getUser(email);
    if (!existing) throw new Error('User not registered. Please sign up first.');
    saveUser(existing);
    return { success: true, user: existing };
  };

  const signOut = () => {
    try { localStorage.removeItem('phonicnest_user'); } catch {}
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp, signIn, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
