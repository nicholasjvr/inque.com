// Expose ORB_DEBUG globally for console access
window.ORB_DEBUG = {
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
      enableSounds: true,
      useThreeJS: true, // try WebGL sphere when available
      threeJsCdn: "https://unpkg.com/three@0.160.0/build/three.module.js",
      ...options,
    };

    this.container = null;
    this.orb = null;
    this.isInitialized = false;
    this.chatDock = null;
    this.activeTab = "dms";
    this.chatBadges = { dms: 0, ai: 0, space: 0 };

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

      // Debug log for mobile positioning
      if (window.innerWidth <= 768) {
        ORB_DEBUG.log(
          "Mobile layout detected - orb positioned in center-right area"
        );
      }

      // Demo features for testing
      if (this.options.debugMode) {
        this.addDemoFeatures();
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

    // Create scroll-based horizontal line
    this.scrollLine = document.createElement("div");
    this.scrollLine.className = "orb-scroll-line";

    // Initialize scroll state [[memory:4664284]]
    this.scrollState = {
      currentRotation: 0,
      targetRotation: 0,
      lockPoints: [0, 60, 120, 180, 240, 300], // 6 lock points for 6 nav items
      isLocked: false,
      sensitivity: 0.5,
    };

    ORB_DEBUG.log("Orb scroll system initialized with lock points");

    // Create the orb (CSS fallback)
    this.orb = document.createElement("div");
    this.orb.className = "floating-orb";
    this.orb.title = "Chat Center - Click to expand";

    // Create orbiting nav container
    this.navContainer = document.createElement("div");
    this.navContainer.className = "orb-nav-container rotating";

    // One-time helper tooltip
    this.tooltip = document.createElement("div");
    this.tooltip.className = "orb-usage-tooltip";
    this.tooltip.setAttribute("role", "status");
    this.tooltip.setAttribute("aria-live", "polite");
    this.tooltip.textContent = "Scroll or drag to rotate • Release to snap";

    // Assemble the structure
    // Layering: scroll line (z:0), nav (z:1), orb (z:2)
    this.stage.appendChild(this.scrollLine);
    this.stage.appendChild(this.navContainer);
    this.stage.appendChild(this.orb);
    this.container.appendChild(this.stage);
    this.container.appendChild(this.tooltip);

    // Add to DOM (desktop default)
    document.body.appendChild(this.container);

    // Create dimmer overlay (one-time)
    this.dimmer = document.createElement("div");
    this.dimmer.className = "chat-dimmer-overlay";
    this.dimmer.addEventListener("click", () => this.closeChatDock());
    document.body.appendChild(this.dimmer);

    ORB_DEBUG.log("Orb DOM structure created");

    // Docking behavior based on viewport
    this.updateDockingPosition();
    window.addEventListener("resize", () => this.updateDockingPosition(), {
      passive: true,
    });

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

    // Build initial nav after DOM create
    this.buildOrbNavigation();
    this.startRingOrbit();
    this.setupScrollSystem();
    this.createChatDock();
    this.createInputBar();

    // Show tooltip briefly for first-time users
    try {
      const seen = localStorage.getItem("orb_tooltip_seen");
      if (!seen) {
        this.showToolTip();
        localStorage.setItem("orb_tooltip_seen", "1");
      }
    } catch {}
  }

  showToolTip() {
    if (!this.tooltip) return;
    this.tooltip.classList.add("show");
    clearTimeout(this._tooltipTimer);
    this._tooltipTimer = setTimeout(() => {
      this.tooltip && this.tooltip.classList.remove("show");
    }, 3200);
  }

  updateDockingPosition() {
    const titleContainer =
      document.getElementById("title-container") ||
      document.querySelector(".title-main-container");
    const subtitleElement = document.getElementById("home-subtitle");

    // Prefer inline placement between title and subtitle on all viewports
    if (titleContainer) {
      // Ensure the container is a child of the title block
      if (this.container.parentElement !== titleContainer) {
        // If subtitle exists, insert before it to sit between title and subtitle
        if (subtitleElement && titleContainer.contains(subtitleElement)) {
          titleContainer.insertBefore(this.container, subtitleElement);
        } else {
          // Fallback: append after the title block
          titleContainer.appendChild(this.container);
        }
        ORB_DEBUG.log("Orb docked inline under title container");
      }

      // Apply inline style class (static, not sticky)
      this.container.classList.add("inline-under-title");
      this.container.classList.remove("mobile-under-title");

      // Clear any fixed positioning styles from previous modes
      this.container.style.top = "";
      this.container.style.left = "";
      this.container.style.transform = "";
    } else {
      // Fallback: ensure still visible in the document flow
      if (this.container.parentElement !== document.body) {
        document.body.appendChild(this.container);
      }
      this.container.classList.remove("inline-under-title");
      this.container.classList.remove("mobile-under-title");
    }
  }

  buildOrbNavigation() {
    try {
      const items = [
        {
          id: "nav-home",
          icon: "🏠",
          title: "Home",
          onClick: () => this.navigateToSection("home-section"),
        },
        {
          id: "nav-guides",
          icon: "📚",
          title: "Guides",
          onClick: () => this.navigateToSection("guides-section"),
        },
        {
          id: "nav-showcase",
          icon: "🏆",
          title: "Showcase",
          onClick: () => this.navigateToSection("showcase-section"),
        },
        {
          id: "nav-tools",
          icon: "🛠️",
          title: "Tools",
          onClick: () => this.navigateToSection("tools-section"),
        },
        {
          id: "nav-projects",
          icon: "🚀",
          title: "Projects",
          onClick: () => this.navigateToSection("projects-section"),
        },
        {
          id: "nav-chat",
          icon: "💬",
          title: "Chatbot",
          onClick: () => this.toggleChatDock(),
          badge: 0, // Will be updated dynamically
        },
      ];

      this.navContainer.innerHTML = "";

      const angleStep = 360 / items.length;
      items.forEach((item, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "orb-nav-item";
        btn.setAttribute("title", item.title);
        btn.style.setProperty("--angle", `${idx * angleStep}deg`);
        btn.innerText = item.icon;

        // Add badge if specified
        if (item.badge !== undefined) {
          btn.setAttribute("data-badge", item.badge);
          this.updateNavBadge(item.id, item.badge);
        }

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          item.onClick?.();
        });
        this.navContainer.appendChild(btn);
      });

      ORB_DEBUG.log("Orb navigation constructed", { count: items.length });
    } catch (err) {
      ORB_DEBUG.warn("Failed to build orb navigation", err);
    }
  }

  navigateToSection(sectionId) {
    try {
      const el = document.getElementById(sectionId);
      if (!el) return;
      // Show target section (others may be hidden by app logic)
      el.style.display = "block";
      const drawer = document.getElementById("mobileDrawer");
      if (drawer?.classList?.contains("active"))
        drawer.classList.remove("active");
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      ORB_DEBUG.log("Navigated to section via orb", { sectionId });
    } catch {}
  }

  startRingOrbit() {
    // Saturn-like horizontal ring animation driven by scroll interaction
    try {
      const items = Array.from(this.navContainer?.children || []);
      if (!items.length) return;

      const TWO_PI = Math.PI * 2;

      const animate = () => {
        // Use scroll-controlled rotation instead of time-based
        const scrollRotationRad =
          (this.scrollState.currentRotation * Math.PI) / 180;

        const rect = this.navContainer.getBoundingClientRect();
        const radius = (rect.width || 180) / 2.3; // a touch tighter
        const tilt = 0.3; // slightly flatter ring

        items.forEach((el, idx) => {
          const baseAngle = (TWO_PI * idx) / items.length;
          const angle = baseAngle + scrollRotationRad;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius * tilt;

          // mark front/back for z-index accessibility
          const front = Math.cos(angle) > 0; // front half
          if (front) {
            el.classList.add("in-front");
          } else {
            el.classList.remove("in-front");
          }
          el.style.setProperty("--x", `${x}px`);
          el.style.setProperty("--y", `${y}px`);
        });

        this._ringFrame = requestAnimationFrame(animate);
      };

      if (this._ringFrame) cancelAnimationFrame(this._ringFrame);
      this._ringFrame = requestAnimationFrame(animate);
      ORB_DEBUG.log("Saturn ring orbit started with scroll control");

      // Recompute on resize
      window.addEventListener(
        "resize",
        () => {
          if (this._ringFrame) {
            cancelAnimationFrame(this._ringFrame);
            this._ringFrame = null;
          }
          this.startRingOrbit();
        },
        { passive: true }
      );
    } catch (err) {
      ORB_DEBUG.warn("Failed to start ring orbit", err);
    }
  }

  setupScrollSystem() {
    try {
      let scrollTimeout;
      let isDragging = false;
      let lastScrollTime = 0;

      ORB_DEBUG.log("Setting up orb scroll system with lock points");

      // Smooth scroll animation loop
      const updateScrollAnimation = () => {
        const diff =
          this.scrollState.targetRotation - this.scrollState.currentRotation;
        if (Math.abs(diff) > 0.1) {
          this.scrollState.currentRotation += diff * 0.15; // Smooth easing

          // Update the scroll line rotation
          this.scrollLine.style.setProperty(
            "--scroll-rotation",
            `${this.scrollState.currentRotation}deg`
          );

          requestAnimationFrame(updateScrollAnimation);
        }
      };

      // Handle scroll events on the orb container
      const handleScroll = (deltaY) => {
        const now = Date.now();
        if (now - lastScrollTime < 16) return; // Throttle to ~60fps
        lastScrollTime = now;

        // Update target rotation based on scroll
        this.scrollState.targetRotation +=
          deltaY * this.scrollState.sensitivity;

        // Clear existing timeout
        clearTimeout(scrollTimeout);

        // Start smooth animation if not already running
        updateScrollAnimation();

        // Set up lock point snapping after scroll ends
        scrollTimeout = setTimeout(() => {
          this.snapToNearestLockPoint();
        }, 150);
      };

      // Add wheel event listener
      this.container.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          handleScroll(e.deltaY);
          this.scrollLine.style.opacity = "1";

          clearTimeout(this._scrollLineTimeout);
          this._scrollLineTimeout = setTimeout(() => {
            this.scrollLine.style.opacity = "0.3";
          }, 2000);
        },
        { passive: false }
      );

      // Add touch/drag support for mobile
      let startY = 0;
      let startRotation = 0;

      this.container.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches.length === 1) {
            isDragging = true;
            startY = e.touches[0].clientY;
            startRotation = this.scrollState.currentRotation;
            this.scrollLine.style.opacity = "1";
          }
        },
        { passive: true }
      );

      this.container.addEventListener(
        "touchmove",
        (e) => {
          if (isDragging && e.touches.length === 1) {
            e.preventDefault();
            const deltaY = (startY - e.touches[0].clientY) * 2; // Increase sensitivity for touch
            this.scrollState.targetRotation = startRotation + deltaY;
            updateScrollAnimation();
          }
        },
        { passive: false }
      );

      this.container.addEventListener(
        "touchend",
        () => {
          if (isDragging) {
            isDragging = false;
            setTimeout(() => this.snapToNearestLockPoint(), 100);

            setTimeout(() => {
              this.scrollLine.style.opacity = "0.3";
            }, 1500);
          }
        },
        { passive: true }
      );

      // Initialize scroll line opacity
      this.scrollLine.style.opacity = "0.3";

      ORB_DEBUG.log(
        "Scroll system initialized with lock points:",
        this.scrollState.lockPoints
      );
    } catch (err) {
      ORB_DEBUG.warn("Failed to setup scroll system", err);
    }
  }

  snapToNearestLockPoint() {
    try {
      // Normalize current rotation to 0-360 range
      let normalizedRotation = this.scrollState.targetRotation % 360;
      if (normalizedRotation < 0) normalizedRotation += 360;

      // Find nearest lock point
      let nearestLockPoint = this.scrollState.lockPoints[0];
      let minDistance = Math.abs(normalizedRotation - nearestLockPoint);

      for (const lockPoint of this.scrollState.lockPoints) {
        const distance = Math.min(
          Math.abs(normalizedRotation - lockPoint),
          Math.abs(normalizedRotation - lockPoint - 360),
          Math.abs(normalizedRotation - lockPoint + 360)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestLockPoint = lockPoint;
        }
      }

      // Snap to the nearest lock point with smooth animation
      const targetRotation =
        Math.floor(this.scrollState.targetRotation / 360) * 360 +
        nearestLockPoint;
      this.scrollState.targetRotation = targetRotation;
      this.scrollState.isLocked = true;

      // Add haptic-like visual feedback
      if (this.container) {
        this.container.classList.add("lock-snap");
        setTimeout(() => {
          this.container && this.container.classList.remove("lock-snap");
        }, 200);
      }

      ORB_DEBUG.log("Snapped to lock point:", nearestLockPoint);
    } catch (err) {
      ORB_DEBUG.warn("Failed to snap to lock point", err);
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
    // Orb click handler - now opens chat dock
    this.orb.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleChatDock();
      ORB_DEBUG.log("Orb clicked - toggling chat dock");
    });

    // Keyboard accessibility
    this.orb.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggleChatDock();
      }
    });

    // Add tab index for accessibility
    this.orb.setAttribute("tabindex", "0");
    this.orb.setAttribute("role", "button");
    this.orb.setAttribute("aria-label", "Chat Center");

    ORB_DEBUG.log("Event listeners set up");
  }

  adjustSidebarSpacing() {
    // Intentionally no-op: orb floats without shifting layout
    ORB_DEBUG.log("Orb floating mode - no layout adjustments needed");
  }

  // Utility Methods
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Chat Dock Methods
  createChatDock() {
    try {
      this.chatDock = document.createElement("div");
      this.chatDock.className = "chat-dock";
      this.chatDock.innerHTML = `
        <div class="dock-tabs">
          <button class="dock-tab active" data-tab="dms">DMs</button>
          <button class="dock-tab" data-tab="ai">AI</button>
          <button class="dock-tab" data-tab="space">Space</button>
        </div>
        <div class="dock-body">
          <div class="dock-list">
            <div class="dock-list-header">
              <button class="new-message-btn" title="Start new conversation">
                <span class="btn-icon">✉️</span>
                <span class="btn-text">New Message</span>
              </button>
            </div>
            <div class="dock-conversations" id="dock-conversations">
              <div class="conversation-item active" data-conversation="general">
                <div class="conversation-avatar">👥</div>
                <div class="conversation-info">
                  <div class="conversation-name">General</div>
                  <div class="conversation-preview">Welcome to the community!</div>
                </div>
                <div class="conversation-time">now</div>
              </div>
            </div>
          </div>
          <div class="dock-thread">
            <div class="thread-header">
              <div class="thread-title">General Chat</div>
              <div class="thread-status">🟢 Online</div>
            </div>
            <div class="thread-messages" id="thread-messages">
              <div class="dock-msg me">Hello there!</div>
              <div class="dock-msg bot">Hi! How can I help you today?</div>
            </div>
            <div class="dock-input-container" id="dock-input-slot"></div>
          </div>
        </div>
      `;

      this.container.appendChild(this.chatDock);

      // Set up tab switching
      this.chatDock.querySelectorAll(".dock-tab").forEach((tab) => {
        tab.addEventListener("click", (e) => {
          this.switchTab(e.target.dataset.tab);
        });
      });

      // Set up new message button
      const newMessageBtn = this.chatDock.querySelector(".new-message-btn");
      if (newMessageBtn) {
        newMessageBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.showNewMessageModal();
        });
      }

      // Set up conversation switching
      this.chatDock.querySelectorAll(".conversation-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.switchConversation(item.dataset.conversation);
        });
      });

      // Add hover effects and visual feedback
      this.addInteractiveStyles();

      // Input is embedded dynamically; handlers live on the external input bar

      // Close dock when clicking outside
      document.addEventListener("click", (e) => {
        if (
          !this.chatDock.contains(e.target) &&
          !(this.inputBar && this.inputBar.contains(e.target))
        ) {
          this.closeChatDock();
        }
      });

      ORB_DEBUG.log("Chat dock created successfully");
    } catch (err) {
      ORB_DEBUG.warn("Failed to create chat dock", err);
    }
  }

  createInputBar() {
    try {
      this.inputBar = document.createElement("div");
      this.inputBar.className = "orb-input-wrap";
      this.inputBar.innerHTML = `
        <div class="orb-input">
          <input type="text" placeholder="Send a DM...">
          <button class="send-btn">Send</button>
        </div>
      `;

      this.container.appendChild(this.inputBar);

      // Set up universal input handling
      const input = this.inputBar.querySelector("input");
      const sendBtn = this.inputBar.querySelector(".send-btn");

      const sendMessage = () => {
        const message = input.value.trim();
        if (message) {
          this.sendMessageToActiveTab(message);
          input.value = "";
          // Open chat dock to show the message
          this.openChatDock();
          if (/Mobi|Android/i.test(navigator.userAgent)) {
            setTimeout(() => input.blur(), 50);
          }
        }
      };

      // Send button functionality
      sendBtn.addEventListener("click", sendMessage);

      // Enter key functionality
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          sendMessage();
        }
      });

      // Click input to open chat dock (no toggle to prevent flicker)
      input.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.chatDock.classList.contains("open")) {
          this.openChatDock();
        }
        ORB_DEBUG.log("Input clicked - opening chat dock");
      });

      // Focus input to open chat dock (but don't toggle)
      input.addEventListener("focus", () => {
        if (!this.chatDock.classList.contains("open")) {
          this.openChatDock();
        }
        ORB_DEBUG.log("Input focused - opening chat dock");
      });

      ORB_DEBUG.log("Input bar created successfully");
    } catch (err) {
      ORB_DEBUG.warn("Failed to create input bar", err);
    }
  }

  toggleChatDock() {
    if (!this.chatDock) return;

    const isOpen = this.chatDock.classList.contains("open");

    if (isOpen) {
      this.closeChatDock();
    } else {
      this.openChatDock();
    }

    ORB_DEBUG.log("Chat dock toggled", {
      isOpen: !isOpen,
    });
  }

  openChatDock() {
    if (!this.chatDock) return;

    // Store current scroll position and lock background scroll
    this.scrollPosition = window.pageYOffset;
    document.body.style.position = "fixed";
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    // Pause 3D tilt so it doesn't override positioning
    if (window.orb3dPauseTilt) window.orb3dPauseTilt();

    // Open dock and UI affordances first so sizes are correct
    this.chatDock.classList.add("open");
    document.body.classList.add("chat-dock-open");
    this.inputBar.classList.add("dock-triggered");
    this.updateInputBarPlaceholder();

    // Compute initial positions after opening to avoid 0-size measurements
    const setPositions = () => this._centerDockAndOrb();
    setPositions();

    // Move the external input bar into the dock's slot
    try {
      const slot = this.chatDock.querySelector("#dock-input-slot");
      if (slot && this.inputBar) {
        this.inputBar.classList.add("inside-dock");
        if (this.inputBar.parentElement !== slot) {
          slot.appendChild(this.inputBar);
        }
      }
    } catch (err) {
      console.error("[ORB DEBUG] Error moving input to dock:", err);
    }

    // Dim overlay + enhanced glow (visuals only)
    document.body.classList.add("dim-overlay");
    this.orb.classList.add("orb-chat-active");

    // Bind viewport handlers to keep dock/orb visible above mobile keyboard
    this._bindViewportHandlers();

    // Final nudges after layout settles
    requestAnimationFrame(() => setPositions());
    setTimeout(() => setPositions(), 60);

    ORB_DEBUG.log("Chat dock opened smoothly");
  }

  closeChatDock() {
    if (!this.chatDock) return;

    this.chatDock.classList.remove("open");

    // Remove body class to restore normal layout
    document.body.classList.remove("chat-dock-open");

    // Restore scroll position and unlock scroll
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";

    if (this.scrollPosition !== undefined) {
      window.scrollTo(0, this.scrollPosition);
    }

    // Remove visual feedback from input bar
    this.inputBar.classList.remove("dock-triggered");

    // Remove dim overlay and reset orb glow
    document.body.classList.remove("dim-overlay");
    this.orb.classList.remove("orb-chat-active");

    // Reset orb position
    this.orb.style.top = "";
    this.orb.style.left = "";
    this.orb.style.transform = "";
    this.orb.style.position = "";

    // Return the input bar to body (under the orb wrapper)
    try {
      if (this.inputBar) this.inputBar.classList.remove("inside-dock");
      if (
        this.container &&
        this.inputBar &&
        this.inputBar.parentElement !== this.container
      ) {
        this.container.appendChild(this.inputBar);
      }
    } catch {}

    // Unbind viewport handlers and resume tilt
    this._unbindViewportHandlers();
    if (window.orb3dResumeTilt) window.orb3dResumeTilt();

    ORB_DEBUG.log("Chat dock closed smoothly");
  }

  _bindViewportHandlers() {
    if (!window.visualViewport) return;
    this._vvHandler = () => this._centerDockAndOrb();
    window.visualViewport.addEventListener("resize", this._vvHandler);
    window.visualViewport.addEventListener("scroll", this._vvHandler);
  }

  _unbindViewportHandlers() {
    if (!window.visualViewport || !this._vvHandler) return;
    window.visualViewport.removeEventListener("resize", this._vvHandler);
    window.visualViewport.removeEventListener("scroll", this._vvHandler);
    this._vvHandler = null;
  }

  _centerDockAndOrb() {
    try {
      if (!this.chatDock || !this.orb) return;
      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      const vx = vv ? vv.offsetLeft : 0;
      const vy = vv ? vv.offsetTop : 0;

      // Measure dock size
      const rect = this.chatDock.getBoundingClientRect();
      const w = rect.width || this.chatDock.offsetWidth || 520;
      const h = rect.height || this.chatDock.offsetHeight || 520;

      const left = vx + (vw - w) / 2;
      const top = vy + (vh - h) / 2;

      this.chatDock.style.left = `${Math.max(0, left)}px`;
      this.chatDock.style.top = `${Math.max(0, top)}px`;
      this.chatDock.style.transform = "none"; // ensure no matrix() remains

      // Orb above dock
      const orbH = this.orb.getBoundingClientRect().height || 80;
      const orbCenterX = left + w / 2;
      const orbTop = Math.max(12, top - orbH - 16);
      this.orb.style.position = "fixed";
      this.orb.style.left = `${orbCenterX}px`;
      this.orb.style.top = `${orbTop}px`;
      this.orb.style.transform = "translate(-50%, 0)";
    } catch {}
  }

  updateInputBarPlaceholder() {
    if (!this.inputBar) return;

    const input = this.inputBar.querySelector("input");
    const placeholders = {
      dms: "Send a DM...",
      ai: "Ask AI anything...",
      space: "Post to Space...",
    };
    input.placeholder = placeholders[this.activeTab] || "Type a message...";
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    this.chatDock.querySelectorAll(".dock-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    // Update chat content based on tab
    this.updateChatContent(tabName);

    // Update universal input placeholder
    this.updateInputBarPlaceholder();

    ORB_DEBUG.log("Switched to tab", { tabName });
  }

  updateChatContent(tabName) {
    const conversationsList = this.chatDock.querySelector(
      "#dock-conversations"
    );
    const threadTitle = this.chatDock.querySelector(".thread-title");
    const threadMessages = this.chatDock.querySelector("#thread-messages");

    if (!conversationsList || !threadTitle || !threadMessages) return;

    switch (tabName) {
      case "dms":
        this.updateDMsContent(conversationsList, threadTitle, threadMessages);
        break;
      case "ai":
        this.updateAIContent(conversationsList, threadTitle, threadMessages);
        break;
      case "space":
        this.updateSpaceContent(conversationsList, threadTitle, threadMessages);
        break;
    }
  }

  updateDMsContent(conversationsList, threadTitle, threadMessages) {
    // DM conversations
    conversationsList.innerHTML = `
      <div class="conversation-item active" data-conversation="general">
        <div class="conversation-avatar">👥</div>
        <div class="conversation-info">
          <div class="conversation-name">General</div>
          <div class="conversation-preview">Welcome to the community!</div>
        </div>
        <div class="conversation-time">now</div>
      </div>
    `;

    threadTitle.textContent = "General Chat";
    threadMessages.innerHTML = `
      <div class="dock-msg user">Hello there!</div>
      <div class="dock-msg bot">Hi! How can I help you today?</div>
    `;

    // Re-attach event listeners
    this.attachConversationListeners();
  }

  updateAIContent(conversationsList, threadTitle, threadMessages) {
    // AI Assistant conversations
    conversationsList.innerHTML = `
      <div class="conversation-item active" data-conversation="ai-assistant">
        <div class="conversation-avatar">🤖</div>
        <div class="conversation-info">
          <div class="conversation-name">AI Assistant</div>
          <div class="conversation-preview">Ready to help with your projects!</div>
        </div>
        <div class="conversation-time">online</div>
      </div>
    `;

    threadTitle.textContent = "AI Assistant";
    threadMessages.innerHTML = `
      <div class="dock-msg ai">Hi! I'm your AI assistant integrated into your ProfileHub. How can I help you navigate or customize your experience?</div>
    `;

    // Re-attach event listeners
    this.attachConversationListeners();
  }

  updateSpaceContent(conversationsList, threadTitle, threadMessages) {
    // Space/Group chat
    conversationsList.innerHTML = `
      <div class="conversation-item active" data-conversation="space-chat">
        <div class="conversation-avatar">🌌</div>
        <div class="conversation-info">
          <div class="conversation-name">Space Chat</div>
          <div class="conversation-preview">Community group chat - mark your visit!</div>
        </div>
        <div class="conversation-time">live</div>
      </div>
    `;

    threadTitle.textContent = "Space Chat";
    threadMessages.innerHTML = `
      <div class="dock-msg system">Welcome to Space Chat! Send a message to mark your visit.</div>
      <div class="dock-msg user">👋 Just dropped by!</div>
      <div class="dock-msg user">🚀 Building something cool today</div>
      <div class="dock-msg user">💡 Working on a new project</div>
    `;

    // Re-attach event listeners
    this.attachConversationListeners();
  }

  attachConversationListeners() {
    this.chatDock.querySelectorAll(".conversation-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.switchConversation(item.dataset.conversation);
      });
    });
  }

  addInteractiveStyles() {
    // Add CSS for interactive elements if not already present
    const styleId = "orb-interactive-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      /* Enhanced interactive styles for chat dock */
      .dock-tab {
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        user-select: none !important;
      }
      
      .dock-tab:hover {
        background: rgba(0, 240, 255, 0.1) !important;
        transform: translateY(-1px) !important;
      }
      
      .dock-tab.active {
        background: rgba(0, 240, 255, 0.2) !important;
        color: var(--primary-neon) !important;
        box-shadow: 0 0 10px rgba(0, 240, 255, 0.3) !important;
      }
      
      .conversation-item {
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        user-select: none !important;
      }
      
      .conversation-item:hover {
        background: rgba(255, 255, 255, 0.05) !important;
        transform: translateX(2px) !important;
      }
      
      .conversation-item.active {
        background: rgba(0, 240, 255, 0.1) !important;
        border-left: 2px solid var(--primary-neon) !important;
      }
      
      .new-message-btn {
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        user-select: none !important;
      }
      
      .new-message-btn:hover {
        background: rgba(0, 240, 255, 0.1) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(0, 240, 255, 0.2) !important;
      }
      
      .new-message-btn:active {
        transform: translateY(0) !important;
      }
      
      /* Make sure all interactive elements are clickable */
      .dock-tab, .conversation-item, .new-message-btn {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);

    ORB_DEBUG.log("Interactive styles added to chat dock");
  }

  sendMessageToActiveTab(message) {
    ORB_DEBUG.log("Sending message to active tab", {
      tab: this.activeTab,
      message,
    });

    // Add message to dock thread
    if (this.chatDock) {
      const thread = this.chatDock.querySelector("#thread-messages");
      const msgEl = document.createElement("div");
      msgEl.className = "dock-msg user";
      msgEl.textContent = message;
      thread.appendChild(msgEl);
      thread.scrollTop = thread.scrollHeight;
    }

    // Handle different tab types
    switch (this.activeTab) {
      case "dms":
        this.handleDMMessage(message);
        break;
      case "ai":
        this.handleAIMessage(message);
        break;
      case "space":
        this.handleSpaceMessage(message);
        break;
    }
  }

  handleSpaceMessage(message) {
    // For Space chat, add a "visit marked" system message
    setTimeout(() => {
      const threadMessages = this.chatDock.querySelector("#thread-messages");
      if (threadMessages) {
        const visitEl = document.createElement("div");
        visitEl.className = "dock-msg system";
        visitEl.textContent = `📍 Visit marked: ${new Date().toLocaleTimeString()}`;
        threadMessages.appendChild(visitEl);
        threadMessages.scrollTop = threadMessages.scrollHeight;
      }
    }, 1000);
  }

  handleAIMessage(message) {
    // For AI chat, simulate AI response
    setTimeout(() => {
      const threadMessages = this.chatDock.querySelector("#thread-messages");
      if (threadMessages) {
        const aiEl = document.createElement("div");
        aiEl.className = "dock-msg ai";
        aiEl.textContent =
          "I'm here to help! How can I assist you with your projects today?";
        threadMessages.appendChild(aiEl);
        threadMessages.scrollTop = threadMessages.scrollHeight;
      }
    }, 1500);
  }

  handleDMMessage(message) {
    // For DM chat, simulate bot response
    setTimeout(() => {
      const threadMessages = this.chatDock.querySelector("#thread-messages");
      if (threadMessages) {
        const botEl = document.createElement("div");
        botEl.className = "dock-msg bot";
        botEl.textContent =
          "Thanks for your message! I'll get back to you soon.";
        threadMessages.appendChild(botEl);
        threadMessages.scrollTop = threadMessages.scrollHeight;
      }
    }, 1200);
  }

  async showNewMessageModal() {
    ORB_DEBUG.log("Showing new message modal");

    try {
      // Fetch followers from the users system
      const followers = await this.fetchFollowers();

      const modal = document.createElement("div");
      modal.className = "new-message-modal";
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>✉️ New Message</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="recipient-section">
              <label>To:</label>
              <div class="recipient-list" id="recipient-list">
                ${followers.length > 0 ? this.renderFollowersList(followers) : this.renderNoFollowersMessage()}
              </div>
            </div>
            <div class="message-section">
              <textarea id="new-message-text" placeholder="Type your message..." rows="4"></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button class="send-new-message-btn">Send Message</button>
            <button class="cancel-new-message-btn">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      modal.style.display = "flex";

      // Event listeners
      const closeBtn = modal.querySelector(".modal-close");
      const cancelBtn = modal.querySelector(".cancel-new-message-btn");
      const sendBtn = modal.querySelector(".send-new-message-btn");
      const messageText = modal.querySelector("#new-message-text");

      const closeModal = () => {
        document.body.removeChild(modal);
      };

      closeBtn.addEventListener("click", closeModal);
      cancelBtn.addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });

      sendBtn.addEventListener("click", () => {
        const message = messageText.value.trim();
        if (!message) {
          this.showNotification("Please enter a message", "warning");
          return;
        }

        // Get selected recipient
        const selectedRecipient = modal.querySelector(
          ".recipient-item.selected"
        );
        if (!selectedRecipient) {
          this.showNotification("Please select a recipient", "warning");
          return;
        }

        const recipientId = selectedRecipient.dataset.userId;
        const recipientName = selectedRecipient.dataset.userName;

        this.sendNewMessage(recipientId, recipientName, message);
        closeModal();
      });

      // Set up recipient selection
      modal.querySelectorAll(".recipient-item").forEach((item) => {
        item.addEventListener("click", () => {
          // Remove previous selection
          modal
            .querySelectorAll(".recipient-item")
            .forEach((i) => i.classList.remove("selected"));
          // Add selection to clicked item
          item.classList.add("selected");
        });
      });

      // Focus on textarea
      setTimeout(() => messageText.focus(), 100);
    } catch (error) {
      ORB_DEBUG.error("Failed to show new message modal", error);
      this.showNotification("Failed to load followers", "error");
    }
  }

  async fetchFollowers() {
    try {
      // Import the users functionality
      const { auth, db } = await import("../../core/firebase-core.js");
      const { doc, getDoc } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      if (!auth.currentUser) {
        return [];
      }

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.following || [];
      }

      return [];
    } catch (error) {
      ORB_DEBUG.error("Failed to fetch followers", error);
      return [];
    }
  }

  renderFollowersList(followers) {
    return followers
      .map(
        (followerId) => `
      <div class="recipient-item" data-user-id="${followerId}" data-user-name="User ${followerId.slice(0, 8)}">
        <div class="recipient-avatar">👤</div>
        <div class="recipient-name">User ${followerId.slice(0, 8)}</div>
        <div class="recipient-status">🟢</div>
      </div>
    `
      )
      .join("");
  }

  renderNoFollowersMessage() {
    return `
      <div class="no-followers">
        <div class="no-followers-icon">👥</div>
        <div class="no-followers-text">No followers yet</div>
        <a href="/pages/users.html" class="explore-link">Find friends on Explore page</a>
      </div>
    `;
  }

  sendNewMessage(recipientId, recipientName, message) {
    ORB_DEBUG.log("Sending new message", {
      recipientId,
      recipientName,
      message,
    });

    // Add to conversations list
    this.addConversationToList(recipientId, recipientName, message);

    // Show success notification
    this.showNotification(`Message sent to ${recipientName}!`, "success");

    // Here you would integrate with your actual messaging system
  }

  addConversationToList(userId, userName, lastMessage) {
    const conversationsContainer = this.chatDock.querySelector(
      "#dock-conversations"
    );
    if (!conversationsContainer) return;

    const conversationEl = document.createElement("div");
    conversationEl.className = "conversation-item";
    conversationEl.dataset.conversation = userId;
    conversationEl.innerHTML = `
      <div class="conversation-avatar">👤</div>
      <div class="conversation-info">
        <div class="conversation-name">${userName}</div>
        <div class="conversation-preview">${lastMessage}</div>
      </div>
      <div class="conversation-time">now</div>
    `;

    // Add click handler
    conversationEl.addEventListener("click", () => {
      this.switchConversation(userId);
    });

    // Insert at the top
    conversationsContainer.insertBefore(
      conversationEl,
      conversationsContainer.firstChild
    );
  }

  switchConversation(conversationId) {
    ORB_DEBUG.log("Switching conversation", { conversationId });

    // Update active conversation
    this.chatDock.querySelectorAll(".conversation-item").forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.conversation === conversationId
      );
    });

    // Re-attach event listeners to new conversation items
    this.chatDock.querySelectorAll(".conversation-item").forEach((item) => {
      // Remove existing listeners to prevent duplicates
      item.replaceWith(item.cloneNode(true));
    });

    // Re-attach event listeners
    this.chatDock.querySelectorAll(".conversation-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.switchConversation(item.dataset.conversation);
      });
    });

    // Update thread header and messages
    const threadTitle = this.chatDock.querySelector(".thread-title");
    const threadMessages = this.chatDock.querySelector("#thread-messages");

    if (conversationId === "general") {
      threadTitle.textContent = "General Chat";
      threadMessages.innerHTML = `
        <div class="dock-msg me">Hello there!</div>
        <div class="dock-msg bot">Hi! How can I help you today?</div>
      `;
    } else {
      threadTitle.textContent = `Chat with User ${conversationId.slice(0, 8)}`;
      threadMessages.innerHTML = `
        <div class="dock-msg me">Started conversation</div>
        <div class="dock-msg bot">Hello! How can I help you?</div>
      `;
    }
  }

  showNotification(message, type = "info") {
    ORB_DEBUG.log("Showing notification", { message, type });

    const notification = document.createElement("div");
    notification.className = `orb-notification orb-notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.add("show");
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  updateNavBadge(navId, count) {
    const navItem = this.navContainer.querySelector(`[data-badge]`);
    if (navItem) {
      navItem.setAttribute("data-badge", count);
      navItem.style.display = count > 0 ? "block" : "none";
    }
  }

  updateChatBadges(badges) {
    this.chatBadges = { ...this.chatBadges, ...badges };

    // Update the chat nav item badge
    const totalBadges = Object.values(this.chatBadges).reduce(
      (sum, count) => sum + count,
      0
    );
    this.updateNavBadge("nav-chat", totalBadges);

    ORB_DEBUG.log("Chat badges updated", {
      badges: this.chatBadges,
      total: totalBadges,
    });
  }

  // Star Notifications Methods
  createStarNotification(message, type = "info") {
    try {
      const starLayer =
        this.container.querySelector(".orb-star-layer") ||
        this.createStarLayer();

      const star = document.createElement("div");
      star.className = "orb-star";
      star.innerHTML = "⭐";
      star.title = message;

      // Position randomly on orbit
      const angle = Math.random() * 360;
      const radius = this.getOrbitRadius();
      const x = Math.cos((angle * Math.PI) / 180) * radius;
      const y = Math.sin((angle * Math.PI) / 180) * radius * 0.3; // Flatten the orbit

      star.style.setProperty("--x", `${x}px`);
      star.style.setProperty("--y", `${y}px`);

      starLayer.appendChild(star);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (star.parentNode) {
          star.parentNode.removeChild(star);
        }
      }, 5000);

      ORB_DEBUG.log("Star notification created", { message, type });
    } catch (err) {
      ORB_DEBUG.warn("Failed to create star notification", err);
    }
  }

  createStarLayer() {
    const starLayer = document.createElement("div");
    starLayer.className = "orb-star-layer";
    this.container.appendChild(starLayer);
    return starLayer;
  }

  getOrbitRadius() {
    return (
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--orbit-size"
        )
      ) / 2.25
    );
  }

  // Demo/Testing Methods
  addDemoFeatures() {
    // Add some demo star notifications [[memory:4664284]]
    setTimeout(() => {
      this.createStarNotification("New message from Sarah", "dm");
    }, 2000);

    setTimeout(() => {
      this.createStarNotification("AI response ready", "ai");
    }, 4000);

    setTimeout(() => {
      this.createStarNotification("Space activity detected", "space");
    }, 6000);

    // Add some demo chat badges
    setTimeout(() => {
      this.updateChatBadges({ dms: 2, ai: 1, space: 3 });
    }, 3000);
  }

  // Public API Methods
  clear() {
    // Clear chat badges
    this.updateChatBadges({ dms: 0, ai: 0, space: 0 });
    ORB_DEBUG.log("All chat badges cleared");
  }

  // Public API for external integration
  addChatMessage(tab, message, sender = "bot") {
    if (this.chatDock) {
      const thread = this.chatDock.querySelector(".dock-thread");
      const msgEl = document.createElement("div");
      msgEl.className = `dock-msg ${sender}`;
      msgEl.textContent = message;
      thread.appendChild(msgEl);
      thread.scrollTop = thread.scrollHeight;

      // Update badges if it's a new message
      if (sender !== "me") {
        const currentBadges = { ...this.chatBadges };
        currentBadges[tab] = (currentBadges[tab] || 0) + 1;
        this.updateChatBadges(currentBadges);
      }
    }
  }

  showStarNotification(message, type = "info") {
    this.createStarNotification(message, type);
  }

  updateBadges(badges) {
    this.updateChatBadges(badges);
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    if (this.chatDock && this.chatDock.parentNode) {
      this.chatDock.parentNode.removeChild(this.chatDock);
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
    let paused = false;
    const tick = () => {
      if (paused) {
        requestAnimationFrame(tick);
        return;
      }
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

    // Expose pause/resume so manager can lock orb when dock is open
    window.orb3dPauseTilt = () => {
      paused = true;
      orb.style.transform = "translate(-50%,-50%)"; // clear rotations
    };
    window.orb3dResumeTilt = () => {
      paused = false;
    };
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
    const chatDock = document.querySelector(".chat-dock");
    const inputBar = document.querySelector(".orb-input-wrap");

    console.log("[ORB DEBUG] Status check:", {
      orb: !!orb,
      wrapper: !!wrapper,
      webglLayer: !!webglLayer,
      canvas: !!canvas,
      canvasSize: canvas ? `${canvas.width}x${canvas.height}` : "N/A",
      orbPosition: orb ? getComputedStyle(orb).transform : "N/A",
      threeLoaded: !!window.__orbThree,
      chatDock: !!chatDock,
      inputBar: !!inputBar,
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

  // New debug functions for the enhanced features
  testChatDock: () => {
    if (window.floatingOrb) {
      window.floatingOrb.toggleChatDock();
      console.log("[ORB DEBUG] Chat dock toggled");
    }
  },

  openChatDock: () => {
    if (window.floatingOrb) {
      window.floatingOrb.openChatDock();
      console.log("[ORB DEBUG] Chat dock opened smoothly");
    }
  },

  closeChatDock: () => {
    if (window.floatingOrb) {
      window.floatingOrb.closeChatDock();
      console.log("[ORB DEBUG] Chat dock closed smoothly");
    }
  },

  testInputBar: () => {
    const input = document.querySelector(".orb-input input");
    if (input) {
      input.click();
      console.log("[ORB DEBUG] Input bar clicked - should trigger chat dock");
    }
  },

  testStarNotification: (message = "Test star notification") => {
    if (window.floatingOrb) {
      window.floatingOrb.showStarNotification(message);
      console.log("[ORB DEBUG] Star notification created:", message);
    }
  },

  testChatBadges: () => {
    if (window.floatingOrb) {
      window.floatingOrb.updateBadges({ dms: 3, ai: 1, space: 2 });
      console.log("[ORB DEBUG] Chat badges updated");
    }
  },

  clearAll: () => {
    if (window.floatingOrb) {
      window.floatingOrb.clear();
      console.log("[ORB DEBUG] All chat badges cleared");
    }
  },

  // New debug functions for enhanced chat features
  testNewMessage: () => {
    if (window.floatingOrb) {
      window.floatingOrb.showNewMessageModal();
      console.log("[ORB DEBUG] New message modal opened");
    }
  },

  testNotification: (message = "Test notification", type = "info") => {
    if (window.floatingOrb) {
      window.floatingOrb.showNotification(message, type);
      console.log("[ORB DEBUG] Notification shown:", message);
    }
  },

  testConversationSwitch: (conversationId = "test-user-123") => {
    if (window.floatingOrb) {
      window.floatingOrb.switchConversation(conversationId);
      console.log("[ORB DEBUG] Switched to conversation:", conversationId);
    }
  },

  addTestConversation: () => {
    if (window.floatingOrb) {
      window.floatingOrb.addConversationToList(
        "test-user-456",
        "Test User",
        "This is a test message"
      );
      console.log("[ORB DEBUG] Test conversation added");
    }
  },

  testInputClick: () => {
    const input = document.querySelector(".orb-input input");
    if (input) {
      input.click();
      console.log("[ORB DEBUG] Input clicked - should toggle chat dock");
    } else {
      console.log("[ORB DEBUG] Input not found");
    }
  },

  testInputFocus: () => {
    const input = document.querySelector(".orb-input input");
    if (input) {
      input.focus();
      console.log("[ORB DEBUG] Input focused - should open chat dock");
    } else {
      console.log("[ORB DEBUG] Input not found");
    }
  },

  debugInputVisibility: () => {
    const inputWrap = document.querySelector(".orb-input-wrap");
    const slot = document.querySelector("#dock-input-slot");
    const dockThread = document.querySelector(".dock-thread");

    console.log("[ORB DEBUG] Input visibility check:", {
      inputWrap: {
        element: inputWrap,
        parent: inputWrap?.parentElement,
        classes: inputWrap?.className,
        display: inputWrap ? window.getComputedStyle(inputWrap).display : "N/A",
        visibility: inputWrap
          ? window.getComputedStyle(inputWrap).visibility
          : "N/A",
        height: inputWrap ? window.getComputedStyle(inputWrap).height : "N/A",
        position: inputWrap
          ? window.getComputedStyle(inputWrap).position
          : "N/A",
      },
      slot: {
        element: slot,
        height: slot ? window.getComputedStyle(slot).height : "N/A",
        overflow: slot ? window.getComputedStyle(slot).overflow : "N/A",
        display: slot ? window.getComputedStyle(slot).display : "N/A",
      },
      dockThread: {
        element: dockThread,
        overflow: dockThread
          ? window.getComputedStyle(dockThread).overflow
          : "N/A",
      },
    });
  },

  testChatDockInteractivity: () => {
    const tabs = document.querySelectorAll(".dock-tab");
    const conversations = document.querySelectorAll(".conversation-item");
    const newMessageBtn = document.querySelector(".new-message-btn");

    console.log("[ORB DEBUG] Chat dock interactivity test:", {
      tabs: {
        count: tabs.length,
        elements: Array.from(tabs).map((tab) => ({
          text: tab.textContent,
          classes: tab.className,
          dataset: tab.dataset,
        })),
      },
      conversations: {
        count: conversations.length,
        elements: Array.from(conversations).map((conv) => ({
          text: conv.textContent.trim(),
          classes: conv.className,
          dataset: conv.dataset,
        })),
      },
      newMessageBtn: {
        exists: !!newMessageBtn,
        classes: newMessageBtn?.className,
      },
    });

    // Test clicking tabs
    if (tabs.length > 0) {
      console.log("[ORB DEBUG] Testing tab clicks...");
      tabs.forEach((tab, index) => {
        setTimeout(() => {
          tab.click();
          console.log(
            `[ORB DEBUG] Clicked tab ${index + 1}: ${tab.textContent}`
          );
        }, index * 500);
      });
    }
  },

  testChatDockPosition: () => {
    const chatDock = document.querySelector(".chat-dock");
    if (chatDock) {
      const rect = chatDock.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      console.log("[ORB DEBUG] Chat dock position:", {
        element: chatDock,
        classes: chatDock.className,
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        viewport: viewport,
        isVisible:
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= viewport.height &&
          rect.right <= viewport.width,
        computedStyle: {
          position: window.getComputedStyle(chatDock).position,
          top: window.getComputedStyle(chatDock).top,
          left: window.getComputedStyle(chatDock).left,
          transform: window.getComputedStyle(chatDock).transform,
        },
      });
    } else {
      console.log("[ORB DEBUG] Chat dock not found");
    }
  },

  checkInputStyles: () => {
    const input = document.querySelector(".orb-input input");
    const sendBtn = document.querySelector(".orb-input .send-btn");
    const inputWrap = document.querySelector(".orb-input-wrap");
    const inputContainer = document.querySelector(".orb-input");

    if (input) {
      const computedStyles = window.getComputedStyle(input);
      console.log("[ORB DEBUG] Input computed styles:", {
        background: computedStyles.background,
        border: computedStyles.border,
        color: computedStyles.color,
        fontSize: computedStyles.fontSize,
        padding: computedStyles.padding,
        margin: computedStyles.margin,
        cursor: computedStyles.cursor,
        fontFamily: computedStyles.fontFamily,
      });
    }

    if (sendBtn) {
      const btnStyles = window.getComputedStyle(sendBtn);
      console.log("[ORB DEBUG] Send button styles:", {
        background: btnStyles.background,
        border: btnStyles.border,
        color: btnStyles.color,
        padding: btnStyles.padding,
        fontSize: btnStyles.fontSize,
      });
    }

    if (inputWrap) {
      const wrapStyles = window.getComputedStyle(inputWrap);
      console.log("[ORB DEBUG] Input wrap styles:", {
        position: wrapStyles.position,
        bottom: wrapStyles.bottom,
        left: wrapStyles.left,
        transform: wrapStyles.transform,
        width: wrapStyles.width,
        zIndex: wrapStyles.zIndex,
      });
    }

    console.log("[ORB DEBUG] Elements found:", {
      input: !!input,
      sendBtn: !!sendBtn,
      inputWrap: !!inputWrap,
      inputContainer: !!inputContainer,
    });
  },

  testDockInput: () => {
    const dockInput = document.querySelector("#dock-message-input");
    const dockSendBtn = document.querySelector(".dock-send-btn");

    if (dockInput && dockSendBtn) {
      dockInput.value = "Test message from dock input";
      dockSendBtn.click();
      console.log("[ORB DEBUG] Dock input test - message sent");
    } else {
      console.log("[ORB DEBUG] Dock input elements not found");
    }
  },

  focusDockInput: () => {
    const dockInput = document.querySelector("#dock-message-input");
    if (dockInput) {
      dockInput.focus();
      console.log("[ORB DEBUG] Dock input focused");
    } else {
      console.log("[ORB DEBUG] Dock input not found");
    }
  },
};

// Export for module usage
export default FloatingOrbManager;
