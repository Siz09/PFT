// src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBF_AwRITG4ivGtt6CNcXqFzFX3E269GoM",
  authDomain: "pfts-5c4d9.firebaseapp.com",
  projectId: "pfts-5c4d9",
  storageBucket: "pfts-5c4d9.firebasestorage.app",
  messagingSenderId: "807254955867",
  appId: "1:807254955867:web:d69d0e2059d0ff047d2c7e",
  measurementId: "G-0R3LF6ZY4G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth and Firestore exports for use in app
export const auth = getAuth(app);
export const db = getFirestore(app);