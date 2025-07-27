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

  // Widget slot status functionality removed - not needed for current implementation

  // Widget Slot Upload Logic (with slot status update)
  if (uploadBtn) {
    uploadBtn.onclick = async () => {
      const slot = document.getElementById("widgetSlotSelect").value;
      const files = document.getElementById("widgetFiles").files;
      const statusDivUpload = document.getElementById("widgetUploadStatus");
      if (!files.length) {
        statusDivUpload.textContent = "Please select files to upload.";
        return;
      }
      const title = prompt("Widget Title?") || "Untitled Widget";
      const desc = prompt("Widget Description?") || "";
      statusDivUpload.textContent = "Uploading...";
      try {
        const fileURLs = await uploadWidgetToSlot(files, slot);
        await saveWidgetSlotMetadata(slot, {
          title,
          desc,
          files: fileURLs,
          updated: new Date(),
        });
        statusDivUpload.textContent = `Widget uploaded to slot ${slot}!`;
      } catch (e) {
        statusDivUpload.textContent = "Upload failed: " + e.message;
      }
      // Upload completed successfully
    };
  }

  // File type validation and drag-and-drop for widget upload
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
  const fileInput = document.getElementById("widgetFiles");
  const uploadStatus = document.getElementById("widgetUploadStatus");
  const uploadContainer = document.getElementById("widgetSlotUploadContainer");

  function validateFiles(files) {
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
  }

  if (fileInput) {
    fileInput.addEventListener("change", function () {
      if (!validateFiles(this.files)) {
        uploadStatus.textContent =
          "Invalid file type selected. Allowed: html, js, css, png, jpg, jpeg, gif, svg, json.";
        this.value = "";
      } else {
        uploadStatus.textContent = "";
      }
    });
  }

  // Drag-and-drop support
  if (uploadContainer && fileInput) {
    uploadContainer.addEventListener("dragover", function (e) {
      e.preventDefault();
      uploadContainer.style.background = "#333";
    });
    uploadContainer.addEventListener("dragleave", function (e) {
      e.preventDefault();
      uploadContainer.style.background = "#222";
    });
    uploadContainer.addEventListener("drop", function (e) {
      e.preventDefault();
      uploadContainer.style.background = "#222";
      const files = e.dataTransfer.files;
      if (!validateFiles(files)) {
        uploadStatus.textContent =
          "Invalid file type selected. Allowed: html, js, css, png, jpg, jpeg, gif, svg, json.";
        fileInput.value = "";
        return;
      }
      fileInput.files = files;
      uploadStatus.textContent = "";
    });
  }

  // Initial setup complete
});
