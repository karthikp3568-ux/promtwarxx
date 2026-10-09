import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as fbSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getAuthErrorMessage } from './authErrors';

interface UserProfile {
  saveAnalysisHistory: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  profile: UserProfile;
  isGuest: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  upgradeGuest: (email: string, pass: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (saveAnalysisHistory: boolean) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ saveAnalysisHistory: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            setProfile({
              saveAnalysisHistory: data?.preferences?.saveAnalysisHistory ?? true,
            });
          } else {
            // First time sign-in: create user profile doc
            const initialDoc = {
              uid: currentUser.uid,
              email: currentUser.email || null,
              displayName: currentUser.displayName || (currentUser.isAnonymous ? 'Guest User' : ''),
              createdAt: serverTimestamp(),
              preferences: { saveAnalysisHistory: true },
            };
            await setDoc(userDocRef, initialDoc);
            setProfile({ saveAnalysisHistory: true });
          }
        } catch (err) {
          console.warn('Could not sync user profile from Firestore:', err);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      const msg = getAuthErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (email: string, pass: string, _displayName?: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const name = _displayName || '';
      if (name) {
        try {
          await updateProfile(cred.user, { displayName: name });
        } catch (e) {
          console.warn('Update profile displayName failed:', e);
        }
      }

      // Explicitly create user profile document in Firestore at users/{uid}
      try {
        const userDocRef = doc(db, 'users', cred.user.uid);
        await setDoc(userDocRef, {
          uid: cred.user.uid,
          email: cred.user.email || null,
          displayName: name,
          createdAt: serverTimestamp(),
          preferences: { saveAnalysisHistory: true },
        });
      } catch (e) {
        console.warn('Failed to create Firestore user document during register:', e);
      }

      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Verification email send failed:', e);
      }
    } catch (err: any) {
      const msg = getAuthErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInGuest = async () => {
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      const msg = getAuthErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const upgradeGuest = async (email: string, pass: string) => {
    if (!auth.currentUser) return;
    setError(null);
    try {
      const credential = EmailAuthProvider.credential(email, pass);
      await linkWithCredential(auth.currentUser, credential);
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (e) {
        console.warn('Verification email send failed:', e);
      }
    } catch (err: any) {
      const msg = getAuthErrorMessage(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const resendVerification = async () => {
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      // Security rule: Always report success to avoid email enumeration
    }
  };

  const signOut = async () => {
    setError(null);
    await fbSignOut(auth);
  };

  const updatePreferences = async (saveAnalysisHistory: boolean) => {
    setProfile({ saveAnalysisHistory });
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { preferences: { saveAnalysisHistory } }, { merge: true });
      } catch (e) {
        console.warn('Failed to update preferences:', e);
      }
    }
  };

  const value = {
    user,
    loading,
    error,
    profile,
    isGuest: Boolean(user?.isAnonymous),
    signIn,
    register,
    signInGuest,
    upgradeGuest,
    resendVerification,
    resetPassword,
    signOut,
    updatePreferences,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
