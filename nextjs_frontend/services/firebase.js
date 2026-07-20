// Firebase Configuration and Services
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBK3zhyToaDrFm2CEgWWiClQoKQeta9nM4",
  authDomain: "phonics-app-7d7af.firebaseapp.com",
  projectId: "phonics-app-7d7af",
  storageBucket: "phonics-app-7d7af.firebasestorage.app",
  messagingSenderId: "89134790621",
  appId: "1:89134790621:web:e6a03a555b748c7622a834"
};

let app;
let db;

const getFirebaseApp = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return { app, db };
};

const getDb = () => {
  if (!db) {
    getFirebaseApp();
  }
  return db;
};

export const userService = {
  async createUser(email, displayName = '') {
    const database = getDb();
    const userId = email;
    const userData = {
      email,
      displayName: displayName || email.split('@')[0],
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      totalAttempts: 0,
      totalScore: 0,
      averageScore: 0,
      phonemesCompleted: [],
      progressHistory: [],
      currentStreak: 0,
      bestScore: 0,
      bestVideoScore: 0,
    };
    await setDoc(doc(database, 'users', userId), userData);
    return { success: true, user: { uid: userId, ...userData } };
  },

  async getUser(email) {
    const database = getDb();
    const userId = email;
    const userDoc = await getDoc(doc(database, 'users', userId));
    if (!userDoc.exists()) return null;
    return { uid: userId, ...userDoc.data() };
  },
};

export const progressService = {
  async saveAttempt(email, phoneme, audioScore, videoScore, audioTopMatch = null, videoTopMatch = null, isCorrect = true, mismatchMessage = null, detectedPhoneme = null) {
    const database = getDb();
    const userId = email;
    const attemptData = {
      userId,
      phoneme,
      audioScore: Number(audioScore),
      videoScore: Number(videoScore || 0),
      audioTopMatch,
      videoTopMatch,
      isCorrect,
      mismatchMessage,
      detectedPhoneme,
      timestamp: serverTimestamp(),
      combinedScore: Math.round((Number(audioScore) + Number(videoScore || 0)) / 2),
    };

    const attemptRef = await addDoc(collection(database, 'attempts'), attemptData);

    const userRef = doc(database, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const newTotalAttempts = (userData.totalAttempts || 0) + 1;
      const newTotalScore = (userData.totalScore || 0) + attemptData.combinedScore;
      const newAverageScore = Math.round(newTotalScore / newTotalAttempts);

      const phonemesCompleted = userData.phonemesCompleted || [];
      if (!phonemesCompleted.includes(phoneme)) {
        phonemesCompleted.push(phoneme);
      }

      const progressHistory = userData.progressHistory || [];
      progressHistory.push({
        attemptId: attemptRef.id,
        phoneme,
        audioScore: Number(audioScore),
        videoScore: Number(videoScore || 0),
        combinedScore: attemptData.combinedScore,
        isCorrect,
        mismatchMessage,
        detectedPhoneme,
        audioTopMatch,
        videoTopMatch,
        timestamp: Timestamp.now(),
      });

      if (progressHistory.length > 30) {
        progressHistory.splice(0, progressHistory.length - 30);
      }

      const currentStreak = this.calculateStreak(progressHistory);
      const bestScore = Math.max(userData.bestScore || 0, attemptData.combinedScore);

      await updateDoc(userRef, {
        totalAttempts: newTotalAttempts,
        totalScore: newTotalScore,
        averageScore: newAverageScore,
        phonemesCompleted,
        progressHistory,
        currentStreak,
        bestScore,
        lastAttempt: serverTimestamp(),
      });
    }

    return { success: true, attemptId: attemptRef.id };
  },

  calculateStreak(progressHistory) {
    if (!progressHistory || progressHistory.length === 0) return 0;
    let streak = 0;
    for (let i = progressHistory.length - 1; i >= 0; i--) {
      if (progressHistory[i].combinedScore >= 70) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  async getUserProgress(email) {
    const database = getDb();
    const userId = email;
    const userDoc = await getDoc(doc(database, 'users', userId));
    if (!userDoc.exists()) throw new Error('User not found');
    return userDoc.data();
  },

  async getUserAttempts(email, limit = 30) {
    const database = getDb();
    const userId = email;
    const attemptsQuery = query(collection(database, 'attempts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(attemptsQuery);
    const attempts = [];
    querySnapshot.forEach((d) => {
      attempts.push({ id: d.id, ...d.data() });
    });
    attempts.sort((a, b) => {
      const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return tb - ta;
    });
    return attempts.slice(0, limit);
  },
};

export const getErrorMessage = (error) => {
  if (error?.message) return error.message;
  return 'An error occurred. Please try again.';
};
