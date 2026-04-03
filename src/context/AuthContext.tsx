import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { toast } from 'react-toastify';
import { AuthResult } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  resendVerification: () => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await createUserDocument(currentUser);
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createUserDocument = async (currentUser: User): Promise<void> => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email, photoURL, uid } = currentUser;
      const createdAt = new Date();

      try {
        await setDoc(userRef, {
          displayName,
          email,
          photoURL,
          uid,
          createdAt,
          preferences: {
            theme: 'system',
            currency: 'USD',
            dashboardLayout: ['summary', 'charts', 'recent-transactions'],
            emailNotifications: true
          }
        });
      } catch (error) {
        console.error('Error creating user document:', error);
      }
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<AuthResult> => {
    try {
      if (!email || !password || !name) {
        toast.error('All fields are required');
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return { success: false, error: 'Invalid email format' };
      }

      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

      await updateProfile(result.user, {
        displayName: name.trim()
      });

      await sendEmailVerification(result.user);

      toast.success('Account created! Please check your email to verify your account.');
      return { success: true, user: result.user, needsVerification: true };
    } catch (error: unknown) {
      console.error('Signup error:', error);

      let errorMessage = 'Failed to create account';

      const firebaseError = error as { code?: string; message?: string };
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Please try logging in instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = firebaseError.message || 'An unexpected error occurred';
      }

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (!email || !password) {
        toast.error('Email and password are required');
        return { success: false, error: 'Email and password are required' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return { success: false, error: 'Invalid email format' };
      }

      const result = await signInWithEmailAndPassword(auth, email.trim(), password);

      if (!result.user.emailVerified) {
        toast.warning('Please verify your email before accessing the dashboard.');
        return { success: true, user: result.user, needsVerification: true };
      }

      toast.success('Login successful!');
      return { success: true, user: result.user };
    } catch (error: unknown) {
      console.error('Login error:', error);

      let errorMessage = 'Failed to sign in';

      const firebaseError = error as { code?: string; message?: string };
      switch (firebaseError.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = firebaseError.message || 'An unexpected error occurred';
      }

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);

      toast.success(`Welcome ${result.user.displayName || result.user.email}!`);
      return { success: true, user: result.user };
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);

      let errorMessage = 'Failed to sign in with Google';

      const firebaseError = error as { code?: string; message?: string };
      switch (firebaseError.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in cancelled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup blocked. Please allow popups for this site and try again.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage =
            'An account already exists with the same email address but different sign-in credentials. Please try signing in with email/password.';
          break;
        case 'auth/auth-domain-config-required':
          errorMessage = 'Google Sign-In is not properly configured. Please contact support.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Only one popup request is allowed at one time.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google Sign-In is not enabled. Please contact support.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized for Google Sign-In.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = firebaseError.message || 'An unexpected error occurred';
      }

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      if (!email) {
        toast.error('Email is required');
        return { success: false, error: 'Email is required' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return { success: false, error: 'Invalid email format' };
      }

      await sendPasswordResetEmail(auth, email.trim());
      toast.success('Password reset email sent! Check your inbox.');
      return { success: true };
    } catch (error: unknown) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to send password reset email';

      const firebaseError = error as { code?: string; message?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage = firebaseError.message || 'An unexpected error occurred';
      }

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resendVerification = async (): Promise<AuthResult> => {
    try {
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        toast.success('Verification email sent! Check your inbox.');
        return { success: true };
      }
      return { success: false, error: 'User not found or already verified' };
    } catch (error: unknown) {
      console.error('Resend verification error:', error);
      toast.error('Failed to send verification email');
      const err = error as { message?: string };
      return { success: false, error: err.message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error: unknown) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const value: AuthContextValue = {
    user,
    signup,
    login,
    signInWithGoogle,
    resetPassword,
    resendVerification,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
