// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, deleteDoc, doc, setDoc, updateDoc, onSnapshot, query, orderBy, getDoc, getDocs, where, serverTimestamp, Timestamp } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signOut } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD-jSbLuA1LZ6h1-e7Fi6IZathYD79_NIM",
    authDomain: "cuantracker-me.firebaseapp.com",
    projectId: "cuantracker-me",
    storageBucket: "cuantracker-me.firebasestorage.app",
    messagingSenderId: "546285167695",
    appId: "1:546285167695:web:28538e41ba8559c150b63a",
    measurementId: "G-Z942390SLB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, db, auth, googleProvider, collection, addDoc, deleteDoc, doc, setDoc, updateDoc, onSnapshot, query, orderBy, getDoc, getDocs, where, serverTimestamp, Timestamp, signOut };
