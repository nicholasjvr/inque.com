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
      this.bindProfileHubEvents();
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

  bindProfileHubEvents() {
    try {
      if (this._hubBound) return;
      this._hubBound = true;

      const applyState = (state, changes) => {
        if (!state) return;
        const isActive = state.ui?.hubState === "chatbot-active";
        const isTyping = !!state.chatbot?.isTyping;

        if (this.container) {
          this.container.setAttribute(
            "data-chatbot",
            isActive ? "active" : "inactive"
          );
          this.container.setAttribute(
            "data-typing",
            isTyping ? "true" : "false"
          );
        }
        if (this.orb) {
          this.orb.classList.toggle("chat-active", isActive);
          this.orb.classList.toggle("typing", isTyping);
        }

        // Quick ping flash when new messages array provided
        if (changes?.chatbot?.messages && this.orb) {
          this.orb.classList.add("message-ping");
          setTimeout(
            () => this.orb && this.orb.classList.remove("message-ping"),
            380
          );
        }
      };

      // Initial sync if manager is already present
      const currentState = window.profileHubManager?.state;
      if (currentState) {
        ORB_DEBUG.log("Syncing orb with existing ProfileHub state");
        applyState(currentState, null);
      }

      // Listen for profile hub state changes
      window.addEventListener("profilehub-state-changed", (e) => {
        const { state, changes } = e.detail || {};
        ORB_DEBUG.log("ProfileHub state changed detected by orb", {
          hubState: state?.ui?.hubState,
          typing: state?.chatbot?.isTyping,
        });
        applyState(state, changes);
      });

      ORB_DEBUG.log("Floating orb bound to ProfileHub events");
    } catch (err) {
      ORB_DEBUG.warn("Failed to bind ProfileHub events", err);
    }
  }

  async createOrb() {
    // Create the main container
    this.container = document.createElement("div");
    this.container.className = "floating-orb-wrapper";
    this.container.setAttribute("data-debug", this.options.debugMode);

    // Create an inner centering stage for the orb/orbit
    this.stage = document.createElement("div");
    this.stage.style.position = "absolute";
    this.stage.style.top = "50%";
    this.stage.style.left = "50%";
    this.stage.style.transform = "translate(-50%, -50%)";
    this.stage.style.width = "var(--orbit-size)";
    this.stage.style.height = "var(--orbit-size)";

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
    this.stage.appendChild(this.orb);
    this.stage.appendChild(this.orbit);
    this.container.appendChild(this.stage);
    this.container.appendChild(this.popup);

    // Add to DOM
    document.body.appendChild(this.container);

    ORB_DEBUG.log("Orb DOM structure created");

    // Notify listeners that the orb exists in the DOM
    try {
      window.dispatchEvent(
        new CustomEvent("floating-orb:ready", {
          detail: {
            container: this.container,
            orb: this.orb,
            orbit: this.orbit,
            popup: this.popup,
          },
        })
      );
      ORB_DEBUG.log("Dispatched floating-orb:ready event");
    } catch (e) {
      ORB_DEBUG.warn("Failed to dispatch floating-orb:ready event", e);
    }

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
      ORB_DEBUG.log("Three.js already loaded, reusing module");
      return this.initThreeScene(window.__orbThree);
    }

    try {
      ORB_DEBUG.log("Loading Three.js from CDN", {
        url: this.options.threeJsCdn,
      });
      const three = await import(/* @vite-ignore */ this.options.threeJsCdn);
      window.__orbThree = three;
      ORB_DEBUG.log("Three.js CDN module loaded successfully");
      await this.initThreeScene(three);
    } catch (err) {
      ORB_DEBUG.error("Failed to load Three.js from CDN", err);
      throw err;
    }
  }

  async initThreeScene(THREE) {
    ORB_DEBUG.log("Initializing Three.js scene");

    // Create a canvas layer behind the CSS orb
    const webglLayer = document.createElement("div");
    webglLayer.className = "orb-3d-layer";
    this.container.appendChild(webglLayer);

    ORB_DEBUG.log("WebGL layer created and added to container");

    const width = webglLayer.clientWidth || 200;
    const height = webglLayer.clientHeight || 200;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    webglLayer.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 3.2;

    // Resize helper for Three.js canvas
    const setSize = () => {
      const w =
        webglLayer.clientWidth || parseInt(getComputedStyle(webglLayer).width);
      const h =
        webglLayer.clientHeight ||
        parseInt(getComputedStyle(webglLayer).height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();
    new ResizeObserver(setSize).observe(webglLayer);
    window.addEventListener("resize", setSize);

    // Orb geometry + material with normal mapping for glassy caustic look
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Create a procedural normal map for caustic effects
    const normalMapCanvas = document.createElement("canvas");
    normalMapCanvas.width = 256;
    normalMapCanvas.height = 256;
    const normalCtx = normalMapCanvas.getContext("2d");

    // Generate caustic-like normal map
    const imageData = normalCtx.createImageData(256, 256);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % 256;
      const y = Math.floor(i / 4 / 256);
      const noise1 = Math.sin(x * 0.1) * Math.cos(y * 0.1);
      const noise2 =
        Math.sin(x * 0.05 + y * 0.03) * Math.cos(x * 0.03 - y * 0.05);
      const normalX = (noise1 + noise2) * 0.5 + 0.5;
      const normalY = (noise1 - noise2) * 0.5 + 0.5;

      data[i] = normalX * 255; // R
      data[i + 1] = normalY * 255; // G
      data[i + 2] = 255; // B (pointing out)
      data[i + 3] = 255; // A
    }
    normalCtx.putImageData(imageData, 0, 0);

    const normalMap = new THREE.CanvasTexture(normalMapCanvas);
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

    const material = new THREE.MeshStandardMaterial({
      color: 0x34f5ff,
      roughness: 0.15, // More reflective
      metalness: 0.8, // More metallic
      emissive: 0x0cf0ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9,
      normalMap: normalMap, // Add caustic normal mapping
      normalScale: new THREE.Vector2(0.3, 0.3),
      envMapIntensity: 1.2, // Enhanced environment reflections
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

    // Store references for debugging
    this.webglLayer = webglLayer;
    this.threeRenderer = renderer;
    this.threeScene = scene;
    this.threeSphere = sphere;
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
    // Intentionally no-op: orb floats without shifting layout
    ORB_DEBUG.log("Orb floating mode - no layout adjustments needed");
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

// === Floating Orb 3D Controller ===
(() => {
  const ORB3D_LOG = (...args) => console.debug("[Orb3D]", ...args);

  let initialized = false;

  const initTilt = () => {
    if (initialized) return; // guard
    const wrapper = document.querySelector(".floating-orb-wrapper");
    const orb = document.querySelector(".floating-orb");
    const popup = document.querySelector(".notification-popup");

    if (!wrapper || !orb) {
      ORB3D_LOG("Orb not yet in DOM. Will wait for ready event/observer.");
      return;
    }

    initialized = true;
    ORB3D_LOG("Initializing 3D tilt controller");

    // State
    let targetRX = 0,
      targetRY = 0; // rotation targets (deg)
    let curRX = 0,
      curRY = 0; // current rotation (deg)
    let idleTimer = null;
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    // Add idle animation when no user motion
    const setIdle = (on) => {
      if (!orb) return;
      if (on) orb.classList.add("idle");
      else orb.classList.remove("idle");
    };

    // Compute desired rotation from mouse position relative to the orb center
    const updateTargetFromPointer = (clientX, clientY) => {
      const rect = wrapper.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;

      // Normalize to [-1, 1]
      const nx = clamp(dx / (rect.width / 2), -1, 1);
      const ny = clamp(dy / (rect.height / 2), -1, 1);

      // Convert to rotation — keep it classy, not nausea-inducing
      const maxTilt = 10; // degrees
      targetRY = nx * maxTilt; // yaw left/right
      targetRX = -ny * maxTilt; // pitch up/down
    };

    // RAF loop for smooth damping
    const tick = () => {
      const k = 0.12; // stiffness
      const dRX = targetRX - curRX;
      const dRY = targetRY - curRY;
      curRX += dRX * k;
      curRY += dRY * k;

      orb.style.transform = `translate(-50%,-50%) rotateX(${curRX.toFixed(2)}deg) rotateY(${curRY.toFixed(2)}deg)`;
      requestAnimationFrame(tick);
    };

    // Listeners
    const onMove = (e) => {
      setIdle(false);
      if (e.touches && e.touches[0]) {
        updateTargetFromPointer(e.touches[0].clientX, e.touches[0].clientY);
      } else {
        updateTargetFromPointer(e.clientX, e.clientY);
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIdle(true), 2200);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    // Toggle popup below the orb
    orb.addEventListener("click", () => {
      if (!popup) return;
      popup.classList.toggle("show");
    });

    setIdle(true);
    requestAnimationFrame(tick);
    ORB3D_LOG("3D tilt engaged. Try moving your pointer around.");
  };

  // If orb already exists, init immediately when script runs late
  if (document.querySelector(".floating-orb")) {
    initTilt();
  }

  // Listen for explicit ready event from the manager
  window.addEventListener("floating-orb:ready", () => {
    ORB3D_LOG("Received floating-orb:ready");
    initTilt();
  });

  // MutationObserver fallback in case scripts load in odd orders
  const observer = new MutationObserver(() => {
    if (document.querySelector(".floating-orb")) {
      ORB3D_LOG("Observer detected orb in DOM");
      initTilt();
      observer.disconnect();
    }
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();

// Debug functions for testing orb functionality
window.debugOrb = {
  checkStatus: () => {
    const orb = document.querySelector(".floating-orb");
    const wrapper = document.querySelector(".floating-orb-wrapper");
    const webglLayer = document.querySelector(".orb-3d-layer");
    const canvas = webglLayer?.querySelector("canvas");

    console.log("[ORB DEBUG] Status check:", {
      orb: !!orb,
      wrapper: !!wrapper,
      webglLayer: !!webglLayer,
      canvas: !!canvas,
      canvasSize: canvas ? `${canvas.width}x${canvas.height}` : "N/A",
      orbPosition: orb ? getComputedStyle(orb).transform : "N/A",
      threeLoaded: !!window.__orbThree,
    });
  },

  testWebGL: () => {
    const canvas = document.querySelector(".orb-3d-layer canvas");
    if (canvas) {
      const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
      console.log("[ORB DEBUG] WebGL context:", !!gl);
      if (gl) {
        console.log("[ORB DEBUG] WebGL info:", {
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
        });
      }
    } else {
      console.log("[ORB DEBUG] No WebGL canvas found");
    }
  },

  repositionTopLeft: () => {
    const wrapper = document.querySelector(".floating-orb-wrapper");
    if (wrapper) {
      wrapper.style.top = "12px";
      wrapper.style.left = "12px";
      console.log("[ORB DEBUG] Repositioned to top-left");
    }
  },
};

// Export for module usage
export default FloatingOrbManager;
