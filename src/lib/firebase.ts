import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCD63wwCMsyPd0FQDKwgUsBdcUorx7qwUY",
  authDomain: "my-meals-4928.firebaseapp.com",
  projectId: "my-meals-4928",
  storageBucket: "my-meals-4928.firebasestorage.app",
  messagingSenderId: "340315362976",
  appId: "1:340315362976:web:c777fce27b586b50cedbc5",
  measurementId: "G-DYWW0P9LTV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
