// Import the Firebase functions we need using the latest SDK version
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import { uploadWidgetToSlot } from "./scripts/upload.js";
import { saveWidgetSlotMetadata } from "./scripts/project-manager.js";

// Your config (from your Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyBIZcD-L5jD84hEYLxWOwHTE2iTY6EJ0zI",
  authDomain: "inque-31cb5.firebaseapp.com",
  databaseURL: "https://inque-31cb5-default-rtdb.firebaseio.com",
  projectId: "inque-31cb5",
  storageBucket: "inque-31cb5.firebasestorage.app",
  messagingSenderId: "338722493567",
  appId: "1:338722493567:web:4c46ecdfe92ddf2a5d5b4a",
  measurementId: "G-KQT58LWVSK",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

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

  // Remove the problematic uploadBtn reference - upload functionality is now handled in the profile modal
  // The upload functionality is properly implemented in the profile and widget management modal

  // File type validation function for widget uploads
  const allowedTypes = [
    "text/html",
    "text/css",
    "application/javascript",
    "application/json",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/svg+xml",
    "text/javascript",
    "application/x-javascript",
  ];
  const allowedExts = [
    ".html",
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".json",
  ];

  // Make validation function globally available
  window.validateWidgetFiles = function (files) {
    for (let file of files) {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (
        !allowedExts.includes(ext) ||
        (file.type && !allowedTypes.includes(file.type))
      ) {
        return false;
      }
    }
    return true;
  };

  // Initial setup complete
});

// Mobile-specific enhancements
document.addEventListener("DOMContentLoaded", function () {
  // Prevent double-tap zoom on buttons
  const touchElements = document.querySelectorAll(
    ".nav-btn, .quick-action-btn, .edit-widget-btn, .hamburger-menu"
  );
  touchElements.forEach((element) => {
    element.addEventListener("touchend", function (e) {
      e.preventDefault();
      this.click();
    });
  });

  // Better touch feedback
  const touchTargets = document.querySelectorAll('button, a, [role="button"]');
  touchTargets.forEach((target) => {
    target.addEventListener("touchstart", function () {
      this.style.transform = "scale(0.98)";
    });

    target.addEventListener("touchend", function () {
      this.style.transform = "";
    });
  });

  // Prevent pull-to-refresh on mobile
  let startY = 0;
  document.addEventListener("touchstart", function (e) {
    startY = e.touches[0].clientY;
  });

  document.addEventListener("touchmove", function (e) {
    const y = e.touches[0].clientY;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop <= 0 && y > startY) {
      e.preventDefault();
    }
  });

  // Better sidebar handling for mobile
  const sidebar = document.querySelector(".sidebar-nav");
  const overlay = document.querySelector(".sidebar-overlay");

  if (sidebar && overlay) {
    // Close sidebar when clicking outside
    overlay.addEventListener("click", function () {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
      document.body.style.overflow = "";
    });

    // Prevent body scroll when sidebar is open
    sidebar.addEventListener("touchmove", function (e) {
      e.stopPropagation();
    });
  }

  // Improved modal handling for mobile
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.addEventListener("touchmove", function (e) {
      e.stopPropagation();
    });
  });
});
