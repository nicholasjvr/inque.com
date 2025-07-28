// scripts/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

// Load environment variables (for production, these should be set on your hosting platform)
const firebaseConfig = {
  apiKey:
    process.env.FIREBASE_API_KEY || "AIzaSyBIZcD-L5jD84hEYLxWOwHTE2iTY6EJ0zI",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "inque-31cb5.firebaseapp.com",
  databaseURL:
    process.env.FIREBASE_DATABASE_URL ||
    "https://inque-31cb5-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "inque-31cb5",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || "inque-31cb5.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "338722493567",
  appId:
    process.env.FIREBASE_APP_ID || "1:338722493567:web:4c46ecdfe92ddf2a5d5b4a",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-KQT58LWVSK",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
