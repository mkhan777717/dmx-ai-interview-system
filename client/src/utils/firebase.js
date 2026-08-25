import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_APIKEY || "";

// Check if API key is valid
const isKeyValid =
  Boolean(apiKey) &&
  apiKey.trim() !== "" &&
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