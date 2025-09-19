console.log("[PROFILE HUB] Initializing modular ProfileHub system...");

/**
 * ProfileHubManager - Centralized State Management for ProfileHub
 * This replaces the scattered state management with a clean, modular architecture
 */
class ProfileHubManager {
  constructor() {
    console.log("[PROFILE HUB] Creating ProfileHubManager...");

    // === STATE MANAGEMENT ===
    this.state = {
      // User State
      user: {
        isAuthenticated: false,
        profile: null,
        preferences: this.getDefaultPreferences(),
      },

      // UI State
      ui: {
        hubState: "minimized", // 'minimized' | 'expanded' | 'chatbot-active' | 'customizing'
        chatbotState: "closed", // 'closed' | 'minimized' | 'open'
        customizationState: "closed", // 'closed' | 'open'
        position: "top-right",
        theme: "neo-brutalist",
        scale: 1,
      },

      // Navigation State
      navigation: {
        currentPage: this.getCurrentPage(),
        history: [],
        bookmarks: [],
      },

      // Chatbot State
      chatbot: {
        messages: [],
        isTyping: false,
        commands: this.getQuickCommands(),
      },

      // Notifications State
      notifications: {
        unreadCount: 0,
        items: [],
      },
    };

    // === EVENT LISTENERS ===
    this.listeners = new Map();

    // === DOM REFERENCES ===
    this.dom = {};

    // === MODULES ===
    this.modules = {
      auth: null,
      chatbot: null,
      customization: null,
      navigation: null,
    };

    // Initialize when ready
    this.init();
  }

