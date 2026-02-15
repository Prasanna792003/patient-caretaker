import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables
// For development, create a .env file based on .env.example
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD6n4V1kB-DQ0Sei0XBkybmGfsx2I6bNVs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medicare-app-15c9e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "medicare-app-15c9e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medicare-app-15c9e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "648509810058",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:648509810058:web:1d6e98ff7fa8baf0c91473"
};

// Warn if using fallback values in production
if (import.meta.env.PROD && !import.meta.env.VITE_FIREBASE_API_KEY) {
  console.warn(
    "Warning: Using fallback Firebase config. " +
    "Set environment variables for production deployment."
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
