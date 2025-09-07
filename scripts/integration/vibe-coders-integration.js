// inQ - Platform Integration System
// This module gracefully integrates the old inque system with the new inQ - Platform
// without breaking existing functionality
import { auth, db } from "../../core/firebase-core.js";
import {
  onAuthStateChanged,
  signInWithPopup,
  GithubAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

class VibeCodersIntegration {
  constructor() {
    this.isLegacyMode = false;
    this.legacyElements = new Map();
    this.newElements = new Map();
    this.integrationComplete = false;

    console.log("[INTEGRATION] inQ Integration Manager initialized");
  }

  async init() {
    try {
      // Check if we're in legacy mode (old index.html)
      this.detectLegacyMode();

      if (this.isLegacyMode) {
        await this.setupLegacyIntegration();
      } else {
        await this.setupNewPlatform();
      }

      this.integrationComplete = true;
      console.log("[INTEGRATION] Integration complete");
    } catch (error) {
      console.error("[INTEGRATION] Failed to initialize integration", error);
    }
  }

  detectLegacyMode() {
    // Check if we're using the old index.html structure
    const oldSidebar = document.querySelector(".sidebar-nav");
    const oldTimeline = document.querySelector(".timeline-3channel");
    const newHeader = document.querySelector("header.neo-brutalist");
    // Title detection updated to inQ branding
    const inQTitleMatch = document.title.includes("inQ");

    if (oldSidebar && oldTimeline && !newHeader) {
      this.isLegacyMode = true;
      console.log("[INTEGRATION] Detected legacy mode - old inque system");
    } else if (newHeader || inQTitleMatch) {
      this.isLegacyMode = false;
      console.log("[INTEGRATION] Detected new platform - inQ - Platform");
    } else {
      // Fallback - assume legacy mode
      this.isLegacyMode = true;
      console.log("[INTEGRATION] Fallback to legacy mode");
    }
  }

  async setupLegacyIntegration() {
    console.log("[INTEGRATION] Setting up legacy integration");

    // Preserve existing functionality
    this.preserveLegacyElements();

    // Add inQ features to legacy system
    await this.addVibeCodersFeatures();

    // Setup navigation bridge
    this.setupNavigationBridge();

    // Migrate user data if needed
    await this.migrateUserData();
  }

  async setupNewPlatform() {
    console.log("[INTEGRATION] Setting up new platform");

    // Ensure all new features are properly initialized
    await this.initializeNewFeatures();

    // Setup backward compatibility
    this.setupBackwardCompatibility();
  }

  preserveLegacyElements() {
    // Store references to important legacy elements
    const legacyElements = [
      "sidebar-nav",
      "timeline-3channel",
      "profile-banner",
      "authModal",
      "widgetModal",
      "chatbotModal",
    ];

    legacyElements.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        this.legacyElements.set(id, element);
        console.log(`[INTEGRATION] Preserved legacy element: ${id}`);
      }
    });
  }

  async addVibeCodersFeatures() {
    // Add inQ navigation to legacy system
    this.addVibeCodersNavigation();

    // Add inQ sections to legacy system
    this.addVibeCodersSections();

    // Add inQ styling
    this.addVibeCodersStyling();
  }

  addVibeCodersNavigation() {
    const sidebarNav = this.legacyElements.get("sidebar-nav");
    if (!sidebarNav) return;

    // Add inQ section to sidebar
    const vibeCodersSection = document.createElement("div");
    vibeCodersSection.className = "sidebar-vibe-coders";
    vibeCodersSection.innerHTML = `
      <h4 class="sidebar-section-title">inQ - Platform</h4>
      <button class="sidebar-nav-btn" data-action="guides">📚 Guides</button>
      <button class="sidebar-nav-btn" data-action="showcase">🏆 Showcase</button>
      <button class="sidebar-nav-btn" data-action="inspiration">💡 Inspiration</button>
      <button class="sidebar-nav-btn" data-action="tools">🛠️ Tools</button>
      <button class="sidebar-nav-btn" data-action="projects">🚀 My Projects</button>
    `;

    sidebarNav.appendChild(vibeCodersSection);

    // Add event listeners
    const navButtons = vibeCodersSection.querySelectorAll(".sidebar-nav-btn");
    navButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const action = button.dataset.action;
        this.handleVibeCodersNavigation(action);
      });
    });

    console.log("[INTEGRATION] Added inQ navigation to legacy system");
  }

  addVibeCodersSections() {
    const main = document.querySelector("main");
    if (!main) return;

    // Create inQ sections container
    const vibeCodersContainer = document.createElement("div");
    vibeCodersContainer.id = "vibe-coders-sections";
    vibeCodersContainer.style.cssText = "display: none; margin-top: 20px;";

    // Add sections
    const sections = ["guides", "showcase", "inspiration", "tools", "projects"];
    sections.forEach((section) => {
      const sectionElement = this.createVibeCodersSection(section);
      vibeCodersContainer.appendChild(sectionElement);
    });

    main.appendChild(vibeCodersContainer);
    console.log("[INTEGRATION] Added inQ sections to legacy system");
  }

  createVibeCodersSection(sectionName) {
    const section = document.createElement("section");
    section.id = `${sectionName}-section`;
    section.className = "vibe-coders-section";
    section.style.cssText = `
      background: var(--bg-secondary);
      border: 3px solid var(--primary-neon);
      padding: 24px;
      margin: 16px 0;
      border-radius: 0;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
    `;

    const titles = {
      guides: "📚 GUIDES",
      showcase: "🏆 SHOWCASE",
      inspiration: "💡 INSPIRATION",
      tools: "🛠️ TOOLS",
      projects: "🚀 MY PROJECTS",
    };

    section.innerHTML = `
      <h2 style="color: var(--primary-neon); text-align: center; margin-bottom: 24px; font-family: 'Orbitron', monospace;">
        ${titles[sectionName]}
      </h2>
      <div class="section-content">
        <p style="text-align: center; color: var(--text-secondary);">
          ${this.getSectionDescription(sectionName)}
        </p>
        <div style="text-align: center; margin-top: 24px;">
          <button class="neo-button" onclick="window.vibeCodersIntegration.showFeatureComingSoon('${sectionName}')">
            EXPLORE ${sectionName.toUpperCase()} →
          </button>
        </div>
      </div>
    `;

    return section;
  }

  getSectionDescription(sectionName) {
    const descriptions = {
      guides:
        "Master AI IDE development with step-by-step guides from the community",
      showcase: "See what the inQ community has built using AI IDEs",
      inspiration:
        "Find inspiration from beautiful web designs and creative coding examples",
      tools:
        "Complete library of tools to supercharge your development workflow",
      projects:
        "Your complete development workspace - from GitHub to deployment",
    };

    return descriptions[sectionName] || "Feature coming soon!";
  }

  addVibeCodersStyling() {
    // Add NEO-brutalist styling to legacy system
    const style = document.createElement("style");
    style.textContent = `
      /* NEO-BRUTALIST OVERRIDES FOR LEGACY SYSTEM */
      :root {
        --primary-neon: #00ffff;
        --secondary-neon: #ff00ff;
        --accent-neon: #ffff00;
        --error-neon: #ff4444;
        --success-neon: #44ff44;
        --warning-neon: #ffaa00;
      }
      
      .neo-button {
        background: var(--bg-secondary);
        border: 3px solid var(--primary-neon);
        color: var(--text-primary);
        padding: 12px 24px;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
      }
      
      .neo-button:hover {
        background: var(--primary-neon);
        color: var(--bg-primary);
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
        transform: translateY(-2px);
      }
      
      .vibe-coders-section {
        font-family: 'JetBrains Mono', 'Inter', monospace;
      }
      
      .sidebar-vibe-coders {
        border-top: 2px solid var(--primary-neon);
        padding-top: 16px;
        margin-top: 16px;
      }
      
      .sidebar-vibe-coders .sidebar-nav-btn {
        border: 2px solid var(--primary-neon);
        background: transparent;
        color: var(--text-primary);
        margin-bottom: 8px;
        transition: all 0.2s ease;
      }
      
      .sidebar-vibe-coders .sidebar-nav-btn:hover {
        background: var(--primary-neon);
        color: var(--bg-primary);
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
      }
    `;

    document.head.appendChild(style);
    console.log("[INTEGRATION] Added inQ styling to legacy system");
  }

  setupNavigationBridge() {
    // Bridge between legacy and new navigation
    window.vibeCodersIntegration = this;

    // Handle inQ navigation from legacy system
    window.handleVibeCodersNavigation = (action) => {
      this.handleVibeCodersNavigation(action);
    };

    console.log("[INTEGRATION] Navigation bridge established");
  }

  handleVibeCodersNavigation(action) {
    console.log(`[INTEGRATION] Navigating to inQ section: ${action}`);

    // Hide main content
    const main = document.querySelector("main");
    if (main) {
      const mainContent = main.querySelector(".timeline-nav");
      if (mainContent) {
        mainContent.style.display = "none";
      }
    }

    // Show inQ sections
    const vibeCodersSections = document.getElementById("vibe-coders-sections");
    if (vibeCodersSections) {
      vibeCodersSections.style.display = "block";

      // Hide all sections
      const sections = vibeCodersSections.querySelectorAll(
        ".vibe-coders-section"
      );
      sections.forEach((section) => {
        section.style.display = "none";
      });

      // Show target section
      const targetSection = document.getElementById(`${action}-section`);
      if (targetSection) {
        targetSection.style.display = "block";
      }
    }

    // Update sidebar active state
    const sidebarButtons = document.querySelectorAll(".sidebar-nav-btn");
    sidebarButtons.forEach((button) => {
      button.classList.remove("active");
      if (button.dataset.action === action) {
        button.classList.add("active");
      }
    });
  }

  async migrateUserData() {
    // Check if user has existing data that needs migration
    if (!auth.currentUser) return;

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Check if user data needs migration to new format
        if (!userData.vibeCodersProfile) {
          const updatedData = {
            ...userData,
            vibeCodersProfile: {
              guidesWritten: 0,
              projectsShowcased: 0,
              toolsShared: 0,
              reputation: 0,
              joinedAt: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
          };

          await updateDoc(userDocRef, updatedData);
          console.log("[INTEGRATION] Migrated user data to inQ format");
        }
      }
    } catch (error) {
      console.error("[INTEGRATION] Error migrating user data", error);
    }
  }

  async initializeNewFeatures() {
    // Initialize new platform features
    console.log("[INTEGRATION] Initializing new platform features");

    // Ensure all required modules are loaded
    await this.loadRequiredModules();

    // Setup global state
    window.vibeCoders = window.vibeCoders || {
      currentUser: null,
      isAuthenticated: false,
      userProfile: null,
      currentSection: "home",
    };
  }

  async loadRequiredModules() {
    // Dynamically load required modules for new platform
    const modules = [
      "./scripts/ui/navigation.js",
      "./scripts/ui/tools-filter.js",
    ];

    for (const module of modules) {
      try {
        await import(module);
        console.log(`[INTEGRATION] Loaded module: ${module}`);
      } catch (error) {
        console.warn(`[INTEGRATION] Failed to load module: ${module}`, error);
      }
    }
  }

  setupBackwardCompatibility() {
    // Ensure legacy functions still work in new platform
    console.log("[INTEGRATION] Setting up backward compatibility");

    // Preserve existing global functions
    const legacyFunctions = [
      "openWidgetStudio",
      "openEditProfile",
      "openAuthModal",
      "showToast",
    ];

    legacyFunctions.forEach((funcName) => {
      if (window[funcName]) {
        console.log(`[INTEGRATION] Preserved legacy function: ${funcName}`);
      }
    });
  }

  // Public methods for external access
  showFeatureComingSoon(feature) {
    const messages = {
      guides: "Guide creation and sharing feature coming soon! 📚",
      showcase: "Project showcase feature coming soon! 🏆",
      inspiration: "Inspiration gallery feature coming soon! 💡",
      tools: "Tools library feature coming soon! 🛠️",
      projects: "Project management feature coming soon! 🚀",
    };

    const message = messages[feature] || "Feature coming soon!";

    if (window.showToast) {
      window.showToast(message, "info");
    } else {
      alert(message);
    }

    console.log(`[INTEGRATION] Feature coming soon: ${feature}`);
  }

  getIntegrationStatus() {
    return {
      isLegacyMode: this.isLegacyMode,
      integrationComplete: this.integrationComplete,
      legacyElementsCount: this.legacyElements.size,
      newElementsCount: this.newElements.size,
    };
  }

  // Method to switch between legacy and new modes
  switchToNewPlatform() {
    if (this.isLegacyMode) {
      window.location.href = "index-new.html";
    }
  }

  switchToLegacyPlatform() {
    if (!this.isLegacyMode) {
      window.location.href = "index-legacy.html";
    }
  }

  // Test function for debugging
  testIntegration() {
    console.log("🔧 VibeCoders Integration Test Started");
    console.log("📊 Current state:", {
      isInitialized: this.isInitialized,
      currentUser: this.getCurrentUser(),
      hasLegacySystem: !!window.vibeCoders,
      hasNewSystem: !!window.navigationManager,
    });

    // Test legacy system detection
    if (window.vibeCoders) {
      console.log("✅ Legacy system detected:", window.vibeCoders);
    } else {
      console.log("⚠️ No legacy system detected");
    }

    // Test new system
    if (window.navigationManager) {
      console.log("✅ New navigation system available");
    } else {
      console.log("⚠️ New navigation system not available");
    }

    console.log("🔧 VibeCoders Integration Test Complete");
    return true;
  }
}

// Create and export singleton instance
const vibeCodersIntegration = new VibeCodersIntegration();

// Expose to window for testing
window.vibeCodersIntegration = vibeCodersIntegration;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  vibeCodersIntegration.init();
});

export default vibeCodersIntegration;