  /**
   * Initialize the ProfileHub system
   */
  async init() {
    console.log("[PROFILE HUB] Initializing ProfileHub system...");

    try {
      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        await new Promise((resolve) => {
          document.addEventListener("DOMContentLoaded", resolve);
        });
      }

      // Initialize DOM references
      this.initializeDOMReferences();

      // Initialize modules
      await this.initializeModules();

      // Set up event listeners
      this.setupEventListeners();

      // Apply saved preferences
      this.applySavedPreferences();

      // Initialize UI state
      this.updateUI();

      // Listen for auth state changes
      this.setupAuthListener();

      console.log("[PROFILE HUB] ProfileHub initialization complete");
    } catch (error) {
      console.error("[PROFILE HUB] Initialization failed:", error);
    }
  }

  /**
   * Initialize DOM element references
   */
  initializeDOMReferences() {
    console.log("[PROFILE HUB] Initializing DOM references...");

    this.dom = {
      // Main Hub Elements
      hub: document.getElementById("profileHub"),
      hubCore: document.querySelector(".hub-core"),
      expandedContent: document.getElementById("hubExpandedContent"),
      overlay: document.getElementById("profileHubOverlay"),

      // User Section
      userAvatar: document.getElementById("hubUserAvatar"),
      userName: document.getElementById("hubUserName"),
      userStatus: document.getElementById("hubUserStatus"),
      userLevel: document.getElementById("hubUserLevel"),
      statusIndicator: document.getElementById("hubStatusIndicator"),

      // Controls
      chatbotToggle: document.getElementById("hubChatbotToggle"),
      customizeToggle: document.getElementById("hubCustomizeToggle"),
      authToggle: document.getElementById("hubAuthToggle"),
      hubToggle: document.getElementById("hubToggleBtn"),
      drawerToggle: document.getElementById("profileHubDrawerToggle"),

      // Chatbot
      chatbotContainer: document.getElementById("hubChatbotContainer"),
      chatbotSlider: document.getElementById("chatbotSlider"),
      chatMessages: document.getElementById("hubChatMessages"),
      chatInput: document.getElementById("hubChatInput"),
      sendChatBtn: document.getElementById("hubSendChatBtn"),
      chatCommands: document.getElementById("hubChatCommands"),

      // Customization
      customizationPanel: document.getElementById("hubCustomizationPanel"),

      // Stats & Navigation
      userStats: document.getElementById("hubUserStats"),
      notificationBadge: document.getElementById("hubNotificationBadge"),
    };

    // Check for required elements
    const requiredElements = ["hub", "hubCore", "expandedContent"];
    const missingElements = requiredElements.filter((key) => !this.dom[key]);

    if (missingElements.length > 0) {
      throw new Error(
        `Missing required DOM elements: ${missingElements.join(", ")}`
      );
    }

    console.log(
      "[PROFILE HUB] DOM references initialized successfully - Enhanced sliding modal system ready"
    );
  }

  /**
   * Initialize all modules
   */
  async initializeModules() {
    console.log("[PROFILE HUB] Initializing modules...");

    // Initialize Authentication Module
    this.modules.auth = new AuthModule(this);

    // Initialize Chatbot Module
    this.modules.chatbot = new ChatbotModule(this);

    // Initialize Customization Module
    this.modules.customization = new CustomizationModule(this);

    // Initialize Navigation Module
    this.modules.navigation = new NavigationModule(this);

    console.log("[PROFILE HUB] All modules initialized");
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    console.log("[PROFILE HUB] Setting up event listeners...");

    // Hub Toggle Button
    this.addEventListener(this.dom.hubToggle, "click", () => {
      this.toggleHub();
    });

    // Drawer Toggle Button
    this.addEventListener(this.dom.drawerToggle, "click", () => {
      this.toggleDrawer();
    });

    // Control Buttons
    this.addEventListener(this.dom.chatbotToggle, "click", () => {
      this.toggleChatbot();
    });

    this.addEventListener(this.dom.customizeToggle, "click", () => {
      console.log(
        "[PROFILE HUB] Gear quicklink clicked → navigating to Explore"
      ); // debug [[memory:4664284]]
      console.log(`[PROFILE HUB] Navigating to: pages/explore.html`); // Debug log [[memory:4664284]]
      window.location.href = "pages/explore.html";
    });

    this.addEventListener(this.dom.authToggle, "click", () => {
      this.modules.auth.handleAuthToggle();
    });

    // User Avatar Click
    this.addEventListener(this.dom.userAvatar, "click", () => {
      this.handleUserAvatarClick();
    });

    // Overlay Click
    this.addEventListener(this.dom.overlay, "click", () => {
      this.closeAllPanels();
    });

    // Keyboard Shortcuts
    this.addEventListener(document, "keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Navigation Links
    this.setupNavigationListeners();

    // Quick Action Buttons
    this.setupQuickActionListeners();

    // Window Events
    this.addEventListener(window, "resize", () => {
      this.handleResize();
    });

    console.log("[PROFILE HUB] Event listeners set up successfully");
  }

  /**
   * Set up navigation link listeners
   */
  setupNavigationListeners() {
    const navLinks = this.dom.expandedContent?.querySelectorAll(".nav-link");
    if (navLinks) {
      console.log(
        `[PROFILE HUB] Setting up ${navLinks.length} navigation links`
      ); // Debug log [[memory:4664284]]
      navLinks.forEach((link, index) => {
        const href = link.getAttribute("href");
        console.log(`[PROFILE HUB] Link ${index + 1}: ${href}`); // Debug log [[memory:4664284]]
        this.addEventListener(link, "click", (e) => {
          this.handleNavigation(e, link);
        });
      });
    } else {
      console.warn(
        "[PROFILE HUB] No navigation links found in expanded content"
      ); // Debug log [[memory:4664284]]
    }
  }

  /**
   * Set up quick action button listeners
   */
  setupQuickActionListeners() {
    const actionBtns =
      this.dom.expandedContent?.querySelectorAll(".quick-action-btn");
    if (actionBtns) {
      actionBtns.forEach((btn) => {
        this.addEventListener(btn, "click", () => {
          const action = btn.dataset.action;
          this.handleQuickAction(action);
        });
      });
    }
  }

  /**
   * Handle navigation clicks with smooth transitions
   */
  handleNavigation(e, link) {
    const href = link.getAttribute("href");
    const isExternal = href.startsWith("http");

    console.log(`[PROFILE HUB] Navigation requested: ${href}`);

    if (!isExternal) {
      e.preventDefault();

      // Add navigation to history
      this.state.navigation.history.push({
        url: href,
        timestamp: Date.now(),
        title: link.textContent.trim(),
      });

      // Visual feedback
      link.style.transform = "scale(0.95)";
      setTimeout(() => {
        link.style.transform = "";
      }, 150);

      // Navigate after brief delay for visual feedback
      setTimeout(() => {
        console.log(`[PROFILE HUB] Navigating to: ${href}`); // Debug log [[memory:4664284]]
        window.location.href = href;
      }, 200);
    }

    // Close hub after navigation
    setTimeout(() => {
      this.setState({ ui: { hubState: "minimized" } });
    }, 100);
  }

  /**
   * Handle quick actions
   */
  handleQuickAction(action) {
    console.log(`[PROFILE HUB] Quick action: ${action}`);

    switch (action) {
      case "newWidget":
        this.modules.navigation.openWidgetStudio();
        break;
      case "shareProfile":
        this.modules.navigation.shareProfile();
        break;
      case "notifications":
        this.modules.navigation.openNotifications();
        break;
      case "settings":
        this.toggleCustomization();
        break;
      default:
        console.warn(`[PROFILE HUB] Unknown action: ${action}`);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Shift + H - Toggle Hub
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "H") {
      e.preventDefault();
      this.toggleHub();
    }

    // Ctrl/Cmd + Shift + C - Toggle Chatbot
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
      e.preventDefault();
      this.toggleChatbot();
    }

    // Escape - Close all panels
    if (e.key === "Escape") {
      this.closeAllPanels();
    }

    // Ctrl/Cmd + Shift + D - Toggle Drawer
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
      e.preventDefault();
      this.toggleDrawer();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Adjust hub position if needed
    this.adjustHubPosition();
  }

  /**
   * Handle user avatar click
   */
  handleUserAvatarClick() {
    if (this.state.user.isAuthenticated) {
      this.toggleHub();
    } else {
      this.modules.auth.openAuthModal();
    }
  }

  /**
   * Toggle hub expanded/minimized state
   */
  toggleHub() {
    const isExpanded = this.state.ui.hubState === "expanded";
    const newState = isExpanded ? "minimized" : "expanded";

    console.log(
      `[PROFILE HUB] Toggling hub: ${this.state.ui.hubState} -> ${newState}`
    );

    this.setState({
      ui: {
        hubState: newState,
        customizationState: "closed", // Close customization when toggling
      },
    });
  }

  /**
   * Toggle drawer visibility with smooth animation
   */
  toggleDrawer() {
    const isHidden = this.dom.hub.classList.contains("drawer-hidden");

    console.log(
      `[PROFILE HUB] Toggling drawer: ${isHidden ? "showing" : "hiding"}`
    );

    if (isHidden) {
      // Show the ProfileHub
      this.dom.hub.classList.remove("drawer-hidden");
      this.dom.drawerToggle.style.display = "none";
      console.log("[PROFILE HUB] ProfileHub drawer shown"); // Debug log [[memory:4664284]]
    } else {
      // Hide the ProfileHub
      this.dom.hub.classList.add("drawer-hidden");
      this.dom.drawerToggle.style.display = "flex";
      console.log("[PROFILE HUB] ProfileHub drawer hidden"); // Debug log [[memory:4664284]]
    }
  }

  /**
   * Toggle chatbot visibility
   */
  toggleChatbot() {
    const isActive = this.state.ui.hubState === "chatbot-active";
    const newState = isActive ? "minimized" : "chatbot-active";

    console.log(
      `[PROFILE HUB] Toggling chatbot: ${this.state.ui.hubState} -> ${newState}`
    );

    // Add debug log for enhanced chatbot sliding animation
    console.log(
      "[PROFILE HUB] Enhanced chatbot sliding animation triggered - smooth slide from right"
    );

    this.setState({
      ui: {
        hubState: newState,
        customizationState: "closed", // Close customization when opening chatbot
      },
    });

    if (!isActive) {
      // Initialize chatbot if opening for first time
      this.modules.chatbot.initialize();
    }
  }

  /**
   * Toggle customization panel with enhanced sliding animations
   */
  toggleCustomization() {
    const isOpen = this.state.ui.customizationState === "open";
    const newState = isOpen ? "closed" : "open";

    console.log(
      `[PROFILE HUB] Toggling customization: ${this.state.ui.customizationState} -> ${newState}`
    );

    // Add debug log for enhanced sliding modal initialization
    console.log(
      "[PROFILE HUB] Enhanced sliding modal animation triggered - smooth slide from right"
    );

    // Add debug log for orb visibility preservation
    console.log(
      "[PROFILE HUB] Orb remains visible and accessible in top-left corner"
    );

    this.setState({
      ui: {
        customizationState: newState,
        hubState: isOpen ? "minimized" : "expanded", // Expand hub when customizing
      },
    });

    // Enhanced sliding animation with backdrop
    this.toggleCustomizationBackdrop(newState === "open");

    // Add debug log for state update completion
    console.log("[PROFILE HUB] Customization panel state updated successfully");
  }

  /**
   * Toggle customization panel backdrop overlay
   */
  toggleCustomizationBackdrop(show) {
    let backdrop = document.getElementById("hub-customization-panel-backdrop");

    if (!backdrop) {
      // Create backdrop if it doesn't exist
      backdrop = document.createElement("div");
      backdrop.id = "hub-customization-panel-backdrop";
      backdrop.className = "hub-customization-panel-backdrop";

      // Add click handler to close panel when backdrop is clicked
      backdrop.addEventListener("click", () => {
        this.toggleCustomization();
      });

      document.body.appendChild(backdrop);
      console.log("[PROFILE HUB] Created customization panel backdrop");
    }

    // Enhanced backdrop animation with smooth transitions
    if (show) {
      backdrop.classList.add("active");
      console.log(
        "[PROFILE HUB] Enhanced backdrop overlay activated with sliding animation"
      );
    } else {
      backdrop.classList.remove("active");
      console.log("[PROFILE HUB] Enhanced backdrop overlay deactivated");
    }
  }

  /**
   * Close all open panels
   */
  closeAllPanels() {
    console.log("[PROFILE HUB] Closing all panels");

    this.setState({
      ui: {
        hubState: "minimized",
        customizationState: "closed",
      },
    });

    // Note: Backdrop functionality removed
  }

  /**
   * Update the UI based on current state
   */
  updateUI() {
    if (!this.dom.hub) return;

    const { ui, user, notifications } = this.state;

    // Update hub state
    this.dom.hub.setAttribute("data-state", ui.hubState);
    this.dom.hub.setAttribute("data-theme", ui.theme);
    this.dom.hub.setAttribute("data-position", ui.position);

    // Update CSS custom properties for theming
    this.dom.hub.style.setProperty("--hub-scale", ui.scale);

    // Update overlay
    if (this.dom.overlay) {
      this.dom.overlay.classList.toggle(
        "active",
        ui.hubState === "expanded" ||
          ui.hubState === "chatbot-active" ||
          ui.customizationState === "open"
      );
    }

    // Update user info
    this.updateUserInfo();

    // Update notification badge
    this.updateNotificationBadge();

    // Update customization panel with enhanced sliding animations
    if (this.dom.customizationPanel) {
      const isOpening = ui.customizationState === "open";
      const wasOpen = this.dom.customizationPanel.classList.contains("active");

      // Remove previous animation classes
      this.dom.customizationPanel.classList.remove("slide-in", "slide-out");

      if (isOpening && !wasOpen) {
        // Opening animation
        this.dom.customizationPanel.classList.add("active", "slide-in");
        console.log(
          "[PROFILE HUB] Customization panel sliding in with enhanced animation"
        );
      } else if (!isOpening && wasOpen) {
        // Closing animation
        this.dom.customizationPanel.classList.add("slide-out");
        setTimeout(() => {
          this.dom.customizationPanel.classList.remove("active", "slide-out");
        }, 400); // Match animation duration
        console.log(
          "[PROFILE HUB] Customization panel sliding out with enhanced animation"
        );
      } else if (isOpening) {
        // Just add active class if already opening
        this.dom.customizationPanel.classList.add("active");
      }
    }

    // Update chatbot container with enhanced sliding animations
    if (this.dom.chatbotContainer) {
      const isActive = ui.hubState === "chatbot-active";
      const wasActive = this.dom.chatbotContainer.classList.contains("active");

      // Remove previous animation classes
      this.dom.chatbotContainer.classList.remove("slide-in", "slide-out");

      if (isActive && !wasActive) {
        // Opening animation
        this.dom.chatbotContainer.classList.add("active", "slide-in");
        console.log(
          "[PROFILE HUB] Chatbot container sliding in with enhanced animation"
        );
      } else if (!isActive && wasActive) {
        // Closing animation
        this.dom.chatbotContainer.classList.add("slide-out");
        setTimeout(() => {
          this.dom.chatbotContainer.classList.remove("active", "slide-out");
        }, 400); // Match animation duration
        console.log(
          "[PROFILE HUB] Chatbot container sliding out with enhanced animation"
        );
      } else if (isActive) {
        // Just add active class if already active
        this.dom.chatbotContainer.classList.add("active");
      }
    }

    console.log(
      "[PROFILE HUB] UI updated with enhanced sliding modal animations"
    );
  }

  /**
   * Update user information display
   */
  updateUserInfo() {
    const { user } = this.state;

    if (this.dom.userName) {
      this.dom.userName.textContent = user.isAuthenticated
        ? user.profile?.displayName || user.profile?.name || "User"
        : "Guest";
    }

    if (this.dom.userStatus) {
      this.dom.userStatus.textContent = user.isAuthenticated
        ? "Online • Authenticated"
        : "Click to customize";
    }

    if (this.dom.userLevel) {
      this.dom.userLevel.textContent = user.isAuthenticated
        ? `LVL • ${user.profile?.level || 1}`
        : "LVL • ?";
    }

    if (this.dom.statusIndicator) {
      this.dom.statusIndicator.className = `avatar-status-indicator ${
        user.isAuthenticated ? "online" : "offline"
      }`;
    }

    if (this.dom.authToggle) {
      this.dom.authToggle.classList.toggle("logged-in", user.isAuthenticated);
      this.dom.authToggle.querySelector(".btn-icon").textContent =
        user.isAuthenticated ? "👤" : "🔐";
    }

    // Update stats section visibility
    if (this.dom.userStats) {
      this.dom.userStats.style.display = user.isAuthenticated
        ? "block"
        : "none";
    }

    console.log("[PROFILE HUB] User info updated");
  }

  /**
   * Update notification badge
   */
  updateNotificationBadge() {
    const { notifications } = this.state;

    if (this.dom.notificationBadge) {
      this.dom.notificationBadge.textContent = notifications.unreadCount;
      this.dom.notificationBadge.style.display =
        notifications.unreadCount > 0 ? "flex" : "none";
    }
  }

  /**
   * Update user stats display
   */
  updateUserStats(stats) {
    console.log("[PROFILE HUB] Updating user stats", stats);

    const widgetCount = document.getElementById("hubWidgetCount");
    const followerCount = document.getElementById("hubFollowerCount");
    const viewCount = document.getElementById("hubViewCount");

    if (widgetCount) {
      widgetCount.textContent = stats.widgetsCreated || 0;
    }

    if (followerCount) {
      followerCount.textContent = stats.followersCount || 0;
    }

    if (viewCount) {
      viewCount.textContent = stats.totalViews || 0;
    }

    console.log("[PROFILE HUB] User stats updated successfully");
  }

  /**
   * Set up authentication state listener
   */
  setupAuthListener() {
    // Listen for auth state changes from the global auth system
    window.addEventListener("auth-state-changed", (e) => {
      const { user, profile } = e.detail;
      this.handleAuthStateChange(user, profile);
    });
  }

  /**
   * Handle authentication state changes
   */
  handleAuthStateChange(user, profile = null) {
    console.log(
      "[PROFILE HUB] Auth state changed:",
      user ? "logged in" : "logged out",
      profile ? "with profile data" : "without profile data"
    );

    this.setState({
      user: {
        isAuthenticated: !!user,
        profile: profile || (user ? this.extractUserProfile(user) : null),
      },
    });

    // Update stats if we have profile data
    if (profile && profile.stats) {
      this.updateUserStats(profile.stats);
    }
  }

  /**
   * Extract user profile from auth user object
   */
  extractUserProfile(user) {
    // This will be enhanced by the AuthModule
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      name: user.displayName || user.email?.split("@")[0],
      level: 1, // Will be loaded from Firestore
    };
  }

  /**
   * Centralized state management with persistence
   */
  setState(newState, persist = true) {
    // Deep merge new state with current state
    this.state = this.deepMerge(this.state, newState);

    // Update UI
    this.updateUI();

    // Handle position changes for modal accessibility
    if (newState.ui?.position) {
      this.handlePositionChange(newState.ui.position);
    }

    // Persist preferences if requested
    if (persist && newState.user?.preferences) {
      this.savePreferences();
    }

    // Emit state change event
    this.emit("state-changed", { state: this.state, changes: newState });

    console.log("[PROFILE HUB] State updated:", newState);
  }

  /**
   * Deep merge utility
   */
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

  /**
   * Event system for modules to communicate
   */
  addEventListener(element, event, handler) {
    if (!element) return;

    element.addEventListener(event, handler);

    // Store for cleanup
    const key = `${event}-${Date.now()}-${Math.random()}`;
    this.listeners.set(key, { element, event, handler });

    return key;
  }

  removeEventListener(key) {
    const listener = this.listeners.get(key);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler);
      this.listeners.delete(key);
    }
  }

  emit(eventName, data) {
    const event = new CustomEvent(`profilehub-${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Utility methods
   */
  getCurrentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  getDefaultPreferences() {
    return {
      theme: "neo-brutalist",
      position: "top-right",
      scale: 1,
      autoMinimize: true,
      chatbotEnabled: true,
      keyboardShortcuts: true,
      animations: true,
    };
  }

  getQuickCommands() {
    return [
      {
        command: "/navigate projects",
        label: "🔗 Projects",
        action: "navigate",
        target: "pages/my-projects.html",
      },
      {
        command: "/help customize",
        label: "⚙️ Customize",
        action: "customize",
        target: null,
      },
      { command: "/stats", label: "📊 Stats", action: "stats", target: null },
      { command: "/help", label: "❓ Help", action: "help", target: null },
    ];
  }

  savePreferences() {
    try {
      localStorage.setItem(
        "profilehub-preferences",
        JSON.stringify(this.state.user.preferences)
      );
      console.log("[PROFILE HUB] Preferences saved");
    } catch (error) {
      console.warn("[PROFILE HUB] Failed to save preferences:", error);
    }
  }

  applySavedPreferences() {
    try {
      const saved = localStorage.getItem("profilehub-preferences");
      if (saved) {
        const preferences = JSON.parse(saved);
        this.setState(
          {
            user: { preferences },
            ui: {
              theme: preferences.theme || "neo-brutalist",
              position: preferences.position || "top-right",
              scale: preferences.scale || 1,
            },
          },
          false
        );
        console.log("[PROFILE HUB] Preferences applied");
      }
    } catch (error) {
      console.warn("[PROFILE HUB] Failed to load preferences:", error);
    }
  }

  adjustHubPosition() {
    // Adjust position based on screen size and current position
    const rect = this.dom.hub.getBoundingClientRect();
    const isOutOfBounds =
      rect.right > window.innerWidth || rect.bottom > window.innerHeight;

    if (isOutOfBounds) {
      // Implement smart repositioning logic
      console.log("[PROFILE HUB] Adjusting position for viewport");
    }
  }

  /**
   * Handle position changes and update all modal positions
   */
  handlePositionChange(newPosition) {
    console.log("[PROFILE HUB] Handling position change to:", newPosition);

    // Update modal positions based on hub position
    this.updateModalPositions(newPosition);

    // Emit position change event for other components
    this.emit("position-changed", {
      position: newPosition,
      previousPosition: this.state.ui.position,
    });

    // Update any open modals immediately
    this.repositionOpenModals(newPosition);
  }

  /**
   * Update a specific modal's position
   */
  updateModalPosition(modalElement, positionConfig) {
    if (!modalElement) return;

    // Apply position styles
    Object.keys(positionConfig).forEach((property) => {
      modalElement.style[property] = positionConfig[property];
    });

    // Add position-specific classes for additional styling
    modalElement.className = modalElement.className.replace(
      /position-\w+/g,
      ""
    );
    modalElement.classList.add(`position-${this.state.ui.position}`);
  }

  /**
   * Reposition any currently open modals
   */
  repositionOpenModals(newPosition) {
    const { ui } = this.state;

    // If expanded content is visible, update its position
    if (ui.hubState === "expanded" && this.dom.expandedContent) {
      this.updateModalPositions(newPosition);
    }

    // If chatbot is active, update its position
    if (ui.hubState === "chatbot-active" && this.dom.chatbotContainer) {
      this.updateModalPositions(newPosition);
    }

    // If customization panel is open, update its position
    if (ui.customizationState === "open" && this.dom.customizationPanel) {
      this.updateModalPositions(newPosition);
    }
  }

  /**
   * Cleanup method
   */
  destroy() {
    console.log("[PROFILE HUB] Destroying ProfileHub...");

    // Remove all event listeners
    this.listeners.forEach((listener, key) => {
      this.removeEventListener(key);
    });

    // Destroy modules
    Object.values(this.modules).forEach((module) => {
      if (module && typeof module.destroy === "function") {
        module.destroy();
      }
    });

    console.log("[PROFILE HUB] ProfileHub destroyed");
  }
}

/**
 * Authentication Module - Handles user authentication
 */
class AuthModule {
  constructor(hubManager) {
    this.hub = hubManager;
    console.log("[AUTH MODULE] Initialized");
  }

  handleAuthToggle() {
    if (this.hub.state.user.isAuthenticated) {
      this.openProfileMenu();
    } else {
      this.openAuthModal();
    }
  }

  openAuthModal() {
    console.log("[AUTH MODULE] Opening auth modal...");

    // Use existing auth modal from main auth system
    if (window.openAuthModal) {
      window.openAuthModal("login");
    } else {
      // Fallback
      const authModal = document.getElementById("authModal");
      if (authModal) {
        authModal.style.display = "block";
        document.body.style.overflow = "hidden";
      }
    }

    // Close hub
    this.hub.setState({ ui: { hubState: "minimized" } });
  }

  openProfileMenu() {
    console.log("[AUTH MODULE] Opening profile menu...");

    // Toggle hub to show profile options
    this.hub.toggleHub();
  }
}

/**
 * Chatbot Module - Handles integrated AI chatbot functionality
 */
class ChatbotModule {
  constructor(hubManager) {
    this.hub = hubManager;
    this.initialized = false;
    console.log("[CHATBOT MODULE] Initialized");
  }

  initialize() {
    if (this.initialized) return;

    console.log("[CHATBOT MODULE] Setting up chatbot integration...");

    // Set up chatbot-specific event listeners
    this.setupChatbotListeners();

    // Load chat history if available
    this.loadChatHistory();

    // Set up quick commands
    this.setupQuickCommands();

    this.initialized = true;
    console.log("[CHATBOT MODULE] Chatbot integration ready");
  }

  setupChatbotListeners() {
    const { dom } = this.hub;

    // Send message button
    this.hub.addEventListener(dom.sendChatBtn, "click", () => {
      this.sendMessage();
    });

    // Enter key in chat input
    this.hub.addEventListener(dom.chatInput, "keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Quick command buttons
    const commandBtns = dom.chatCommands?.querySelectorAll(".command-chip");
    if (commandBtns) {
      commandBtns.forEach((btn) => {
        this.hub.addEventListener(btn, "click", () => {
          const command = btn.dataset.command;
          this.executeCommand(command);
        });
      });
    }

    // Chatbot close/minimize buttons
    const closeBtn = dom.chatbotSlider?.querySelector("#chatbotClose");
    const minimizeBtn = dom.chatbotSlider?.querySelector("#chatbotMinimize");

    if (closeBtn) {
      this.hub.addEventListener(closeBtn, "click", () => {
        this.hub.setState({ ui: { hubState: "minimized" } });
      });
    }

    if (minimizeBtn) {
      this.hub.addEventListener(minimizeBtn, "click", () => {
        this.hub.setState({ ui: { hubState: "expanded" } });
      });
    }
  }

  async sendMessage() {
    const { dom } = this.hub;
    const message = dom.chatInput?.value.trim();

    if (!message) return;

    console.log("[CHATBOT MODULE] Sending message:", message);

    // Clear input
    dom.chatInput.value = "";

    // Add user message to chat
    this.addMessage(message, "user");

    // Check if it's a command
    if (message.startsWith("/")) {
      this.executeCommand(message);
      return;
    }

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get AI response (integrate with existing chatbot functionality)
      const response = await this.getAIResponse(message);

      // Remove typing indicator and add AI response
      this.hideTypingIndicator();
      this.addMessage(response, "ai");
    } catch (error) {
      console.error("[CHATBOT MODULE] Error getting AI response:", error);
      this.hideTypingIndicator();
      this.addMessage("Sorry, I encountered an error. Please try again.", "ai");
    }
  }

  addMessage(content, sender) {
    const { dom } = this.hub;
    if (!dom.chatMessages) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    messageDiv.innerHTML = `
      <div class="message-avatar">${sender === "user" ? "👤" : "🤖"}</div>
      <div class="message-content">
        <p>${content}</p>
      </div>
    `;

    dom.chatMessages.appendChild(messageDiv);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;

    // Update state
    this.hub.setState({
      chatbot: {
        messages: [
          ...this.hub.state.chatbot.messages,
          { content, sender, timestamp: Date.now() },
        ],
      },
    });

    console.log(`[CHATBOT MODULE] Added ${sender} message`);
  }

  showTypingIndicator() {
    const { dom } = this.hub;
    if (!dom.chatMessages) return;

    const typingDiv = document.createElement("div");
    typingDiv.className = "message ai-message typing";
    typingDiv.id = "hubTypingIndicator";

    typingDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <p>Thinking...</p>
      </div>
    `;

    dom.chatMessages.appendChild(typingDiv);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;

    this.hub.setState({ chatbot: { isTyping: true } });
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById("hubTypingIndicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }

    this.hub.setState({ chatbot: { isTyping: false } });
  }

  async getAIResponse(message) {
    // Integration with existing chatbot functionality
    try {
      // Import and use existing chatbot AI logic
      const contextualResponse = this.getContextualResponse(message);
      if (contextualResponse) {
        return contextualResponse;
      }

      // Fallback to existing AI service if available
      if (window.getAIResponse) {
        return await window.getAIResponse(message);
      }

      // Default fallback responses
      return this.getFallbackResponse(message);
    } catch (error) {
      console.error("[CHATBOT MODULE] AI response error:", error);
      return "I'm here to help you navigate and customize your ProfileHub experience. What would you like to know?";
    }
  }

  getContextualResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Navigation help
    if (lowerMessage.includes("navigate") || lowerMessage.includes("go to")) {
      return "I can help you navigate! Use commands like '/navigate projects' to go to your projects, or click the navigation links in your expanded hub.";
    }

    // Customization help
    if (lowerMessage.includes("customize") || lowerMessage.includes("theme")) {
      return "To customize your ProfileHub, click the gear icon or use '/help customize'. You can change themes, colors, position, and more!";
    }

    // Stats and profile
    if (lowerMessage.includes("stats") || lowerMessage.includes("profile")) {
      return "Your profile stats show your widgets, followers, and views. Use '/stats' to see detailed information about your account.";
    }

    return null;
  }

  getFallbackResponse(message) {
    const responses = [
      "I'm your integrated AI assistant! I can help you navigate, customize your hub, and answer questions about the platform.",
      "Try using commands like '/navigate projects' or '/help customize' for quick actions!",
      "I can help you understand ProfileHub features. What would you like to explore?",
      "Your ProfileHub is fully customizable! Ask me about themes, positioning, or navigation.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  executeCommand(command) {
    console.log("[CHATBOT MODULE] Executing command:", command);

    const parts = command.split(" ");
    const action = parts[0].substring(1); // Remove '/'
    const target = parts.slice(1).join(" ");

    switch (action) {
      case "navigate":
        this.executeNavigateCommand(target);
        break;
      case "help":
        this.executeHelpCommand(target);
        break;
      case "stats":
        this.executeStatsCommand();
        break;
      case "customize":
        this.executeCustomizeCommand();
        break;
      default:
        this.addMessage(
          `Unknown command: ${command}. Try '/help' for available commands.`,
          "ai"
        );
    }
  }

  executeNavigateCommand(target) {
    const routes = {
      projects: "pages/profile_dashboard/my-projects.html",
      studio: "pages/profile_dashboard/widget_studio.html",
      explore: "pages/explore.html",
      community: "pages/users.html",
    };

    if (routes[target]) {
      this.addMessage(`Navigating to ${target}...`, "ai");
      setTimeout(() => {
        window.location.href = routes[target];
      }, 1000);
    } else {
      this.addMessage(
        `Available navigation targets: ${Object.keys(routes).join(", ")}`,
        "ai"
      );
    }
  }

  executeHelpCommand(topic) {
    if (topic === "customize") {
      this.addMessage(
        "To customize your ProfileHub: Click the gear icon, choose themes, adjust colors and position. Your changes are saved automatically!",
        "ai"
      );
      this.hub.toggleCustomization();
    } else {
      this.addMessage(
        `Available commands:
      • /navigate [projects|studio|explore|community]
      • /help [customize]
      • /stats
      • /customize`,
        "ai"
      );
    }
  }

  executeStatsCommand() {
    const { user } = this.hub.state;
    if (user.isAuthenticated) {
      this.addMessage(
        `Your Stats:
      • Level: ${user.profile?.level || 1}
      • Widgets: ${user.profile?.stats?.widgetsCreated || 0}
      • Followers: ${user.profile?.stats?.followersCount || 0}
      • Views: ${user.profile?.stats?.totalViews || 0}`,
        "ai"
      );
    } else {
      this.addMessage("Please log in to view your stats!", "ai");
    }
  }

  executeCustomizeCommand() {
    this.addMessage("Opening customization panel...", "ai");
    this.hub.toggleCustomization();
  }

  setupQuickCommands() {
    // Quick commands are set up in the HTML and handled by event listeners
  }

  loadChatHistory() {
    // Load previous chat messages if available
    try {
      const saved = localStorage.getItem("profilehub-chat-history");
      if (saved) {
        const history = JSON.parse(saved);
        this.hub.setState({ chatbot: { messages: history } }, false);

        // Restore messages to UI
        history.forEach((msg) => {
          this.addMessage(msg.content, msg.sender);
        });
      }
    } catch (error) {
      console.warn("[CHATBOT MODULE] Failed to load chat history:", error);
    }
  }
}

/**
 * Customization Module - Handles hub customization
 */
class CustomizationModule {
  constructor(hubManager) {
    this.hub = hubManager;
    this.setupCustomizationControls();
    console.log("[CUSTOMIZATION MODULE] Initialized");
  }

  setupCustomizationControls() {
    const panel = document.getElementById("hubCustomizationPanel");
    if (!panel) return;

    // Theme selection
    const themeOptions = panel.querySelectorAll(".theme-option");
    themeOptions.forEach((option) => {
      this.hub.addEventListener(option, "click", () => {
        this.setTheme(option.dataset.theme);
      });
    });

    // Color picker
    const colorPicker = panel.querySelector("#hubPrimaryColor");
    if (colorPicker) {
      this.hub.addEventListener(colorPicker, "change", (e) => {
        this.setPrimaryColor(e.target.value);
      });
    }

    // Position selector removed to prevent breakpoints

    // Size slider
    const sizeSlider = panel.querySelector("#hubSize");
    if (sizeSlider) {
      this.hub.addEventListener(sizeSlider, "input", (e) => {
        this.setSize(parseFloat(e.target.value));
      });
    }

    // Save/Reset buttons
    const saveBtn = panel.querySelector("#saveCustomization");
    const resetBtn = panel.querySelector("#resetCustomization");

    if (saveBtn) {
      this.hub.addEventListener(saveBtn, "click", () => {
        this.saveCustomization();
      });
    }

    if (resetBtn) {
      this.hub.addEventListener(resetBtn, "click", () => {
        this.resetCustomization();
      });
    }
  }

  setTheme(theme) {
    console.log("[CUSTOMIZATION MODULE] Setting theme:", theme);

    this.hub.setState({
      ui: { theme },
      user: { preferences: { theme } },
    });

    // Update theme option active state
    document.querySelectorAll(".theme-option").forEach((option) => {
      option.classList.toggle("active", option.dataset.theme === theme);
    });
  }

  setPrimaryColor(color) {
    console.log("[CUSTOMIZATION MODULE] Setting primary color:", color);

    this.hub.dom.hub.style.setProperty("--hub-primary", color);

    this.hub.setState({
      user: { preferences: { primaryColor: color } },
    });
  }

  // setPosition method removed to prevent breakpoints

  setSize(scale) {
    console.log("[CUSTOMIZATION MODULE] Setting size:", scale);

    this.hub.setState({
      ui: { scale },
      user: { preferences: { scale } },
    });
  }

  saveCustomization() {
    this.hub.savePreferences();
    this.showCustomizationToast("Customization saved!", "success");
  }

  resetCustomization() {
    const defaults = this.hub.getDefaultPreferences();

    this.hub.setState({
      ui: {
        theme: defaults.theme,
        position: defaults.position,
        scale: defaults.scale,
      },
      user: { preferences: defaults },
    });

    // Reset UI controls
    this.updateCustomizationUI();

    this.showCustomizationToast("Customization reset to defaults", "info");
  }

  updateCustomizationUI() {
    const { ui } = this.hub.state;

    // Update theme buttons
    document.querySelectorAll(".theme-option").forEach((option) => {
      option.classList.toggle("active", option.dataset.theme === ui.theme);
    });

    // Update form controls
    const colorPicker = document.getElementById("hubPrimaryColor");
    const sizeSlider = document.getElementById("hubSize");

    if (sizeSlider) sizeSlider.value = ui.scale;
  }

  showCustomizationToast(message, type) {
    // Use existing toast system if available
    if (window.socialAuth && window.socialAuth.showToast) {
      window.socialAuth.showToast(message, type);
    } else {
      console.log(`[CUSTOMIZATION MODULE] ${message}`);
    }
  }
}

/**
 * Navigation Module - Handles navigation and quick actions
 */
class NavigationModule {
  constructor(hubManager) {
    this.hub = hubManager;
    console.log("[NAVIGATION MODULE] Initialized");
  }

  openWidgetStudio() {
    console.log("[NAVIGATION MODULE] Opening Widget Studio...");

    if (window.openWidgetStudio) {
      window.openWidgetStudio();
    } else {
      window.location.href = "pages/profile_dashboard/widget_studio.html";
    }

    this.hub.setState({ ui: { hubState: "minimized" } });
  }

  shareProfile() {
    console.log("[NAVIGATION MODULE] Sharing profile...");

    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: "Check out my profile!",
        url: url,
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      this.showNavigationToast("Profile URL copied to clipboard!", "success");
    }
  }

  openNotifications() {
    console.log("[NAVIGATION MODULE] Opening notifications...");

    // Toggle notification panel or navigate to notifications page
    if (window.openNotificationsPanel) {
      window.openNotificationsPanel();
    } else {
      this.showNavigationToast("Notifications panel coming soon!", "info");
    }
  }

  showNavigationToast(message, type) {
    if (window.socialAuth && window.socialAuth.showToast) {
      window.socialAuth.showToast(message, type);
    }
  }
}

