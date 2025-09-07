// Navigation System for inQ - Platform
// This module handles navigation between different sections while preserving existing functionality
import { auth, db } from "../../core/firebase-core.js";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GithubAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

class NavigationManager {
  constructor() {
    this.sections = [
      "home",
      "guides",
      "showcase",
      "inspiration",
      "tools",
      "projects",
    ];
    this.currentSection = "home";
    this.isInitialized = false;

    console.log("[NAVIGATION] Navigation Manager initialized");
  }

  async init() {
    try {
      this.setupNavigation();
      this.setupAuthIntegration();
      this.handleRedirectResult();
      this.isInitialized = true;

      console.log("[NAVIGATION] Navigation system ready");
    } catch (error) {
      console.error("[NAVIGATION] Failed to initialize navigation", error);
    }
  }

  setupNavigation() {
    const categoryButtons = document.querySelectorAll(".category-btn");
    console.log(`🔧 Setting up ${categoryButtons.length} navigation buttons`);

    categoryButtons.forEach((button, index) => {
      console.log(`🔧 Button ${index + 1}:`, button.dataset.category, button);
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const category = button.dataset.category;
        console.log(`🔧 Navigation clicked: ${category}`);
        this.navigateToSection(category);
      });
    });

    console.log("[NAVIGATION] Navigation buttons configured");
  }

  setupAuthIntegration() {
    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await this.handleUserLogin(user);
      } else {
        this.handleUserLogout();
      }
    });

    // Setup auth button
    const authBtn = document.getElementById("authBtn");
    if (authBtn) {
      authBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleAuthButtonClick();
      });
    }

    console.log("[NAVIGATION] Auth integration configured");
  }

  async handleRedirectResult() {
    try {
      // Check if we're returning from a redirect
      const result = await getRedirectResult(auth);
      if (result) {
        console.log("[NAVIGATION] Redirect authentication successful");
        this.showToast("Login successful! Welcome!", "success");
      }
    } catch (error) {
      console.error("[NAVIGATION] Redirect result error", error);
      // Don't show error toast for redirect results as they're expected
    }
  }

  async handleUserLogin(user) {
    try {
      // Update global state
      window.vibeCoders = window.vibeCoders || {};
      window.vibeCoders.currentUser = user;
      window.vibeCoders.isAuthenticated = true;

      // Load or create user profile
      await this.loadUserProfile(user);

      // Update UI
      this.updateUIForAuthenticatedUser(user);

      // Show welcome message
      this.showToast(
        `Welcome back, ${user.displayName || "Vibe-coder"}! 🚀`,
        "success"
      );

      console.log("[NAVIGATION] User logged in successfully", {
        uid: user.uid,
      });
    } catch (error) {
      console.error("[NAVIGATION] Error handling user login", error);
    }
  }

  handleUserLogout() {
    // Update global state
    window.vibeCoders = window.vibeCoders || {};
    window.vibeCoders.currentUser = null;
    window.vibeCoders.isAuthenticated = false;

    // Update UI
    this.updateUIForGuest();

    console.log("[NAVIGATION] User logged out");
  }

  async loadUserProfile(user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        window.vibeCoders.userProfile = userDoc.data();
        console.log("[NAVIGATION] User profile loaded");
      } else {
        // Create new user profile
        const newProfile = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          bio: "",
          skills: [],
          socialLinks: {},
          stats: {
            projectsCreated: 0,
            guidesWritten: 0,
            toolsShared: 0,
            reputation: 0,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userDocRef, newProfile);
        window.vibeCoders.userProfile = newProfile;
        console.log("[NAVIGATION] New user profile created");
      }
    } catch (error) {
      console.error("[NAVIGATION] Error loading user profile", error);
    }
  }

  updateUIForAuthenticatedUser(user) {
    const authBtn = document.getElementById("authBtn");
    const userNameElement = document.getElementById("userName");
    const userAvatarElement = document.getElementById("userAvatar");

    if (authBtn) {
      authBtn.textContent = "LOGOUT";
      authBtn.removeEventListener("click", this.handleAuthButtonClick);
      authBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    if (userNameElement) {
      userNameElement.textContent = user.displayName || "User";
    }

    if (userAvatarElement) {
      if (user.photoURL) {
        userAvatarElement.style.backgroundImage = `url(${user.photoURL})`;
        userAvatarElement.innerHTML = "";
      } else {
        userAvatarElement.innerHTML = "👤";
      }
    }
  }

  updateUIForGuest() {
    const authBtn = document.getElementById("authBtn");
    const userNameElement = document.getElementById("userName");
    const userAvatarElement = document.getElementById("userAvatar");

    if (authBtn) {
      authBtn.textContent = "LOGIN";
      authBtn.removeEventListener("click", this.handleLogout);
      authBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleAuthButtonClick();
      });
    }

    if (userNameElement) {
      userNameElement.textContent = "Guest";
    }

    if (userAvatarElement) {
      userAvatarElement.style.backgroundImage = "";
      userAvatarElement.innerHTML = "👤";
    }
  }

  async handleAuthButtonClick() {
    if (window.vibeCoders?.isAuthenticated) {
      await this.handleLogout();
    } else {
      await this.handleLogin();
    }
  }

  async handleLogin() {
    try {
      const provider = new GithubAuthProvider();

      // Try popup first, fallback to redirect if blocked
      try {
        const result = await signInWithPopup(auth, provider);
        console.log("[NAVIGATION] Login successful via popup");
        this.showToast("Login successful! Welcome!", "success");
      } catch (popupError) {
        console.warn(
          "[NAVIGATION] Popup blocked, trying redirect:",
          popupError.code
        );

        // Check if it's a popup-blocked error
        if (
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/cancelled-popup-request"
        ) {
          console.log("[NAVIGATION] Switching to redirect authentication");
          this.showToast(
            "Popup blocked. Redirecting to GitHub for authentication...",
            "info",
            3000
          );

          // Use redirect instead
          await signInWithRedirect(auth, provider);
          return; // Don't show error toast since we're redirecting
        }

        // For other errors, re-throw
        throw popupError;
      }
    } catch (error) {
      console.error("[NAVIGATION] Login error", error);

      // Provide more specific error messages
      let errorMessage = "Authentication failed. Please try again.";
      if (error.code === "auth/operation-not-allowed") {
        errorMessage =
          "GitHub authentication is not enabled. Please contact support.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup blocked. Please allow popups and try again.";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Authentication cancelled. Please try again.";
      }

      this.showToast(errorMessage, "error");
    }
  }

  async handleLogout() {
    try {
      await signOut(auth);
      this.showToast("Logged out successfully", "info");
      console.log("[NAVIGATION] Logout successful");
    } catch (error) {
      console.error("[NAVIGATION] Logout error", error);
    }
  }

  navigateToSection(sectionName) {
    console.log(`🔧 Navigating to section: ${sectionName}`);

    if (!this.sections.includes(sectionName)) {
      console.warn("[NAVIGATION] Invalid section:", sectionName);
      return;
    }

    // Hide all sections
    this.sections.forEach((section) => {
      const sectionElement = document.getElementById(`${section}-section`);
      if (sectionElement) {
        sectionElement.style.display = "none";
        console.log(`🔧 Hiding section: ${section}`);
      }
    });

    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.style.display = "block";
      this.currentSection = sectionName;
      console.log(`🔧 Showing section: ${sectionName}`);

      // Update active button state
      const categoryButtons = document.querySelectorAll(".category-btn");
      categoryButtons.forEach((button) => {
        button.classList.remove("neo-brutalist-accent");
        if (button.dataset.category === sectionName) {
          button.classList.add("neo-brutalist-accent");
        }
      });

      // Handle section-specific initialization
      this.handleSectionInit(sectionName);

      console.log(`[NAVIGATION] Navigated to ${sectionName} section`);
    }
  }

  handleSectionInit(sectionName) {
    switch (sectionName) {
      case "projects":
        this.initProjectsSection();
        break;
      case "tools":
        this.initToolsSection();
        break;
      case "guides":
        this.initGuidesSection();
        break;
      case "showcase":
        this.initShowcaseSection();
        break;
      case "inspiration":
        this.initInspirationSection();
        break;
      default:
        break;
    }
  }

  initProjectsSection() {
    // Initialize project management features
    console.log("[NAVIGATION] Initializing projects section");

    // Connect with existing timeline manager
    if (window.timelineManager) {
      console.log("[NAVIGATION] Timeline manager found, integrating...");
    }
  }

  initToolsSection() {
    // Initialize tools filter system
    console.log("[NAVIGATION] Initializing tools section");

    const filterButtons = document.querySelectorAll(".tool-category");
    filterButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const category = button.dataset.category;
        this.filterTools(category);

        // Update active state
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
      });
    });
  }

  filterTools(category) {
    const toolCards = document.querySelectorAll(".tool-card");

    toolCards.forEach((card) => {
      const cardCategories = card.dataset.categories?.split(" ") || [];
      if (cardCategories.includes(category)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });

    console.log(`[NAVIGATION] Tools filtered to category: ${category}`);
  }

  initGuidesSection() {
    console.log("[NAVIGATION] Initializing guides section");

    // Setup guide creation button
    const createGuideBtn = document.getElementById("createGuideBtn");
    if (createGuideBtn) {
      createGuideBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleCreateGuide();
      });
    }
  }

  initShowcaseSection() {
    console.log("[NAVIGATION] Initializing showcase section");

    // Setup showcase addition button
    const addToShowcaseBtn = document.getElementById("addToShowcaseBtn");
    if (addToShowcaseBtn) {
      addToShowcaseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleAddToShowcase();
      });
    }
  }

  initInspirationSection() {
    console.log("[NAVIGATION] Initializing inspiration section");
  }

  async handleCreateGuide() {
    if (!window.vibeCoders?.isAuthenticated) {
      this.showToast("Please log in to create guides", "warning");
      return;
    }

    this.showToast("Guide creation feature coming soon!", "info");
  }

  async handleAddToShowcase() {
    if (!window.vibeCoders?.isAuthenticated) {
      this.showToast("Please log in to add to showcase", "warning");
      return;
    }

    this.showToast("Showcase addition feature coming soon!", "info");
  }

  showToast(message, type = "info") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      // Fallback toast implementation
      const toast = document.createElement("div");
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
      `;

      const container =
        document.getElementById("toast-container") || document.body;
      container.appendChild(toast);

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 5000);
    }
  }

  // Public methods for external access
  getCurrentSection() {
    return this.currentSection;
  }

  isUserAuthenticated() {
    return window.vibeCoders?.isAuthenticated || false;
  }

  getCurrentUser() {
    return window.vibeCoders?.currentUser || null;
  }
}

// Create and export singleton instance
const navigationManager = new NavigationManager();

// Expose to window for testing
window.navigationManager = navigationManager;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  navigationManager.init();
});

export default navigationManager;
