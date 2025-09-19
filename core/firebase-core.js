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
const DEBUG = {
  log: (message, data = null) => {
    console.log(`[DEBUG] Firebase Core: ${message}`, data || "");
  },
  error: (message, error = null) => {
    console.error(`[DEBUG ERROR] Firebase Core: ${message}`, error || "");
  },
  warn: (message, data = null) => {
    console.warn(`[DEBUG WARN] Firebase Core: ${message}`, data || "");
  },
};

DEBUG.log("Starting initialization");

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

// For local development, we'll handle domain authorization differently
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
if (isLocalhost) {
  DEBUG.log("Running on localhost - using development configuration");
  DEBUG.log(
    "IMPORTANT: To enable Firebase Auth on localhost, add 'localhost' to Authorized Domains in Firebase Console > Authentication > Settings"
  );
}

DEBUG.log("Initializing Firebase app");
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

DEBUG.log("Firebase services initialized successfully");

// Set up auth state listener with better error handling
onAuthStateChanged(
  auth,
  (user) => {
    try {
      if (user) {
        DEBUG.log("User authenticated:", user.email);
        // Emit global auth state change event
        window.dispatchEvent(
          new CustomEvent("auth-state-changed", {
            detail: { user, isAuthenticated: true },
          })
        );
      } else {
        DEBUG.log("User not authenticated");
        // Emit global auth state change event
        window.dispatchEvent(
          new CustomEvent("auth-state-changed", {
            detail: { user: null, isAuthenticated: false },
          })
        );
      }
    } catch (error) {
      DEBUG.error("Error in auth state change handler:", error);
    }
  },
  (error) => {
    DEBUG.error("Auth state change error:", error);
  }
);

// Export instances for other modules to use
export { db, auth, storage, onAuthStateChanged };

// --- Example: Firestore Page View Counter ---
async function logPageView() {
  try {
    DEBUG.log("Logging page view");
    const docRef = await addDoc(collection(db, "page_visits"), {
      url: window.location.href,
      timestamp: serverTimestamp(),
    });
    DEBUG.log("Page visit logged successfully", {
      id: docRef.id,
    });
  } catch (e) {
    DEBUG.error("Error logging visit", e);
  }
}

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
  DEBUG.log("Validating widget files", {
    fileCount: files.length,
  });
  for (let file of files) {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (
      !allowedExts.includes(ext) ||
      (file.type && !allowedTypes.includes(file.type))
    ) {
      DEBUG.warn("Invalid file type detected", {
        fileName: file.name,
        fileType: file.type,
      });
      return false;
    }
  }
  DEBUG.log("All files validated successfully");
  return true;
};