// Load ProfileHub HTML content and inject it
async function loadProfileHubHTML() {
  try {
    console.log("[PROFILE HUB] Loading ProfileHub HTML content...");

    // Add a small delay to ensure DOM is ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Try multiple paths for the HTML file
    const possiblePaths = [
      "pages/page_modals/profile_banner.html",
      "./pages/page_modals/profile_banner.html",
      "/pages/page_modals/profile_banner.html",
    ];

    let htmlContent = null;
    let lastError = null;

    for (const path of possiblePaths) {
      try {
        console.log(`[PROFILE HUB] Trying to load from: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          htmlContent = await response.text();
          console.log(`[PROFILE HUB] Successfully loaded HTML from: ${path}`);
          break;
        } else {
          lastError = new Error(
            `Failed to load ProfileHub HTML from ${path}: ${response.status}`
          );
        }
      } catch (error) {
        lastError = error;
        console.warn(
          `[PROFILE HUB] Failed to load from ${path}:`,
          error.message
        );
      }
    }

    if (!htmlContent) {
      throw (
        lastError || new Error("Failed to load ProfileHub HTML from any path")
      );
    }

    const container = document.getElementById("profileHubContainer");

    if (container) {
      container.innerHTML = htmlContent;
      console.log("[PROFILE HUB] ProfileHub HTML content loaded successfully");

      // Initialize ProfileHub after loading
      initializeProfileHub();
    } else {
      console.warn("[PROFILE HUB] ProfileHub container not found");
      // Try to create the container
      createProfileHubContainer();
    }
  } catch (error) {
    console.error("[PROFILE HUB] Error loading ProfileHub HTML:", error);
    // Fallback: create basic ProfileHub structure
    createFallbackProfileHub();
  }
}

// Add this function to create the container if it doesn't exist
function createProfileHubContainer() {
  const container = document.createElement("div");
  container.id = "profileHubContainer";
  container.style.position = "fixed";
  container.style.top = "20px";
  container.style.right = "20px";
  container.style.zIndex = "1000";
  document.body.appendChild(container);
  console.log("[PROFILE HUB] Created ProfileHub container");
}

// Fallback ProfileHub creation if HTML loading fails
function createFallbackProfileHub() {
  console.log("[PROFILE HUB] Creating fallback ProfileHub structure...");

  const container = document.getElementById("profileHubContainer");
  if (!container) return;

  container.innerHTML = `
    <button id="profileHubDrawerToggle" class="profile-hub-drawer-toggle" style="display: none;" title="Show Profile Hub">
      👤
    </button>
    <div id="profileHub" class="profile-hub" data-state="minimized">
      <div class="hub-core">
        <div class="hub-user-section">
          <div class="user-avatar-container">
            <div id="hubUserAvatar" class="hub-user-avatar">
              <span class="avatar-emoji">👤</span>
              <div class="avatar-status-indicator" id="hubStatusIndicator"></div>
            </div>
          </div>
          <div class="hub-user-info">
            <div id="hubUserName" class="hub-user-name">Guest</div>
            <div id="hubUserStatus" class="hub-user-status">Click to customize</div>
            <div id="hubUserLevel" class="hub-user-level">LVL • ?</div>
          </div>
        </div>
        <div class="hub-controls">
          <button id="hubChatbotToggle" class="hub-control-btn" title="AI Assistant">
            <span class="btn-icon">🤖</span>
            <span class="btn-pulse" id="chatbotPulse"></span>
          </button>
          <button id="hubCustomizeToggle" class="hub-control-btn" title="Explore">
            <span class="btn-icon">⚙️</span>
          </button>
          <button id="hubAuthToggle" class="hub-control-btn hub-auth-btn" title="Login / Profile">
            <span class="btn-icon">🔐</span>
          </button>
        </div>
        <button id="hubToggleBtn" class="hub-toggle-btn" title="Expand Hub">
          <span class="toggle-icon">⫷</span>
        </button>
      </div>
      <div class="hub-expanded-content" id="hubExpandedContent">
        <div class="hub-navigation">
          <h3 class="nav-section-title">Navigate</h3>
          <div class="nav-links-grid">
            <a href="pages/profile_dashboard/my-projects.html" class="nav-link" data-color="primary">
              <span class="nav-icon">📊</span>
              <span class="nav-label">Projects</span>
            </a>
            <a href="pages/profile_dashboard/widget_studio.html" class="nav-link" data-color="secondary">
              <span class="nav-icon">🎨</span>
              <span class="nav-label">Studio</span>
            </a>
            <a href="pages/explore.html" class="nav-link" data-color="accent">
              <span class="nav-icon">🔍</span>
              <span class="nav-label">Explore</span>
            </a>
            <a href="pages/users.html" class="nav-link" data-color="success">
              <span class="nav-icon">👥</span>
              <span class="nav-label">Community</span>
            </a>
          </div>
        </div>
        <div class="hub-quick-actions">
          <h3 class="nav-section-title">Quick Actions</h3>
          <div class="quick-actions-grid">
            <button class="quick-action-btn" data-action="newWidget">
              <span class="action-icon">➕</span>
              <span class="action-label">New Widget</span>
            </button>
            <button class="quick-action-btn" data-action="shareProfile">
              <span class="action-icon">🔗</span>
              <span class="action-label">Share</span>
            </button>
            <button class="quick-action-btn" data-action="notifications">
              <span class="action-icon">🔔</span>
              <span class="action-label">Notifications</span>
              <span class="notification-badge" id="hubNotificationBadge">0</span>
            </button>
            <button class="quick-action-btn" data-action="settings">
              <span class="action-icon">⚙️</span>
              <span class="action-label">Settings</span>
            </button>
          </div>
        </div>
        <div class="hub-user-stats" id="hubUserStats" style="display: none;">
          <h3 class="nav-section-title">Stats</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value" id="hubWidgetCount">0</span>
              <span class="stat-label">Widgets</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="hubFollowerCount">0</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="hubViewCount">0</span>
              <span class="stat-label">Views</span>
            </div>
          </div>
        </div>
      </div>
      <div class="hub-chatbot-container" id="hubChatbotContainer">
        <div class="chatbot-slider" id="chatbotSlider">
          <div class="chatbot-header">
            <div class="chatbot-title">
              <span class="chatbot-icon">🤖</span>
              <span>AI Assistant</span>
            </div>
            <div class="chatbot-controls">
              <button id="chatbotMinimize" class="chatbot-control-btn" title="Minimize">−</button>
              <button id="chatbotClose" class="chatbot-control-btn" title="Close">×</button>
            </div>
          </div>
          <div class="chatbot-content">
            <div class="chat-messages" id="hubChatMessages">
              <div class="message ai-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                  <p>Hi! I'm your AI assistant integrated into your ProfileHub. How can I help you navigate or customize your experience?</p>
                </div>
              </div>
            </div>
            <div class="chat-input-container">
              <input type="text" id="hubChatInput" class="chat-input" placeholder="Ask me anything..." maxlength="500">
              <button id="hubSendChatBtn" class="send-chat-btn">
                <span class="btn-icon">📤</span>
              </button>
            </div>
            <div class="chat-quick-commands" id="hubChatCommands">
              <button class="command-chip" data-command="/navigate projects">🔗 Projects</button>
              <button class="command-chip" data-command="/help customize">⚙️ Customize</button>
              <button class="command-chip" data-command="/stats">📊 Stats</button>
              <button class="command-chip" data-command="/help">❓ Help</button>
            </div>
          </div>
        </div>
      </div>
      <div class="hub-customization-panel" id="hubCustomizationPanel">
        <div class="customization-content">
          <h3>Customize Your Hub</h3>
          <div class="customization-section">
            <label class="section-label">Theme</label>
            <div class="theme-selector">
              <button class="theme-option active" data-theme="neo-brutalist">Neo</button>
              <button class="theme-option" data-theme="minimal">Minimal</button>
              <button class="theme-option" data-theme="cyberpunk">Cyber</button>
              <button class="theme-option" data-theme="custom">Custom</button>
            </div>
          </div>
          <div class="customization-section">
            <label class="section-label">Primary Color</label>
            <input type="color" id="hubPrimaryColor" class="color-picker" value="#00f0ff">
          </div>
          <div class="customization-section">
            <label class="section-label">Hub Size</label>
            <input type="range" id="hubSize" class="size-slider" min="0.8" max="1.5" step="0.1" value="1">
          </div>
          <div class="customization-actions">
            <button id="saveCustomization" class="save-btn">Save Changes</button>
            <button id="resetCustomization" class="reset-btn">Reset</button>
          </div>
        </div>
      </div>
    </div>
    <div id="profileHubOverlay" class="profile-hub-overlay"></div>
  `;

  console.log("[PROFILE HUB] Fallback ProfileHub structure created");
}

// Initialize ProfileHub when DOM is ready
let profileHubManager = null;

// Enhanced initialization with better error handling
async function initializeProfileHubSystem() {
  console.log("[PROFILE HUB] Starting ProfileHub system initialization...");

  try {
    // Ensure the container exists
    let container = document.getElementById("profileHubContainer");
    if (!container) {
      console.log("[PROFILE HUB] Creating ProfileHub container...");
      createProfileHubContainer();
      container = document.getElementById("profileHubContainer");
    }

    // Load and inject ProfileHub HTML content
    await loadProfileHubHTML();

    // Wait a bit for DOM to be fully ready
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Initialize the ProfileHub manager
    profileHubManager = new ProfileHubManager();

    // Expose for debugging [[memory:4664284]]
    window.profileHubManager = profileHubManager;

    console.log("[PROFILE HUB] ProfileHub system ready!");
    return true;
  } catch (error) {
    console.error("[PROFILE HUB] Failed to initialize ProfileHub:", error);

    // Fallback: try to create ProfileHub manually
    console.log("[PROFILE HUB] Attempting fallback initialization...");
    try {
      createFallbackProfileHub();
      await new Promise((resolve) => setTimeout(resolve, 100));
      profileHubManager = new ProfileHubManager();
      window.profileHubManager = profileHubManager;
      console.log("[PROFILE HUB] Fallback initialization successful!");
      return true;
    } catch (fallbackError) {
      console.error(
        "[PROFILE HUB] Fallback initialization also failed:",
        fallbackError
      );
      return false;
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[PROFILE HUB] DOM ready, initializing ProfileHub...");
  await initializeProfileHubSystem();
});

// Expose functions globally for compatibility
window.toggleProfileHub = () => profileHubManager?.toggleHub();
window.toggleProfileChatbot = () => profileHubManager?.toggleChatbot();
window.openProfileCustomization = () =>
  profileHubManager?.toggleCustomization();
window.toggleProfileHubDrawer = () => profileHubManager?.toggleDrawer();

// Debug function to reset profile banner position
window.resetProfileBannerPosition = (position = "top-right") => {
  console.log("[PROFILE HUB DEBUG] Resetting position to:", position);
  if (profileHubManager) {
    profileHubManager.setState({
      ui: { position },
      user: { preferences: { position } },
    });
    profileHubManager.updateUI();
    console.log("[PROFILE HUB DEBUG] Position reset complete");
  } else {
    console.warn("[PROFILE HUB DEBUG] ProfileHub manager not available");
  }
};

// Debug function to force show ProfileHub
window.forceShowProfileHub = () => {
  console.log("[PROFILE HUB DEBUG] Forcing ProfileHub to show");

  // Check if ProfileHub container exists
  const container = document.getElementById("profileHubContainer");
  if (!container) {
    console.error("[PROFILE HUB DEBUG] ProfileHub container not found!");
    return;
  }

  // Check if ProfileHub element exists
  const profileHub = document.getElementById("profileHub");
  if (!profileHub) {
    console.error(
      "[PROFILE HUB DEBUG] ProfileHub element not found! Creating fallback..."
    );
    createFallbackProfileHub();

    // Also create the manager if it doesn't exist
    if (!profileHubManager) {
      console.log("[PROFILE HUB DEBUG] Creating ProfileHub manager...");
      profileHubManager = new ProfileHubManager();
      window.profileHubManager = profileHubManager;
    }
    return;
  }

  // Force visibility
  profileHub.style.display = "block";
  profileHub.style.opacity = "1";
  profileHub.style.visibility = "visible";
  profileHub.style.zIndex = "1000";

  // Force position
  profileHub.style.position = "fixed";
  profileHub.style.top = "20px";
  profileHub.style.right = "20px";

  console.log("[PROFILE HUB DEBUG] ProfileHub forced to show");

  // Try to initialize manager if not available
  if (!profileHubManager) {
    console.log("[PROFILE HUB DEBUG] Initializing ProfileHub manager...");
    try {
      profileHubManager = new ProfileHubManager();
      window.profileHubManager = profileHubManager;
      console.log("[PROFILE HUB DEBUG] ProfileHub manager initialized");
    } catch (error) {
      console.error(
        "[PROFILE HUB DEBUG] Failed to initialize ProfileHub manager:",
        error
      );
    }
  }
};

// Debug function to check ProfileHub status
window.checkProfileHubStatus = () => {
  console.log("[PROFILE HUB DEBUG] Checking ProfileHub status...");

  const status = {
    container: !!document.getElementById("profileHubContainer"),
    profileHub: !!document.getElementById("profileHub"),
    manager: !!profileHubManager,
    managerState: profileHubManager?.state || null,
    cssLoaded: !!document.querySelector('link[href*="profile_banner.css"]'),
    scriptLoaded: !!window.ProfileHubEvents,
  };

  console.log("[PROFILE HUB DEBUG] Status:", status);
  return status;
};

// Global event system for profile hub position changes
window.ProfileHubEvents = {
  /**
   * Listen for profile hub position changes
   * @param {Function} callback - Function to call when position changes
   * @returns {Function} - Unsubscribe function
   */
  onPositionChange: (callback) => {
    const handler = (event) => {
      callback(event.detail);
    };

    window.addEventListener("profilehub-position-changed", handler);

    // Return unsubscribe function
    return () => {
      window.removeEventListener("profilehub-position-changed", handler);
    };
  },

  /**
   * Listen for profile hub state changes
   * @param {Function} callback - Function to call when state changes
   * @returns {Function} - Unsubscribe function
   */
  onStateChange: (callback) => {
    const handler = (event) => {
      callback(event.detail);
    };

    window.addEventListener("profilehub-state-changed", handler);

    // Return unsubscribe function
    return () => {
      window.removeEventListener("profilehub-state-changed", handler);
    };
  },

  /**
   * Get current profile hub position
   * @returns {string} - Current position
   */
  getCurrentPosition: () => {
    return profileHubManager?.state?.ui?.position || "top-right";
  },

  /**
   * Get current profile hub state
   * @returns {string} - Current state
   */
  getCurrentState: () => {
    return profileHubManager?.state?.ui?.hubState || "minimized";
  },

  /**
   * Check if a modal is currently open
   * @param {string} modalType - Type of modal ('expanded', 'chatbot', 'customization')
   * @returns {boolean} - Whether modal is open
   */
  isModalOpen: (modalType) => {
    if (!profileHubManager) return false;

    const { ui } = profileHubManager.state;

    switch (modalType) {
      case "expanded":
        return ui.hubState === "expanded";
      case "chatbot":
        return ui.hubState === "chatbot-active";
      case "customization":
        return ui.customizationState === "open";
      default:
        return false;
    }
  },
};

// Legacy function compatibility
window.openChatbot = () => profileHubManager?.toggleChatbot();
window.openWorkflowManager = () => {
  // Open workflow manager modal
  const modal = document.getElementById("workflowManagerModal");
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }
};

// Manual initialization function for debugging
window.initProfileHub = () => {
  console.log("[PROFILE HUB] Manual initialization triggered");
  try {
    if (!profileHubManager) {
      createFallbackProfileHub();
      profileHubManager = new ProfileHubManager();
      window.profileHubManager = profileHubManager;
      console.log("[PROFILE HUB] Manual initialization successful");
    } else {
      console.log("[PROFILE HUB] ProfileHub already initialized");
    }
  } catch (error) {
    console.error("[PROFILE HUB] Manual initialization failed:", error);
  }
};

// Global functions for mobile drawer and other integrations
window.openAuthModal = (mode = "login") => {
  // Use existing auth modal
  const authModal = document.getElementById("authModal");
  if (authModal) {
    authModal.style.display = "block";
    document.body.style.overflow = "hidden";

    // Set the correct form based on mode
    const loginForm = document.getElementById("loginForm");
    const signUpForm = document.getElementById("signUpForm");
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const authModalTitle = document.getElementById("authModalTitle");

    if (mode === "signup") {
      loginForm.style.display = "none";
      signUpForm.style.display = "block";
      forgotPasswordForm.style.display = "none";
      authModalTitle.textContent = "Sign Up";
    } else if (mode === "forgot") {
      loginForm.style.display = "none";
      signUpForm.style.display = "none";
      forgotPasswordForm.style.display = "block";
      authModalTitle.textContent = "Reset Password";
    } else {
      loginForm.style.display = "block";
      signUpForm.style.display = "none";
      forgotPasswordForm.style.display = "none";
      authModalTitle.textContent = "Login";
    }
  }
};

console.log("[PROFILE HUB] ProfileHub module loaded successfully");

// Additional timeout-based initialization as a safety net
setTimeout(() => {
  if (!profileHubManager) {
    console.log("[PROFILE HUB] Timeout-based initialization triggered");
    try {
      // Check if container exists
      const container = document.getElementById("profileHubContainer");
      if (container && !container.querySelector("#profileHub")) {
        console.log("[PROFILE HUB] Creating ProfileHub via timeout fallback");
        createFallbackProfileHub();
        profileHubManager = new ProfileHubManager();
        window.profileHubManager = profileHubManager;
        console.log("[PROFILE HUB] Timeout-based initialization successful");
      }
    } catch (error) {
      console.error(
        "[PROFILE HUB] Timeout-based initialization failed:",
        error
      );
    }
  }
}, 2000); // 2 second delay

// Debug function to reposition orb to top-left
window.repositionOrbToTopLeft = () => {
  console.log("[PROFILE HUB DEBUG] Repositioning orb to top-left");

  const orbContainer = document.querySelector(".floating-orb-container");
  if (orbContainer) {
    // Update CSS variables for better top-left positioning
    document.documentElement.style.setProperty("--orb-left", "20px");
    document.documentElement.style.setProperty("--orb-top", "20px");

    // Apply mobile positioning for smaller screens
    if (window.innerWidth <= 768) {
      document.documentElement.style.setProperty("--orb-left", "15px");
      document.documentElement.style.setProperty("--orb-top", "15px");
    }

    console.log(
      "[PROFILE HUB DEBUG] Orb repositioned to top-left successfully"
    );
  } else {
    console.warn("[PROFILE HUB DEBUG] Orb container not found");
  }
};

// Emergency function to restore ProfileHub
window.restoreProfileHub = () => {
  console.log("[PROFILE HUB EMERGENCY] Restoring ProfileHub...");

  // Force create the ProfileHub
  createFallbackProfileHub();

  // Create manager if it doesn't exist
  if (!profileHubManager) {
    profileHubManager = new ProfileHubManager();
    window.profileHubManager = profileHubManager;
    console.log("[PROFILE HUB EMERGENCY] Manager created");
  }

  // Force show it
  const profileHub = document.getElementById("profileHub");
  if (profileHub) {
    profileHub.style.display = "block";
    profileHub.style.opacity = "1";
    profileHub.style.visibility = "visible";
    profileHub.style.position = "fixed";
    profileHub.style.top = "20px";
    profileHub.style.right = "20px";
    profileHub.style.zIndex = "1000";
    console.log("[PROFILE HUB EMERGENCY] ProfileHub restored and visible!");
  } else {
    console.error("[PROFILE HUB EMERGENCY] Failed to restore ProfileHub");
  }
};

// Debug function to test sliding modal
window.testSlidingModal = () => {
  console.log("[PROFILE HUB DEBUG] Testing sliding modal animation");

  const customizationPanel = document.getElementById("hubCustomizationPanel");
  if (customizationPanel) {
    // Toggle the active class to test animation
    customizationPanel.classList.toggle("active");
    console.log("[PROFILE HUB DEBUG] Sliding modal animation toggled");
  } else {
    console.warn("[PROFILE HUB DEBUG] Customization panel not found");
  }
};

// Debug function to diagnose profile connection issues
window.diagnoseProfileIssues = () => {
  console.log("[PROFILE HUB DEBUG] Diagnosing profile connection issues...");

  const diagnosis = {
    timestamp: new Date().toISOString(),
    profileHubContainer: !!document.getElementById("profileHubContainer"),
    profileHub: !!document.getElementById("profileHub"),
    profileHubManager: !!window.profileHubManager,
    authUser: !!window.socialAuth?.currentUser,
    firebaseAuth: !!window.auth?.currentUser,
    widgetDisplay: !!window.widgetDisplay,
    firestoreRules: "Check Firebase Console for updated rules",
    networkStatus: navigator.onLine ? "online" : "offline",
  };

  console.log("[PROFILE HUB DEBUG] Diagnosis results:", diagnosis);

  // Check for specific error patterns
  if (!diagnosis.profileHubContainer) {
    console.error(
      "[PROFILE HUB DEBUG] Missing profileHubContainer - this is critical!"
    );
  }

  if (!diagnosis.profileHub) {
    console.error(
      "[PROFILE HUB DEBUG] Missing profileHub element - HTML may not have loaded"
    );
  }

  if (!diagnosis.profileHubManager) {
    console.error("[PROFILE HUB DEBUG] ProfileHub manager not initialized");
  }

  if (!diagnosis.authUser && !diagnosis.firebaseAuth) {
    console.warn("[PROFILE HUB DEBUG] No authenticated user found");
  }

  return diagnosis;
};

// Debug function to force reinitialize ProfileHub
window.reinitializeProfileHub = async () => {
  console.log("[PROFILE HUB DEBUG] Force reinitializing ProfileHub...");

  // Clean up existing instance
  if (window.profileHubManager) {
    try {
      window.profileHubManager.destroy();
    } catch (error) {
      console.warn(
        "[PROFILE HUB DEBUG] Error destroying existing manager:",
        error
      );
    }
  }

  // Clear container
  const container = document.getElementById("profileHubContainer");
  if (container) {
    container.innerHTML = "";
  }

  // Reinitialize
  await initializeProfileHubSystem();

  console.log("[PROFILE HUB DEBUG] Reinitialization complete");
};
