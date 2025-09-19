// Profile Dashboard Manager - Handles widget customization and display
// This module manages the user's profile dashboard with customizable widget styling

import { auth, db } from "../../core/firebase-core.js";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

class ProfileDashboardManager {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.dashboardSettings = null;
    this.debugMode = true;

    console.log("[PROFILE DASHBOARD] Profile Dashboard Manager initialized");
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[PROFILE DASHBOARD] ${message}`, data || "");
    }
  }

  error(message, error = null) {
    console.error(`[PROFILE DASHBOARD ERROR] ${message}`, error || "");
  }

  async init() {
    try {
      this.log("Initializing Profile Dashboard Manager");

      // Wait for auth to be ready
      await this.waitForAuth();

      // Load user profile and dashboard settings
      await this.loadUserProfile();

      this.log("Profile Dashboard Manager initialization complete");
    } catch (error) {
      this.error("Failed to initialize Profile Dashboard Manager", error);
    }
  }

  async waitForAuth() {
    return new Promise((resolve) => {
      if (auth.currentUser) {
        resolve();
      } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve();
          }
        });
      }
    });
  }

  async loadUserProfile() {
    try {
      this.currentUser = auth.currentUser;
      if (!this.currentUser) {
        this.log("No authenticated user, using default settings");
        this.dashboardSettings = this.getDefaultDashboardSettings();
        return;
      }

      this.log("Loading user profile", { uid: this.currentUser.uid });

      const userDoc = await getDoc(doc(db, "users", this.currentUser.uid));
      if (userDoc.exists()) {
        this.userProfile = userDoc.data();
        this.dashboardSettings =
          this.userProfile.dashboardSettings ||
          this.getDefaultDashboardSettings();
        this.log("User profile and dashboard settings loaded successfully");
      } else {
        this.log("User profile not found, using default settings");
        this.dashboardSettings = this.getDefaultDashboardSettings();
      }
    } catch (error) {
      this.error("Failed to load user profile", error);
      this.dashboardSettings = this.getDefaultDashboardSettings();
    }
  }

  getDefaultDashboardSettings() {
    return {
      layout: "grid",
      theme: "neo-brutalist",
      customColors: {
        primary: "#00ffff",
        secondary: "#ff00ff",
        accent: "#ffff00",
        background: "#0a0a0a",
        text: "#ffffff",
      },
      widgetDefaults: {
        borderColor: "#00ffff",
        borderWidth: "3px",
        borderRadius: "0px",
        width: "100%",
        height: "300px",
        shadow: "0 0 20px rgba(0, 255, 255, 0.3)",
      },
      spacing: {
        widgetGap: "24px",
        sectionPadding: "40px",
        cardPadding: "24px",
      },
      animations: {
        enabled: true,
        duration: "0.3s",
        easing: "ease-out",
      },
    };
  }

  // Apply dashboard settings to widget elements
  applyDashboardSettings(widgetElement, customSettings = {}) {
    if (!widgetElement || !this.dashboardSettings) return;

    try {
      const settings = {
        ...this.dashboardSettings.widgetDefaults,
        ...customSettings,
      };

      // Apply border styling
      widgetElement.style.borderColor = settings.borderColor;
      widgetElement.style.borderWidth = settings.borderWidth;
      widgetElement.style.borderRadius = settings.borderRadius;
      widgetElement.style.boxShadow = settings.shadow;

      // Apply dimensions
      if (settings.width) widgetElement.style.width = settings.width;
      if (settings.height) widgetElement.style.height = settings.height;

      // Apply animations
      if (this.dashboardSettings.animations.enabled) {
        widgetElement.style.transition = `all ${this.dashboardSettings.animations.duration} ${this.dashboardSettings.animations.easing}`;
      }

      this.log("Applied dashboard settings to widget", {
        borderColor: settings.borderColor,
        borderWidth: settings.borderWidth,
        borderRadius: settings.borderRadius,
      });
    } catch (error) {
      this.error("Failed to apply dashboard settings", error);
    }
  }

  // Create custom widget iframe with user's styling
  createCustomWidgetIframe(project, containerElement) {
    try {
      if (!containerElement || !project) return null;

      // Create iframe element
      const iframe = document.createElement("iframe");
      iframe.className = "widget-iframe custom-styled";
      iframe.title = `Widget Preview - ${project.title || "Untitled Widget"}`;
      iframe.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-forms"
      );

      // Apply custom styling
      this.applyDashboardSettings(iframe);

      // Set iframe source
      this.loadWidgetIntoIframe(project, iframe).catch((error) => {
        this.error("Failed to load widget into iframe", error);
        iframe.replaceWith(
          Object.assign(document.createElement("div"), {
            className: "widget-preview-error",
            textContent: "Failed to load widget preview",
            style: "padding: 20px; text-align: center; color: #ff4444;",
          })
        );
      });

      return iframe;
    } catch (error) {
      this.error("Failed to create custom widget iframe", error);
      return null;
    }
  }

  // Load widget HTML with asset URLs rewritten to Firebase download URLs
  async loadWidgetIntoIframe(project, iframeEl) {
    try {
      const files = Array.isArray(project.files) ? project.files : [];
      if (files.length === 0) {
        this.log("Project has no files", { projectId: project.id });
        return;
      }

      const fileMap = {};
      files.forEach((f) => {
        if (f && f.fileName && f.downloadURL) {
          fileMap[f.fileName] = f.downloadURL;
        }
      });

      this.log("File map created", {
        fileCount: Object.keys(fileMap).length,
        files: Object.keys(fileMap),
      });

      // Prefer index.html, else first html file
      const htmlFileName =
        Object.keys(fileMap).find((n) => /index\.html?$/i.test(n)) ||
        Object.keys(fileMap).find((n) => /\.html?$/i.test(n));

      if (!htmlFileName) {
        this.log("No HTML file found for widget", { projectId: project.id });
        return;
      }

      this.log("Loading widget HTML", { htmlFileName });
      const res = await fetch(fileMap[htmlFileName]);
      const originalHtml = await res.text();

      const resolveMappedUrl = (path) => {
        if (!path) return null;
        const cleaned = path.replace(/^\.\//, "").replace(/^\//, "");
        if (fileMap[cleaned]) return fileMap[cleaned];
        const base = cleaned.split("/").pop();
        return fileMap[base] || null;
      };

      // Rewrite src/href for local asset references to their Firebase download URLs
      const processedHtml = originalHtml.replace(
        /(href|src)=["']([^"']+)["']/gi,
        (match, attr, value) => {
          const mapped = resolveMappedUrl(value);
          return mapped ? `${attr}="${mapped}"` : match;
        }
      );

      const blob = new Blob([processedHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      iframeEl.src = url;
      this.log("Widget iframe set with blob URL");
    } catch (error) {
      this.error("Error preparing widget iframe", error);
      throw error;
    }
  }

  // Update dashboard settings
  async updateDashboardSettings(settings) {
    try {
      if (!this.currentUser) {
        throw new Error(
          "User must be authenticated to update dashboard settings"
        );
      }

      this.log("Updating dashboard settings", settings);

      const userRef = doc(db, "users", this.currentUser.uid);
      await updateDoc(userRef, {
        dashboardSettings: settings,
        updatedAt: serverTimestamp(),
      });

      this.dashboardSettings = settings;
      this.log("Dashboard settings updated successfully");

      // Apply settings to existing widgets
      this.applySettingsToAllWidgets();

      return { success: true };
    } catch (error) {
      this.error("Failed to update dashboard settings", error);
      return { success: false, error: error.message };
    }
  }

  // Apply current settings to all visible widgets
  applySettingsToAllWidgets() {
    try {
      const widgets = document.querySelectorAll(
        ".widget-iframe, .timeline-event-card .widget-iframe"
      );
      widgets.forEach((widget) => {
        this.applyDashboardSettings(widget);
      });
      this.log("Applied settings to all widgets", { count: widgets.length });
    } catch (error) {
      this.error("Failed to apply settings to all widgets", error);
    }
  }

  // Get current dashboard settings
  getDashboardSettings() {
    return this.dashboardSettings || this.getDefaultDashboardSettings();
  }

  // Preview dashboard settings without saving
  previewDashboardSettings(settings) {
    try {
      const widgets = document.querySelectorAll(
        ".widget-iframe, .timeline-event-card .widget-iframe"
      );
      widgets.forEach((widget) => {
        const previewSettings = {
          ...this.dashboardSettings.widgetDefaults,
          ...settings,
        };
        this.applyDashboardSettings(widget, previewSettings);
      });
      this.log("Preview applied to widgets", { count: widgets.length });
    } catch (error) {
      this.error("Failed to preview dashboard settings", error);
    }
  }

  // Reset to default settings
  resetToDefaults() {
    try {
      const defaultSettings = this.getDefaultDashboardSettings();
      this.previewDashboardSettings(defaultSettings);
      this.log("Reset to default settings");
    } catch (error) {
      this.error("Failed to reset to default settings", error);
    }
  }

  // Export settings for sharing
  exportSettings() {
    try {
      const settings = this.getDashboardSettings();
      const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        settings: settings,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-settings-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
      this.log("Settings exported successfully");
    } catch (error) {
      this.error("Failed to export settings", error);
    }
  }

  // Import settings from file
  async importSettings(file) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (importData.settings) {
        await this.updateDashboardSettings(importData.settings);
        this.log("Settings imported successfully");
        return { success: true };
      } else {
        throw new Error("Invalid settings file format");
      }
    } catch (error) {
      this.error("Failed to import settings", error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const profileDashboardManager = new ProfileDashboardManager();

// Make globally available for testing and debugging
window.profileDashboardManager = profileDashboardManager;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  profileDashboardManager.init();
});

// Export for use in other modules
export default profileDashboardManager;
export { ProfileDashboardManager };
