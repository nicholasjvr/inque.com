// ============================================
// 🌟 3D FLOATING ORB NOTIFICATION SYSTEM 🌟
// ============================================

const ORB_DEBUG = {
  log: (message, data = null) => {
    console.log(`[FLOATING ORB] ${message}`, data || "");
  },
  error: (message, error = null) => {
    console.error(`[FLOATING ORB ERROR] ${message}`, error || "");
  },
  warn: (message, data = null) => {
    console.warn(`[FLOATING ORB WARN] ${message}`, data || "");
  },
};

class FloatingOrbManager {
  constructor(options = {}) {
    this.options = {
      debugMode: false,
      maxNotifications: 6,
      autoRemoveDelay: 30000, // 30 seconds
      enableSounds: true,
      useThreeJS: true, // try WebGL sphere when available
      threeJsCdn: "https://unpkg.com/three@0.160.0/build/three.module.js",
      ...options,
    };

    this.notifications = [];
    this.container = null;
    this.orb = null;
    this.isInitialized = false;
    this.popupTimeout = null;

    ORB_DEBUG.log("Floating Orb Manager initialized", this.options);
  }

  async init() {
    if (this.isInitialized) {
      ORB_DEBUG.warn("Orb already initialized");
      return;
    }

    try {
      await this.createOrb();
      this.setupEventListeners();
      this.adjustSidebarSpacing();
      this.isInitialized = true;

      ORB_DEBUG.log("Floating orb system initialized successfully");

      // Add some demo notifications for testing
      if (this.options.debugMode) {
        this.addDemoNotifications();
      }
    } catch (error) {
      ORB_DEBUG.error("Failed to initialize floating orb", error);
    }
  }

  async createOrb() {
    // Create the main container
    this.container = document.createElement("div");
    this.container.className = "floating-orb-container";
    this.container.setAttribute("data-debug", this.options.debugMode);

    // Create the orb (CSS fallback)
    this.orb = document.createElement("div");
    this.orb.className = "floating-orb";
    this.orb.title = "Notification Center - Click to expand";

    // Create the orbit ring for notifications
    this.orbit = document.createElement("div");
    this.orbit.className = "notification-orbit";

    // Create notification popup
    this.popup = document.createElement("div");
    this.popup.className = "notification-popup";

    // Assemble the structure
    this.container.appendChild(this.orb);
    this.container.appendChild(this.orbit);
    this.container.appendChild(this.popup);

    // Add to DOM
    document.body.appendChild(this.container);

    ORB_DEBUG.log("Orb DOM structure created");

    // Try to enhance with Three.js if available
    if (this.options.useThreeJS) {
      this.tryInitThreeJS().catch((e) => {
        ORB_DEBUG.warn(
          "Three.js enhancement unavailable; using CSS orb only",
          e
        );
      });
    }
  }

  async tryInitThreeJS() {
    // Skip if module already loaded
    if (window.__orbThree) {
      return this.initThreeScene(window.__orbThree);
    }

    try {
      const three = await import(/* @vite-ignore */ this.options.threeJsCdn);
      window.__orbThree = three;
      await this.initThreeScene(three);
    } catch (err) {
      throw err;
    }
  }

  async initThreeScene(THREE) {
    // Create a canvas layer behind the CSS orb
    const webglLayer = document.createElement("div");
    webglLayer.className = "orb-3d-layer";
    this.container.appendChild(webglLayer);

    const width = webglLayer.clientWidth || 200;
    const height = webglLayer.clientHeight || 200;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    webglLayer.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 3.2;

    // Orb geometry + material
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x34f5ff,
      roughness: 0.25,
      metalness: 0.6,
      emissive: 0x0cf0ff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.95,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const ambient = new THREE.AmbientLight(0x66ffff, 0.6);
    scene.add(ambient);
    const point = new THREE.PointLight(0x88aaff, 1.5);
    point.position.set(2, 2, 2);
    scene.add(point);

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      sphere.rotation.y = t * 0.4;
      sphere.rotation.x = Math.sin(t * 0.6) * 0.15;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    ORB_DEBUG.log("Three.js orb enhancement initialized");
  }

