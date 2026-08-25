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

if (!isKeyValid) {
  console.warn(
    "⚠️ VITE_FIREBASE_APIKEY is missing or configured with a placeholder. Google Sign-In will require a valid key in environment variables."
  );
}

const firebaseConfig = {
  apiKey: isKeyValid ? apiKey : "AIzaSyDummyKeyForAppLoadGracefulFallback123",
  authDomain: "fir-demo-cdea3.firebaseapp.com",
  databaseURL: "https://fir-demo-cdea3-default-rtdb.firebaseio.com",
  projectId: "fir-demo-cdea3",
  storageBucket: "fir-demo-cdea3.firebasestorage.app",
  messagingSenderId: "920633223709",
  appId: "1:920633223709:web:a89d0f742889d8f0f8b4f4",
  measurementId: "G-YR1WE67L9F"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, isKeyValid };