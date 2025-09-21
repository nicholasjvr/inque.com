// main.js - Central Application Orchestrator
// Cost-effective function calls with proper state management integration

console.log("[MAIN] Starting application initialization...");

// === APPLICATION STATE MANAGEMENT ===
class AppStateManager {
  constructor() {
    this.state = {
      initialized: false,
      modules: {
        auth: null,
        social: null,
        profileHub: null,
        navigation: null,
        ui: null,
      },
      user: {
        isAuthenticated: false,
        profile: null,
        preferences: {},
      },
      ui: {
        theme: "auto",
        sidebarOpen: false,
        modals: {
          auth: false,
          profile: false,
          notifications: false,
        },
      },
      performance: {
        loadTime: Date.now(),
        moduleLoadTimes: {},
        functionCallCount: 0,
      },
    };

    this.eventListeners = new Map();
    this.debugMode = true;

    console.log("[MAIN] AppStateManager initialized");
  }

  // Debug logging with performance tracking
  log(message, data = null) {
    if (this.debugMode) {
      this.state.performance.functionCallCount++;
      console.log(`[MAIN] ${message}`, data || "");
    }
  }

  // Update state with change tracking
  setState(updates, source = "unknown") {
    this.log(`State update from ${source}:`, updates);

    // Deep merge state updates
    this.state = this.deepMerge(this.state, updates);

    // Emit state change event for modules to react
    this.emit("state-changed", { state: this.state, updates, source });
  }