  setupEventListeners() {
    // Orb click handler
    this.orb.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleNotificationsList();
      ORB_DEBUG.log("Orb clicked - toggling notifications");
    });

    // Orb hover handlers
    this.orb.addEventListener("mouseenter", () => {
      this.showLatestNotification();
    });

    this.orb.addEventListener("mouseleave", () => {
      this.hideNotificationPopup();
    });

    // Global click handler to close popup
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) {
        this.hideNotificationPopup();
      }
    });

    // Keyboard accessibility
    this.orb.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggleNotificationsList();
      }
    });

    // Add tab index for accessibility
    this.orb.setAttribute("tabindex", "0");
    this.orb.setAttribute("role", "button");
    this.orb.setAttribute("aria-label", "Notification Center");

    ORB_DEBUG.log("Event listeners set up");
  }

  adjustSidebarSpacing() {
    // Adjust sidebar positioning to accommodate the orb
    const sidebar = document.querySelector(".sidebar-nav");
    if (sidebar) {
      // Add some left padding to avoid orb overlap
      sidebar.style.paddingLeft = "120px";
      ORB_DEBUG.log("Sidebar spacing adjusted for orb");
    }

    // Also adjust hamburger menu position on smaller screens
    const hamburger = document.querySelector(".hamburger-menu");
    if (hamburger) {
      const mediaQuery = window.matchMedia("(max-width: 768px)");

      const updateHamburgerPosition = (e) => {
        if (e.matches) {
          // On mobile, move hamburger further right to avoid orb
          hamburger.style.left = "100px";
        } else {
          hamburger.style.left = "";
        }
      };

      updateHamburgerPosition(mediaQuery);
      mediaQuery.addListener(updateHamburgerPosition);
    }
  }

  // Notification Management
  addNotification(notification) {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      title: notification.title || "New Notification",
      message: notification.message || "",
      type: notification.type || "info", // info, success, warning, error
      timestamp: new Date(),
      icon: this.getIconForType(notification.type),
      priority: notification.priority || "normal", // low, normal, high
      actions: notification.actions || [],
      ...notification,
    };

    // Add to notifications array
    this.notifications.unshift(newNotification);

    // Limit the number of notifications
    if (this.notifications.length > this.options.maxNotifications) {
      const removed = this.notifications.pop();
      this.removeNotificationCard(removed.id);
    }

    // Create visual notification card
    this.createNotificationCard(newNotification);

    // Update orb state
    this.updateOrbState();

    // Auto-remove after delay (if enabled)
    if (this.options.autoRemoveDelay > 0 && notification.autoRemove !== false) {
      setTimeout(() => {
        this.removeNotification(id);
      }, this.options.autoRemoveDelay);
    }

    ORB_DEBUG.log("Notification added", newNotification);
    return id;
  }

  removeNotification(id) {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      const notification = this.notifications.splice(index, 1)[0];
      this.removeNotificationCard(id);
      this.updateOrbState();
      ORB_DEBUG.log("Notification removed", notification);
    }
  }

  createNotificationCard(notification) {
    const card = document.createElement("div");
    card.className = "notification-card";
    card.setAttribute("data-id", notification.id);
    card.innerHTML = notification.icon;
    card.title = notification.title;

    // Add click handler for detailed view
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showNotificationDetails(notification);
      ORB_DEBUG.log("Notification card clicked", notification);
    });

    // Add hover handler
    card.addEventListener("mouseenter", () => {
      this.showNotificationPreview(notification);
    });

    this.orbit.appendChild(card);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      card.style.transform = "scale(1.2)";
      setTimeout(() => {
        card.style.transform = "";
      }, 300);
    });
  }

  removeNotificationCard(id) {
    const card = this.orbit.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.style.animation = "none";
      card.style.transform = "scale(0)";
      card.style.opacity = "0";
      setTimeout(() => {
        if (card.parentNode) {
          card.parentNode.removeChild(card);
        }
      }, 300);
    }
  }

  updateOrbState() {
    const hasNotifications = this.notifications.length > 0;
    this.container.classList.toggle("has-notifications", hasNotifications);

    // Update accessibility
    this.orb.setAttribute(
      "aria-label",
      hasNotifications
        ? `Notification Center - ${this.notifications.length} notifications`
        : "Notification Center - No notifications"
    );
  }

  // UI Methods
  showNotificationDetails(notification) {
    this.popup.innerHTML = `
            <h4>${this.escapeHtml(notification.title)}</h4>
            <p>${this.escapeHtml(notification.message)}</p>
            ${notification.actions ? this.renderNotificationActions(notification.actions) : ""}
            <div class="timestamp">${this.formatTimestamp(notification.timestamp)}</div>
        `;
    this.popup.classList.add("show");

    // Auto-hide after 5 seconds
    clearTimeout(this.popupTimeout);
    this.popupTimeout = setTimeout(() => {
      this.hideNotificationPopup();
    }, 5000);
  }

  showNotificationPreview(notification) {
    this.popup.innerHTML = `
            <h4>${this.escapeHtml(notification.title)}</h4>
            <p>${this.escapeHtml(notification.message.substring(0, 100))}${notification.message.length > 100 ? "..." : ""}</p>
        `;
    this.popup.classList.add("show");
  }

  showLatestNotification() {
    if (this.notifications.length > 0) {
      this.showNotificationPreview(this.notifications[0]);
    }
  }

  hideNotificationPopup() {
    this.popup.classList.remove("show");
    clearTimeout(this.popupTimeout);
  }

  toggleNotificationsList() {
    // This method can be expanded to show a full notification panel
    // For now, it cycles through notifications
    if (this.notifications.length === 0) {
      this.addNotification({
        title: "No Notifications",
        message: "You're all caught up! 🎉",
        type: "info",
        autoRemove: false,
      });
    } else {
      this.showNotificationDetails(this.notifications[0]);
    }
  }

  // Utility Methods
  getIconForType(type) {
    const icons = {
      info: "💬",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      update: "🔄",
      like: "❤️",
      comment: "💭",
      follow: "👥",
      system: "⚙️",
    };
    return icons[type] || icons.info;
  }

  formatTimestamp(timestamp) {
    const now = new Date();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return timestamp.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  renderNotificationActions(actions) {
    return actions
      .map(
        (action) =>
          `<button class="notification-action-btn" onclick="window.floatingOrb.handleNotificationAction('${action.id}', '${action.handler}')">${action.label}</button>`
      )
      .join("");
  }

  handleNotificationAction(actionId, handler) {
    ORB_DEBUG.log("Notification action triggered", { actionId, handler });
    // Implement action handlers here
    if (typeof window[handler] === "function") {
      window[handler](actionId);
    }
  }

  // Demo/Testing Methods
  addDemoNotifications() {
    const demoNotifications = [
      {
        title: "Welcome!",
        message:
          "Your floating orb is now active and ready for notifications! 🚀",
        type: "success",
      },
      {
        title: "New Feature",
        message: "Check out the latest widget studio updates.",
        type: "info",
      },
      {
        title: "System Update",
        message: "Your profile has been synced successfully.",
        type: "update",
      },
    ];

    demoNotifications.forEach((notification, index) => {
      setTimeout(() => {
        this.addNotification(notification);
      }, index * 1000);
    });
  }

  // Public API Methods
  clear() {
    this.notifications = [];
    this.orbit.innerHTML = "";
    this.updateOrbState();
    this.hideNotificationPopup();
    ORB_DEBUG.log("All notifications cleared");
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    // Reset sidebar spacing
    const sidebar = document.querySelector(".sidebar-nav");
    if (sidebar) {
      sidebar.style.paddingLeft = "";
    }

    this.isInitialized = false;
    ORB_DEBUG.log("Floating orb destroyed");
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the floating orb with debug mode for development
  window.floatingOrb = new FloatingOrbManager({
    debugMode: true, // Set to false in production
    maxNotifications: 6,
    autoRemoveDelay: 30000,
  });

  window.floatingOrb.init();

  ORB_DEBUG.log("Floating orb system loaded and ready!");
});

// Export for module usage
export default FloatingOrbManager;
