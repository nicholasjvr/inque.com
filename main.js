// Main entry point for the application
// This script imports and initializes all core functionality

// Debug logging utility for main entry point
const DEBUG = {
  log: (message, data = null) => {
    console.log(`[MAIN DEBUG] ${message}`, data || "");
  },
  error: (message, error = null) => {
    console.error(`[MAIN DEBUG ERROR] ${message}`, error || "");
  },
  warn: (message, data = null) => {
    console.warn(`[MAIN DEBUG WARN] ${message}`, data || "");
  },
};

DEBUG.log("Starting application initialization");

// Import core Firebase and sidebar functionality
DEBUG.log("Importing firebase-core.js");
try {
  import("./core/firebase-core.js")
    .then(() => {
      DEBUG.log("firebase-core.js imported successfully");
    })
    .catch((error) => {
      DEBUG.error("Failed to import firebase-core.js", error);
    });
} catch (error) {
  DEBUG.error("Error importing firebase-core.js", error);
}

// Import timeline and widget management
DEBUG.log("Importing timeline-manager.js");
try {
  import("./scripts/timeline-manager.js")
    .then(() => {
      DEBUG.log("timeline-manager.js imported successfully");
    })
    .catch((error) => {
      DEBUG.error("Failed to import timeline-manager.js", error);
    });
} catch (error) {
  DEBUG.error("Error importing timeline-manager.js", error);
}

DEBUG.log("Application initialization complete");
