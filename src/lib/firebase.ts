import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBXkXWKjSL70UcfdcvJcHOTnOri0uxfiqo",
  authDomain: "meal-tracker-40679.firebaseapp.com",
  projectId: "meal-tracker-40679",
  storageBucket: "meal-tracker-40679.firebasestorage.app",
  messagingSenderId: "739073668697",
  appId: "1:739073668697:web:0ad0ce737e5f568f1c2348",
  measurementId: "G-RT3C43FS4N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