  // Deep merge utility
  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  // Event system for module communication
  emit(eventName, data) {
    this.log(`Emitting event: ${eventName}`, data);
    const event = new CustomEvent(`app-${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }

  addEventListener(eventName, callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener(`app-${eventName}`, handler);
    this.eventListeners.set(eventName, handler);
  }

  // Performance tracking
  trackFunctionCall(functionName, duration) {
    if (!this.state.performance.moduleLoadTimes[functionName]) {
      this.state.performance.moduleLoadTimes[functionName] = [];
    }
    this.state.performance.moduleLoadTimes[functionName].push(duration);
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      totalLoadTime: Date.now() - this.state.performance.loadTime,
      functionCallCount: this.state.performance.functionCallCount,
      moduleLoadTimes: this.state.performance.moduleLoadTimes,
      memoryUsage: performance.memory
        ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          }
        : null,
    };
  }
}

// === MODULE ORCHESTRATOR ===
class ModuleOrchestrator {
  constructor(appState) {
    this.appState = appState;
    this.modules = new Map();
    this.loadingPromises = new Map();

    this.log("ModuleOrchestrator initialized");
  }

  log(message, data = null) {
    this.appState.log(`[ORCHESTRATOR] ${message}`, data);
  }

  // Load module with caching and error handling
  async loadModule(moduleName, loader) {
    if (this.modules.has(moduleName)) {
      this.log(`Module ${moduleName} already loaded`);
      return this.modules.get(moduleName);
    }

    if (this.loadingPromises.has(moduleName)) {
      this.log(`Module ${moduleName} is already loading`);
      return this.loadingPromises.get(moduleName);
    }

    const startTime = Date.now();
    this.log(`Loading module: ${moduleName}`);

    const loadPromise = this.loadModuleWithRetry(moduleName, loader, 3);
    this.loadingPromises.set(moduleName, loadPromise);

    try {
      const module = await loadPromise;
      const loadTime = Date.now() - startTime;

      this.modules.set(moduleName, module);
      this.loadingPromises.delete(moduleName);

      this.appState.trackFunctionCall(`load-${moduleName}`, loadTime);
      this.log(`Module ${moduleName} loaded successfully in ${loadTime}ms`);

      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      this.log(`Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

  async loadModuleWithRetry(moduleName, loader, maxRetries) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await loader();
      } catch (error) {
        lastError = error;
        this.log(`Module ${moduleName} load attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw new Error(
      `Failed to load module ${moduleName} after ${maxRetries} attempts: ${lastError.message}`
    );
  }

  // Get module with null safety
  getModule(moduleName) {
    return this.modules.get(moduleName) || null;
  }

  // Initialize all core modules
  async initializeCoreModules() {
    this.log("Initializing core modules...");

    const moduleLoaders = [
      ["firebase-core", () => import("./core/firebase-core.js")],
      ["auth", () => import("./scripts/auth/auth.js")],
      ["social", () => import("./scripts/social/social-features.js")],
      ["navigation", () => import("./scripts/ui/navigation.js")],
    ];

    const loadPromises = moduleLoaders.map(([name, loader]) =>
      this.loadModule(name, loader).catch((error) => {
        this.log(`Warning: Failed to load ${name}:`, error);
        return null;
      })
    );

    const results = await Promise.allSettled(loadPromises);

    results.forEach((result, index) => {
      const [moduleName] = moduleLoaders[index];
      if (result.status === "fulfilled" && result.value) {
        this.log(`Core module ${moduleName} ready`);
      } else {
        this.log(`Core module ${moduleName} failed to load`);
      }
    });

    this.log("Core modules initialization complete");
  }
}

// === APPLICATION INITIALIZER ===
class ApplicationInitializer {
  constructor() {
    this.appState = new AppStateManager();
    this.orchestrator = new ModuleOrchestrator(this.appState);
    this.initializationSteps = [];

    this.log("ApplicationInitializer created");
  }

  log(message, data = null) {
    this.appState.log(`[INIT] ${message}`, data);
  }

  // Add initialization step
  addStep(name, stepFunction, dependencies = []) {
    this.initializationSteps.push({
      name,
      function: stepFunction,
      dependencies,
      completed: false,
    });
  }

  // Execute initialization steps in order
  async executeInitializationSteps() {
    this.log("Executing initialization steps...");

    const completedSteps = new Set();
    let hasProgress = true;

    while (
      hasProgress &&
      completedSteps.size < this.initializationSteps.length
    ) {
      hasProgress = false;

      for (const step of this.initializationSteps) {
        if (step.completed || completedSteps.has(step.name)) continue;

        // Check if dependencies are met
        const dependenciesMet = step.dependencies.every((dep) =>
          completedSteps.has(dep)
        );

        if (dependenciesMet) {
          try {
            this.log(`Executing step: ${step.name}`);
            await step.function();
            step.completed = true;
            completedSteps.add(step.name);
            hasProgress = true;
            this.log(`Step completed: ${step.name}`);
          } catch (error) {
            this.log(`Step failed: ${step.name}`, error);
            // Continue with other steps
          }
        }
      }
    }

    const failedSteps = this.initializationSteps.filter(
      (step) => !step.completed
    );
    if (failedSteps.length > 0) {
      this.log(
        `Warning: ${failedSteps.length} steps failed:`,
        failedSteps.map((s) => s.name)
      );
    }

    this.log(
      `Initialization complete. ${completedSteps.size}/${this.initializationSteps.length} steps successful`
    );
  }

  // Set up core initialization steps
  setupInitializationSteps() {
    // Step 1: DOM Ready
    this.addStep("dom-ready", async () => {
      if (document.readyState === "loading") {
        await new Promise((resolve) =>
          document.addEventListener("DOMContentLoaded", resolve)
        );
      }
      this.log("DOM is ready");
    });

    // Step 2: Load Core Modules
    this.addStep(
      "load-modules",
      async () => {
        await this.orchestrator.initializeCoreModules();
      },
      ["dom-ready"]
    );

    // Step 3: Initialize Auth System
    this.addStep(
      "init-auth",
      async () => {
        const authModule = this.orchestrator.getModule("auth");
        if (authModule && window.socialAuth) {
          await window.socialAuth.init();
          this.log("Auth system initialized");
        } else {
          this.log("Auth module not available");
        }
      },
      ["load-modules"]
    );

    // Step 4: Initialize Social Features
    this.addStep(
      "init-social",
      async () => {
        const socialModule = this.orchestrator.getModule("social");
        if (socialModule && window.socialFeatures) {
          await window.socialFeatures.init();
          this.log("Social features initialized");
        } else {
          this.log("Social module not available");
        }
      },
      ["init-auth"]
    );

    // Step 5: Initialize ProfileHub
    this.addStep(
      "init-profile-hub",
      async () => {
        // ProfileHub initializes itself, just ensure it's available
        if (window.profileHubManager) {
          this.log("ProfileHub is available");
        } else {
          this.log("ProfileHub not yet available, will retry");
        }
      },
      ["init-auth"]
    );

    // Step 6: Set up Global Event Handlers
    this.addStep(
      "setup-global-handlers",
      async () => {
        this.setupGlobalEventHandlers();
      },
      ["init-auth", "init-social"]
    );

    // Step 7: Initialize UI Components
    this.addStep(
      "init-ui",
      async () => {
        await this.initializeUIComponents();
      },
      ["setup-global-handlers"]
    );

    // Step 8: Finalize Application
    this.addStep(
      "finalize",
      async () => {
        this.finalizeApplication();
      },
      ["init-ui"]
    );
  }

  // Set up global event handlers for cross-module communication
  setupGlobalEventHandlers() {
    this.log("Setting up global event handlers...");

    // Auth state changes
    this.appState.addEventListener("state-changed", (data) => {
      if (data.updates.user) {
        this.handleUserStateChange(data.updates.user);
      }
    });

    // Listen for auth state changes from auth system
    window.addEventListener("auth-state-changed", (e) => {
      this.log("Auth state change received:", e.detail);
      this.appState.setState(
        {
          user: {
            isAuthenticated: e.detail.isAuthenticated,
            profile: e.detail.profile,
          },
        },
        "auth-system"
      );
    });

    // Listen for social feature events
    window.addEventListener("social-action", (e) => {
      this.log("Social action received:", e.detail);
      this.handleSocialAction(e.detail);
    });

    // ProfileHub removed: skip profilehub events

    this.log("Global event handlers set up");
  }

  // Handle user state changes
  handleUserStateChange(userState) {
    this.log("Handling user state change:", userState);

    // Update UI based on auth state
    this.updateAuthUI(userState.isAuthenticated);

    // Update ProfileHub if available
    if (window.profileHubManager && userState.profile) {
      window.profileHubManager.handleAuthStateChange(
        userState.isAuthenticated ? { uid: "user" } : null,
        userState.profile
      );
    }
  }

  // Handle social actions
  handleSocialAction(action) {
    this.log("Handling social action:", action);

    // Track social interactions
    this.appState.setState(
      {
        performance: {
          socialActions:
            (this.appState.state.performance.socialActions || 0) + 1,
        },
      },
      "social-action"
    );
  }

  // Update auth UI elements
  updateAuthUI(isAuthenticated) {
    this.log("Updating auth UI:", isAuthenticated);

    // Update sidebar auth button
    const authBtn = document.getElementById("sidebarLoginBtn");
    if (authBtn) {
      authBtn.style.display = isAuthenticated ? "none" : "block";
    }

    // Update user actions
    const userActions = document.getElementById("sidebarUserActions");
    if (userActions) {
      userActions.style.display = isAuthenticated ? "block" : "none";
    }

    // Update profile elements
    const profileElements = document.querySelectorAll(".profile-element");
    profileElements.forEach((el) => {
      el.style.display = isAuthenticated ? "block" : "none";
    });
  }

  // Initialize UI components
  async initializeUIComponents() {
    this.log("Initializing UI components...");

    // Set up navigation
    const navModule = this.orchestrator.getModule("navigation");
    if (navModule && window.navigationManager) {
      await window.navigationManager.init();
    }

    // Ensure Auth modal is present globally
    await this.ensureAuthModalInjected();

    // Set up mobile optimizations
    this.setupMobileOptimizations();

    // Set up theme handling
    this.setupThemeHandling();

    this.log("UI components initialized");
  }

  // Inject auth modal HTML if missing
  async ensureAuthModalInjected() {
    try {
      if (document.getElementById("authModal")) return;
      const paths = [
        "pages/page_modals/user_auth.html",
        "./pages/page_modals/user_auth.html",
        "/pages/page_modals/user_auth.html",
      ];
      let html = null;
      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            html = await res.text();
            break;
          }
        } catch (_) {}
      }
      if (!html) return;
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper);
      this.log("Auth modal injected globally");
    } catch (e) {
      this.log("Auth modal injection failed", e);
    }
  }

  // Set up mobile optimizations
  setupMobileOptimizations() {
    this.log("Setting up mobile optimizations...");

    // Touch event optimization
    document.addEventListener(
      "touchstart",
      (e) => {
        e.target.classList.add("touch-active");
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      (e) => {
        e.target.classList.remove("touch-active");
      },
      { passive: true }
    );

    // Prevent zoom on input focus (iOS)
    const inputs = document.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.content =
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
        }
      });
    });

    this.log("Mobile optimizations set up");
  }

  // Set up theme handling
  setupThemeHandling() {
    this.log("Setting up theme handling...");

    // Detect system theme preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const savedTheme = localStorage.getItem("app-theme");

    const theme = savedTheme || (prefersDark ? "dark" : "light");
    this.appState.setState({ ui: { theme } }, "theme-detection");

    // Apply theme
    document.documentElement.setAttribute("data-theme", theme);

    // Listen for theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("app-theme")) {
          const newTheme = e.matches ? "dark" : "light";
          this.appState.setState({ ui: { theme: newTheme } }, "theme-change");
          document.documentElement.setAttribute("data-theme", newTheme);
        }
      });

    this.log("Theme handling set up");
  }

  // Finalize application initialization
  finalizeApplication() {
    this.log("Finalizing application initialization...");

    // Mark as initialized
    this.appState.setState({ initialized: true }, "finalization");

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Set up error handling
    this.setupErrorHandling();

    // Log performance metrics
    const metrics = this.appState.getPerformanceMetrics();
    this.log("Application initialization complete", metrics);

    // Emit ready event
    this.appState.emit("app-ready", {
      state: this.appState.state,
      metrics,
    });

    this.log("Application ready!");
  }

  // Set up performance monitoring
  setupPerformanceMonitoring() {
    this.log("Setting up performance monitoring...");

    // Monitor memory usage
    setInterval(() => {
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
        if (memoryUsage > 50) {
          // Alert if using more than 50MB
          this.log(`High memory usage: ${memoryUsage.toFixed(2)}MB`);
        }
      }
    }, 30000); // Check every 30 seconds

    // Monitor function call count
    setInterval(() => {
      const callCount = this.appState.state.performance.functionCallCount;
      this.log(`Function call count: ${callCount}`);
    }, 60000); // Log every minute
  }

  // Set up global error handling
  setupErrorHandling() {
    this.log("Setting up error handling...");

    window.addEventListener("error", (e) => {
      this.log("Global error caught:", e.error);
      this.appState.emit("app-error", {
        error: e.error,
        filename: e.filename,
        lineno: e.lineno,
      });
    });

    window.addEventListener("unhandledrejection", (e) => {
      this.log("Unhandled promise rejection:", e.reason);
      this.appState.emit("app-error", {
        error: e.reason,
        type: "unhandled-rejection",
      });
    });
  }

  // Public API for external access
  getAppState() {
    return this.appState.state;
  }

  getPerformanceMetrics() {
    return this.appState.getPerformanceMetrics();
  }

  // Initialize the entire application
  async init() {
    this.log("Starting application initialization...");

    try {
      this.setupInitializationSteps();
      await this.executeInitializationSteps();

      this.log("Application initialization successful");
      return true;
    } catch (error) {
      this.log("Application initialization failed:", error);
      this.appState.emit("app-error", {
        error,
        type: "initialization-failure",
      });
      return false;
    }
  }
}

// === GLOBAL APPLICATION INSTANCE ===
let appInstance = null;

// Initialize application when DOM is ready
async function initializeApplication() {
  console.log("[MAIN] Initializing application...");

  try {
    appInstance = new ApplicationInitializer();
    const success = await appInstance.init();

    if (success) {
      console.log("[MAIN] Application initialized successfully");

      // Expose app instance globally for debugging
      window.app = appInstance;

      // Add debug functions
      window.getAppState = () => appInstance.getAppState();
      window.getPerformanceMetrics = () => appInstance.getPerformanceMetrics();
      window.debugApp = () => {
        console.log("App State:", appInstance.getAppState());
        console.log("Performance:", appInstance.getPerformanceMetrics());
      };

      // Add comprehensive debug functions
      window.debugAuthState = () => {
        console.log("=== AUTH STATE DEBUG ===");
        console.log(
          "SocialAuth:",
          window.socialAuth?.currentUser?.uid || "Not authenticated"
        );
        console.log(
          "SocialFeatures:",
          window.socialFeatures?.currentUser?.uid || "Not authenticated"
        );
        console.log(
          "ProfileHub:",
          window.profileHubManager?.state?.user?.isAuthenticated || false
        );
        console.log("App State User:", appInstance.getAppState().user);
      };

      window.debugModuleStatus = () => {
        console.log("=== MODULE STATUS DEBUG ===");
        console.log("Auth Module:", !!window.socialAuth);
        console.log("Social Module:", !!window.socialFeatures);
        console.log("ProfileHub:", !!window.profileHubManager);
        console.log("Navigation:", !!window.navigationManager);
        console.log("Firebase Core:", !!window.firebase);
      };

      window.debugIntegration = () => {
        console.log("=== INTEGRATION DEBUG ===");
        console.log("Auth State Listeners:", {
          auth: window.socialAuth?.authListenerSetUp || false,
          social: "Listening via events",
          profileHub: "Listening via events",
        });
        console.log("Event System:", {
          authEvents: "auth-state-changed",
          socialEvents: "social-action",
          profileHubEvents: "profilehub-state-changed",
          appEvents: "app-ready, app-error, app-state-changed",
        });
      };
    } else {
      console.error("[MAIN] Application initialization failed");
    }
  } catch (error) {
    console.error("[MAIN] Critical error during initialization:", error);
  }
}

// Start initialization
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApplication);
} else {
  initializeApplication();
}

// Export for module usage
export { ApplicationInitializer, AppStateManager, ModuleOrchestrator };

console.log("[MAIN] Main.js loaded successfully");
