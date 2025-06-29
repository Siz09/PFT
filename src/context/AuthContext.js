import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebase-config";
import { toast } from 'react-toastify';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Signup function with validation
  const signup = async (email, password, name) => {
    try {
      // Validate inputs
      if (!email || !password || !name) {
        toast.error('All fields are required');
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return { success: false, error: 'Invalid email format' };
      }

      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // Update the user's display name
      await updateProfile(result.user, {
        displayName: name.trim()
      });
      
      toast.success('Account created successfully!');
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Failed to create account';
      
      switch (error.code) {
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
          errorMessage = error.message || 'An unexpected error occurred';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login function with validation
  const login = async (email, password) => {
    try {
      // Validate inputs
      if (!email || !password) {
        toast.error('Email and password are required');
        return { success: false, error: 'Email and password are required' };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return { success: false, error: 'Invalid email format' };
      }

      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success('Login successful!');
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to sign in';
      
      switch (error.code) {
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
          errorMessage = error.message || 'An unexpected error occurred';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Google Sign-In function
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Configure the provider
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      toast.success(`Welcome ${result.user.displayName || result.user.email}!`);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      let errorMessage = 'Failed to sign in with Google';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in cancelled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup blocked. Please allow popups for this site and try again.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with the same email address but different sign-in credentials. Please try signing in with email/password.';
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
          errorMessage = error.message || 'An unexpected error occurred';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const value = {
    user,
    signup,
    login,
    signInWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};