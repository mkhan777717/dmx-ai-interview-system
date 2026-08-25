import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const rawApiKey = import.meta.env.VITE_FIREBASE_APIKEY || "AIzaSyAkS53c0g2FvmD3w5dn8DYp9tT60JtPuI0";
const apiKey = String(rawApiKey).trim();

// Check if API key is valid
const isKeyValid =
  Boolean(apiKey) &&
  apiKey !== "" &&
  !apiKey.toLowerCase().includes("your_") &&
  !apiKey.toLowerCase().includes("dummy") &&
  !apiKey.toLowerCase().includes("placeholder") &&
  !apiKey.toLowerCase().includes("fake");

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "interviewiq-app-6f9b4.firebaseapp.com",
  projectId: "interviewiq-app-6f9b4",
  storageBucket: "interviewiq-app-6f9b4.firebasestorage.app",
  messagingSenderId: "16112584755",
  appId: "1:16112584755:web:f1d52e53c73d6aba34fb46",
  measurementId: "G-HELTJCZPQT"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, isKeyValid };