// Single consolidated DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", function () {
  DEBUG.log("DOM Content Loaded - Starting core functionality");

  // Log a page view every time the page loads
  logPageView();

  // Light cursor effect
  const light = document.querySelector(".light-cursor");
  if (light) {
    DEBUG.log("Setting up light cursor effect");
    document.addEventListener("mousemove", function (e) {
      light.style.left = e.clientX + "px";
      light.style.top = e.clientY + "px";
    });
  } else {
    DEBUG.warn("Light cursor element not found");
  }

  // Prevent double-tap zoom on buttons
  const touchElements = document.querySelectorAll(
    ".nav-btn, .quick-action-btn, .edit-widget-btn, .hamburger-menu"
  );
  DEBUG.log("Found touch elements", {
    count: touchElements.length,
  });

  touchElements.forEach((element) => {
    element.addEventListener("touchend", function (e) {
      DEBUG.log("Touch end event on element", {
        className: element.className,
      });
      e.preventDefault();
      this.click();
    });
  });

  // Better touch feedback
  const touchTargets = document.querySelectorAll('button, a, [role="button"]');
  DEBUG.log("Setting up touch feedback for elements", {
    count: touchTargets.length,
  });

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

  // Enhanced sidebar toggle functionality
  const sidebar = document.querySelector(".sidebar-nav");
  const overlay = document.querySelector(".sidebar-overlay");
  const hamburger = document.querySelector(".hamburger-menu");

  DEBUG.log("Sidebar elements found", {
    sidebar: !!sidebar,
    overlay: !!overlay,
    hamburger: !!hamburger,
  });

  if (sidebar && overlay && hamburger) {
    DEBUG.log("All sidebar elements found, setting up functionality");

    // Make sidebar sticky
    sidebar.style.position = "fixed";
    sidebar.style.top = "0";
    sidebar.style.left = "0";
    sidebar.style.height = "100vh";
    sidebar.style.zIndex = "1002";

    DEBUG.log("Sidebar made sticky");

    // Hamburger menu click handler
    hamburger.addEventListener("click", function (e) {
      DEBUG.log("Hamburger menu clicked");
      e.preventDefault();
      e.stopPropagation();

      const isOpen = sidebar.classList.contains("open");
      DEBUG.log("Toggling sidebar", {
        currentState: isOpen ? "open" : "closed",
      });

      sidebar.classList.toggle("open");
      overlay.classList.toggle("show");
      document.body.style.overflow = sidebar.classList.contains("open")
        ? "hidden"
        : "";

      DEBUG.log("Sidebar toggled", {
        newState: sidebar.classList.contains("open") ? "open" : "closed",
      });
    });

    // Close button handler
    const closeBtn = document.querySelector(".sidebar-close-btn");
    if (closeBtn) {
      DEBUG.log("Setting up close button handler");
      closeBtn.addEventListener("click", function (e) {
        DEBUG.log("Close button clicked");
        e.preventDefault();
        e.stopPropagation();

        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        document.body.style.overflow = "";

        DEBUG.log("Sidebar closed via close button");
      });
    } else {
      DEBUG.warn("Close button not found");
    }

    // Close sidebar when clicking outside
    overlay.addEventListener("click", function (e) {
      DEBUG.log("Overlay clicked");
      e.preventDefault();
      e.stopPropagation();

      sidebar.classList.remove("open");
      overlay.classList.remove("show");
      document.body.style.overflow = "";

      DEBUG.log("Sidebar closed via overlay click");
    });

    // Prevent body scroll when sidebar is open
    sidebar.addEventListener("touchmove", function (e) {
      if (sidebar.classList.contains("open")) {
        DEBUG.log("Preventing touch scroll on sidebar");
        e.stopPropagation();
      }
    });

    // Add page visibility change handler to reset drawer state
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && sidebar.classList.contains("open")) {
        DEBUG.log("Page hidden, closing sidebar");
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        document.body.style.overflow = "";
      }
    });

    // Add keyboard support
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sidebar.classList.contains("open")) {
        DEBUG.log("Escape key pressed, closing sidebar");
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        document.body.style.overflow = "";
      }
    });

    DEBUG.log("Sidebar functionality setup complete");
  } else {
    DEBUG.warn("Sidebar elements not found - sidebar functionality disabled", {
      sidebar: !!sidebar,
      overlay: !!overlay,
      hamburger: !!hamburger,
    });
  }

  // Improved modal handling for mobile
  const modals = document.querySelectorAll(".modal");
  DEBUG.log("Setting up modal touch handling", {
    modalCount: modals.length,
  });

  modals.forEach((modal) => {
    modal.addEventListener("touchmove", function (e) {
      e.stopPropagation();
    });
  });

  // Notifications toggle functionality
  const notificationsContainer = document.getElementById(
    "sidebarNotifications"
  );
  const notificationsHeader = document.getElementById("notificationsHeader");
  const notificationsToggle = document.getElementById("notificationsToggle");

  DEBUG.log("Setting up notifications toggle", {
    container: !!notificationsContainer,
    header: !!notificationsHeader,
    toggle: !!notificationsToggle,
  });

  if (notificationsContainer && notificationsHeader && notificationsToggle) {
    DEBUG.log(
      "All notifications elements found, setting up toggle functionality"
    );

    // Toggle notifications section height
    const toggleNotifications = () => {
      const isExpanded = notificationsContainer.classList.contains("expanded");
      DEBUG.log("Toggling notifications", {
        currentState: isExpanded ? "expanded" : "collapsed",
      });

      notificationsContainer.classList.toggle("expanded");
      notificationsToggle.classList.toggle("expanded");

      DEBUG.log("Notifications toggled", {
        newState: notificationsContainer.classList.contains("expanded")
          ? "expanded"
          : "collapsed",
      });
    };

    // Add click handlers
    notificationsHeader.addEventListener("click", function (e) {
      DEBUG.log("Notifications header clicked");
      e.preventDefault();
      e.stopPropagation();
      toggleNotifications();
    });

    notificationsToggle.addEventListener("click", function (e) {
      DEBUG.log("Notifications toggle button clicked");
      e.preventDefault();
      e.stopPropagation();
      toggleNotifications();
    });

    // Add keyboard support for accessibility
    notificationsHeader.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        DEBUG.log("Notifications header keyboard activated");
        e.preventDefault();
        toggleNotifications();
      }
    });

    notificationsToggle.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        DEBUG.log("Notifications toggle keyboard activated");
        e.preventDefault();
        toggleNotifications();
      }
    });

    DEBUG.log("Notifications toggle functionality setup complete");
  } else {
    DEBUG.warn("Missing notifications elements", {
      container: !!notificationsContainer,
      header: !!notificationsHeader,
      toggle: !!notificationsToggle,
    });
  }

  DEBUG.log("Core functionality setup complete");
});
