// Import the Firebase functions we need using the latest SDK version
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

// Your web app's Firebase configuration from your latest snippet
const firebaseConfig = {
  apiKey: "AIzaSyBIZcD-L5jD84hEYLxWOwHTE2iTY6EJ0zI",
  authDomain: "inque-31cb5.firebaseapp.com",
  projectId: "inque-31cb5",
  storageBucket: "inque-31cb5.firebasestorage.app",
  messagingSenderId: "338722493567",
  appId: "1:338722493567:web:4c46ecdfe92ddf2a5d5b4a",
  measurementId: "G-KQT58LWVSK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize Analytics
const db = getFirestore(app); // Initialize Firestore
const auth = getAuth(app); // Initialize Auth
const storage = getStorage(app); // Initialize Storage

// Export instances for other modules to use
export { db, auth, storage };

// --- Example: Firestore Page View Counter ---
async function logPageView() {
  try {
    const docRef = await addDoc(collection(db, "page_visits"), {
      url: window.location.href,
      timestamp: serverTimestamp(),
    });
    console.log("Page visit logged to Firestore with ID: ", docRef.id);
  } catch (e) {
    console.error("Error logging visit: ", e);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Log a page view every time the page loads
  logPageView();

  // Your other scripts can go here
  const light = document.querySelector(".light-cursor");
  if (light) {
    document.addEventListener("mousemove", function (e) {
      light.style.left = e.clientX + "px";
      light.style.top = e.clientY + "px";
    });
  }
});
