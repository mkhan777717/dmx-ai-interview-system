import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_APIKEY;

// Check if API key is missing, empty, or a known placeholder
if (
  !apiKey ||
  apiKey.trim() === "" ||
  apiKey.toLowerCase().includes("your_") ||
  apiKey.toLowerCase().includes("dummy") ||
  apiKey.toLowerCase().includes("placeholder") ||
  apiKey.toLowerCase().includes("fake")
) {
  const errorMsg = "CRITICAL CONFIGURATION ERROR: The environment variable VITE_FIREBASE_APIKEY is missing or configured with a placeholder value in your client/.env file. Please configure a valid Firebase Web API key.";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "fir-demo-cdea3.firebaseapp.com",
  databaseURL: "https://fir-demo-cdea3-default-rtdb.firebaseio.com",
  projectId: "fir-demo-cdea3",
  storageBucket: "fir-demo-cdea3.firebasestorage.app",
  messagingSenderId: "920633223709",
  appId: "1:920633223709:web:a89d0f742889d8f0f8b4f4",
  measurementId: "G-YR1WE67L9F"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };