// My Projects Page - Integrated Social Dashboard
import { auth, db } from "../../core/firebase-core.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Debug logging
const DEBUG = {
  log: (message, data = null) => {
    console.log(`[MY PROJECTS] ${message}`, data || "");
  },
  error: (message, error = null) => {
    console.error(`[MY PROJECTS ERROR] ${message}`, error || "");
  },
  warn: (message, data = null) => {
    console.warn(`[MY PROJECTS WARN] ${message}`, data || "");
  },
};

class MyProjectsManager {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.timelineUnsubscribe = null;
    this.widgets = [];

    // DOM elements
    this.domElements = {};

    this.initializeDOMElements();
    this.setupEventListeners();
    this.init();
  }

  initializeDOMElements() {
    this.domElements = {
      // Profile elements
      userAvatar: document.getElementById("userAvatar"),
      userName: document.getElementById("userName"),
      profileAvatar: document.getElementById("profileAvatar"),
      profileName: document.getElementById("profileName"),
      profileBio: document.getElementById("profileBio"),
      widgetsCount: document.getElementById("widgetsCount"),
      followersCount: document.getElementById("followersCount"),
      viewsCount: document.getElementById("viewsCount"),

      // Auth elements
      profileSection: document.getElementById("profileSection"),
      authSection: document.getElementById("authSection"),
      loginForm: document.getElementById("loginForm"),
      loginEmail: document.getElementById("loginEmail"),
      loginPassword: document.getElementById("loginPassword"),
      loginBtn: document.getElementById("loginBtn"),
      signupForm: document.getElementById("signupForm"),
      signupEmail: document.getElementById("signupEmail"),
      signupPassword: document.getElementById("signupPassword"),
      signupDisplayName: document.getElementById("signupDisplayName"),
      signupBtn: document.getElementById("signupBtn"),
      showSignupBtn: document.getElementById("showSignupBtn"),
      showLoginBtn: document.getElementById("showLoginBtn"),
      loginFormContainer: document.getElementById("loginFormContainer"),
      signupFormContainer: document.getElementById("signupFormContainer"),

      // Timeline elements
      timelineSection: document.getElementById("timelineSection"),
      refreshTimelineBtn: document.getElementById("refreshTimelineBtn"),

      // Widgets elements
      widgetsGrid: document.getElementById("widgetsGrid"),

      // Toast container
      toastContainer: document.getElementById("toastContainer"),
    };

    DEBUG.log("DOM elements initialized", Object.keys(this.domElements));
  }

  setupEventListeners() {
    // Auth form
    if (this.domElements.loginForm) {
      this.domElements.loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Signup form
    if (this.domElements.signupForm) {
      this.domElements.signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSignup();
      });
    }

    if (this.domElements.showSignupBtn) {
      this.domElements.showSignupBtn.addEventListener("click", () => {
        this.showSignupForm();
      });
    }

    if (this.domElements.showLoginBtn) {
      this.domElements.showLoginBtn.addEventListener("click", () => {
        this.showLoginForm();
      });
    }

    // Timeline refresh
    if (this.domElements.refreshTimelineBtn) {
      this.domElements.refreshTimelineBtn.addEventListener("click", () => {
        this.refreshTimeline();
      });
    }

    // AI Assistant button
    const aiAssistantBtn = document.getElementById("aiAssistantBtn");
    if (aiAssistantBtn) {
      aiAssistantBtn.addEventListener("click", () => {
        this.openChatbot();
      });
    }

    // Profile login button
    const profileLoginBtn = document.getElementById("profileLoginBtn");
    if (profileLoginBtn) {
      profileLoginBtn.addEventListener("click", () => {
        this.handleProfileLogin();
      });
    }

    DEBUG.log("Event listeners setup complete");
  }

  async init() {
    DEBUG.log("Initializing My Projects Manager");

    // Set up auth state listener
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      DEBUG.log("Auth state changed", { userId: user?.uid });

      if (user) {
        await this.handleUserLogin(user);
      } else {
        await this.handleUserLogout();
      }
    });

    DEBUG.log("My Projects Manager initialized - Features ready to initialize");
  }

  async handleUserLogin(user) {
    DEBUG.log("Handling user login", { uid: user.uid });

    try {
      // Load user profile
      await this.loadUserProfile(user.uid);

      // Update UI for logged-in user
      this.updateUIForLoggedInUser();

      // Load widgets
      DEBUG.log("Initializing widget loading feature");
      await this.loadUserWidgets();

      // Set up timeline listener
      DEBUG.log("Initializing timeline listener feature");
      this.setupTimelineListener();

      // Update stats
      DEBUG.log("Initializing profile stats feature");
      this.updateProfileStats();
    } catch (error) {
      DEBUG.error("Error handling user login", error);
      this.showToast("Error loading profile", "error");
    }
  }

  async handleUserLogout() {
    DEBUG.log("Handling user logout");

    this.userProfile = null;
    this.widgets = [];

    // Update UI for logged-out user
    this.updateUIForLoggedOutUser();

    // Clean up listeners
    if (this.timelineUnsubscribe) {
      this.timelineUnsubscribe();
      this.timelineUnsubscribe = null;
    }
  }

  async loadUserProfile(userId) {
    try {
      DEBUG.log("Loading user profile", { userId });

      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        this.userProfile = userDoc.data();
        DEBUG.log("User profile loaded", this.userProfile);
      } else {
        throw new Error("User profile not found");
      }
    } catch (error) {
      DEBUG.error("Failed to load user profile", error);
      throw error;
    }
  }

  updateUIForLoggedInUser() {
    if (!this.userProfile) return;

    DEBUG.log("Updating UI for logged-in user");

    const { userAvatar, userName, profileAvatar, profileName, profileBio } =
      this.domElements;

    // Update header
    if (userAvatar) {
      userAvatar.style.backgroundImage = this.userProfile.photoURL
        ? `url(${this.userProfile.photoURL})`
        : "";
      userAvatar.innerHTML = this.userProfile.photoURL ? "" : "👤";
    }
    if (userName)
      userName.textContent =
        this.userProfile.displayName ||
        this.userProfile.email?.split("@")[0] ||
        "User";

    // Update profile card
    if (profileAvatar) {
      profileAvatar.style.backgroundImage = this.userProfile.photoURL
        ? `url(${this.userProfile.photoURL})`
        : "";
      profileAvatar.innerHTML = this.userProfile.photoURL ? "" : "👤";
    }
    if (profileName)
      profileName.textContent =
        this.userProfile.displayName ||
        this.userProfile.email?.split("@")[0] ||
        "User";
    if (profileBio)
      profileBio.textContent =
        this.userProfile.bio || "Welcome to your creative dashboard!";

    // Show profile section, hide auth section
    if (this.domElements.profileSection)
      this.domElements.profileSection.style.display = "block";
    if (this.domElements.authSection)
      this.domElements.authSection.style.display = "none";
  }

  updateUIForLoggedOutUser() {
    DEBUG.log("Updating UI for logged-out user");

    const { userAvatar, userName, profileName, profileBio } = this.domElements;

    // Update header
    if (userAvatar) {
      userAvatar.style.backgroundImage = "";
      userAvatar.innerHTML = "👤";
    }
    if (userName) userName.textContent = "Guest";

    // Update profile card
    if (profileName) profileName.textContent = "Welcome Guest";
    if (profileBio)
      profileBio.textContent =
        "Sign in to access your projects and connect with the community.";

    // Show auth section, hide profile section
    if (this.domElements.profileSection)
      this.domElements.profileSection.style.display = "none";
    if (this.domElements.authSection)
      this.domElements.authSection.style.display = "block";
  }

  async loadUserWidgets() {
    try {
      if (!this.currentUser) return;

      DEBUG.log("Loading user widgets", { userId: this.currentUser.uid });

      // Try the optimized query first, fallback to simple query if index missing
      let widgetsQuery;
      try {
        widgetsQuery = query(
          collection(db, "widgets"),
          where("userId", "==", this.currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const querySnapshot = await getDocs(widgetsQuery);
        this.widgets = [];

        querySnapshot.forEach((doc) => {
          const widget = { id: doc.id, ...doc.data() };
          this.widgets.push(widget);
        });
      } catch (indexError) {
        DEBUG.warn("Index not available, using fallback query", indexError);
        // Fallback query without orderBy
        widgetsQuery = query(
          collection(db, "widgets"),
          where("userId", "==", this.currentUser.uid),
          limit(20)
        );

        const querySnapshot = await getDocs(widgetsQuery);
        this.widgets = [];

        querySnapshot.forEach((doc) => {
          const widget = { id: doc.id, ...doc.data() };
          this.widgets.push(widget);
        });

        // Sort manually by creation date
        this.widgets.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime; // Descending order
        });
      }

      DEBUG.log("User widgets loaded", { count: this.widgets.length });
      this.renderWidgets();
    } catch (error) {
      DEBUG.error("Failed to load user widgets", error);

      if (error.code === "failed-precondition") {
        this.showToast(
          "Database index is being created. Please refresh in a moment.",
          "warning"
        );
      } else {
        this.showToast(
          "Failed to load widgets. Please check your connection.",
          "error"
        );
      }
    }
  }

  renderWidgets() {
    const { widgetsGrid } = this.domElements;
    if (!widgetsGrid) return;

    if (this.widgets.length === 0) {
      widgetsGrid.innerHTML = `
        <div class="neo-card" style="text-align: center; color: #a0a0a0;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🎨</div>
          <h3>No widgets yet</h3>
          <p>Create your first widget in the Widget Studio</p>
          <a href="widget_studio.html" class="quick-action-btn" style="margin-top: 1rem; display: inline-block;">Get Started</a>
        </div>
      `;
      return;
    }

    widgetsGrid.innerHTML = "";

    this.widgets.forEach((widget) => {
      const widgetCard = this.createWidgetCard(widget);
      widgetsGrid.appendChild(widgetCard);
    });
  }

  createWidgetCard(widget) {
    const card = document.createElement("div");
    card.className = "neo-card";
    card.innerHTML = `
      <h3>${widget.title || "Untitled Widget"}</h3>
      <p>${widget.description || "No description"}</p>
      <div style="margin-top: auto; display: flex; gap: 0.5rem;">
        <button class="quick-action-btn" onclick="window.open('${widget.files?.[0]?.downloadURL || "#"}', '_blank')">
          👁️ Preview
        </button>
        <button class="quick-action-btn" onclick="navigator.share({ title: '${widget.title}', url: '${widget.files?.[0]?.downloadURL || ""}' })">
          📤 Share
        </button>
      </div>
    `;
    return card;
  }

  setupTimelineListener() {
    if (!this.currentUser) return;

    DEBUG.log("Setting up timeline listener", { userId: this.currentUser.uid });

    // Clean up previous listener
    if (this.timelineUnsubscribe) {
      this.timelineUnsubscribe();
    }

    try {
      const timelineQuery = query(
        collection(db, "notifications"),
        where("userId", "==", this.currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      this.timelineUnsubscribe = onSnapshot(
        timelineQuery,
        (snapshot) => {
          this.renderTimeline(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        },
        (error) => {
          DEBUG.error("Timeline listener error", error);
          // Show fallback timeline on error
          this.renderTimeline([]);
        }
      );
    } catch (error) {
      DEBUG.error("Failed to setup timeline listener", error);
      // Show fallback timeline
      this.renderTimeline([]);
    }
  }

  renderTimeline(notifications) {
    const { timelineSection } = this.domElements;
    if (!timelineSection) return;

    if (notifications.length === 0) {
      timelineSection.innerHTML = `
        <div class="timeline-event">
          <div class="timeline-event-title">No recent activity</div>
          <div class="timeline-event-content">
            Your activity timeline will appear here as you create widgets and interact with the community.
          </div>
        </div>
      `;
      return;
    }

    timelineSection.innerHTML = "";

    notifications.forEach((notification) => {
      const event = this.createTimelineEvent(notification);
      timelineSection.appendChild(event);
    });
  }

  createTimelineEvent(notification) {
    const event = document.createElement("div");
    event.className = "timeline-event";

    const timestamp = notification.timestamp?.toDate
      ? new Date(notification.timestamp.toDate()).toLocaleString()
      : "Just now";

    event.innerHTML = `
      <div class="timeline-event-title">${notification.title || "Activity"}</div>
      <div class="timeline-event-content">
        ${notification.message || ""}
        <div style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">${timestamp}</div>
      </div>
    `;

    return event;
  }

  updateProfileStats() {
    if (!this.userProfile) return;

    const { widgetsCount, followersCount, viewsCount } = this.domElements;

    if (widgetsCount) widgetsCount.textContent = this.widgets.length || 0;
    if (followersCount)
      followersCount.textContent = this.userProfile.followers?.length || 0;
    if (viewsCount)
      viewsCount.textContent = this.userProfile.stats?.totalViews || 0;
  }

  async handleLogin() {
    try {
      const email = this.domElements.loginEmail.value;
      const password = this.domElements.loginPassword.value;

      if (!email || !password) {
        this.showToast("Please fill in all fields", "warning");
        return;
      }

      DEBUG.log("Attempting login", { email });

      // Show loading state
      this.setLoginButtonLoading(true);

      await signInWithEmailAndPassword(auth, email, password);

      this.showToast("Login successful!", "success");
      this.clearLoginForm();
    } catch (error) {
      DEBUG.error("Login failed", error);
      this.showToast(this.getAuthErrorMessage(error), "error");
    } finally {
      this.setLoginButtonLoading(false);
    }
  }

  async handleSignup() {
    try {
      const email = this.domElements.signupEmail.value;
      const password = this.domElements.signupPassword.value;
      const displayName = this.domElements.signupDisplayName.value;

      if (!email || !password) {
        this.showToast("Please fill in email and password", "warning");
        return;
      }

      if (password.length < 6) {
        this.showToast("Password must be at least 6 characters", "warning");
        return;
      }

      DEBUG.log("Attempting signup", { email });

      // Show loading state
      this.setSignupButtonLoading(true);

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      DEBUG.log("User created successfully", { uid: user.uid });

      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(user, {
          displayName: displayName,
        });
        DEBUG.log("Display name updated", { displayName });
      }

      this.showToast(
        "Account created successfully! Welcome to inQ!",
        "success"
      );
      this.clearSignupForm();

      // Switch back to login form
      setTimeout(() => {
        this.showLoginForm();
      }, 2000);
    } catch (error) {
      DEBUG.error("Signup failed", error);
      this.showToast(this.getSignupErrorMessage(error), "error");
    } finally {
      this.setSignupButtonLoading(false);
    }
  }

  showSignupForm() {
    DEBUG.log("Showing signup form");

    if (this.domElements.loginFormContainer) {
      this.domElements.loginFormContainer.style.display = "none";
    }
    if (this.domElements.signupFormContainer) {
      this.domElements.signupFormContainer.style.display = "block";
    }

    // Update toggle buttons
    if (
      this.domElements.showSignupBtn &&
      this.domElements.showSignupBtn.parentElement
    ) {
      this.domElements.showSignupBtn.parentElement.style.display = "none";
    }
    if (
      this.domElements.showLoginBtn &&
      this.domElements.showLoginBtn.parentElement
    ) {
      this.domElements.showLoginBtn.parentElement.style.display = "block";
    }
  }

  showLoginForm() {
    DEBUG.log("Showing login form");

    if (this.domElements.signupFormContainer) {
      this.domElements.signupFormContainer.style.display = "none";
    }
    if (this.domElements.loginFormContainer) {
      this.domElements.loginFormContainer.style.display = "block";
    }

    // Update toggle buttons
    if (
      this.domElements.showLoginBtn &&
      this.domElements.showLoginBtn.parentElement
    ) {
      this.domElements.showLoginBtn.parentElement.style.display = "none";
    }
    if (
      this.domElements.showSignupBtn &&
      this.domElements.showSignupBtn.parentElement
    ) {
      this.domElements.showSignupBtn.parentElement.style.display = "block";
    }
  }

  setLoginButtonLoading(loading) {
    const { loginBtn } = this.domElements;
    if (!loginBtn) return;

    loginBtn.disabled = loading;
    loginBtn.textContent = loading ? "Signing In..." : "Sign In";
  }

  clearLoginForm() {
    if (this.domElements.loginEmail) this.domElements.loginEmail.value = "";
    if (this.domElements.loginPassword)
      this.domElements.loginPassword.value = "";
  }

  setSignupButtonLoading(loading) {
    const { signupBtn } = this.domElements;
    if (!signupBtn) return;

    signupBtn.disabled = loading;
    signupBtn.textContent = loading ? "Creating Account..." : "Create Account";
  }

  clearSignupForm() {
    if (this.domElements.signupEmail) this.domElements.signupEmail.value = "";
    if (this.domElements.signupPassword)
      this.domElements.signupPassword.value = "";
    if (this.domElements.signupDisplayName)
      this.domElements.signupDisplayName.value = "";
  }

  getSignupErrorMessage(error) {
    const errorMessages = {
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password":
        "Password is too weak. Please choose a stronger password.",
      "auth/network-request-failed":
        "Network error. Please check your connection.",
      "auth/too-many-requests": "Too many requests. Please try again later.",
    };

    return (
      errorMessages[error.code] || "Account creation failed. Please try again."
    );
  }

  getAuthErrorMessage(error) {
    const errorMessages = {
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/invalid-email": "Invalid email address.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests": "Too many failed attempts. Try again later.",
    };

    return errorMessages[error.code] || "Login failed. Please try again.";
  }

  refreshTimeline() {
    DEBUG.log("Refreshing timeline");

    if (this.timelineUnsubscribe) {
      this.timelineUnsubscribe();
    }

    this.setupTimelineListener();
    this.showToast("Timeline refreshed!", "success");
  }

  openChatbot() {
    DEBUG.log("Opening chatbot modal");

    const chatbotModal = document.getElementById("chatbotModal");
    if (chatbotModal) {
      chatbotModal.style.display = "flex";
      this.showToast("AI Assistant opened!", "info");

      // Focus on chat input
      setTimeout(() => {
        const chatInput = document.getElementById("chatInput");
        if (chatInput) chatInput.focus();
      }, 100);
    } else {
      DEBUG.error("Chatbot modal not found");
      this.showToast("AI Assistant not available", "error");
    }
  }

  handleProfileLogin() {
    DEBUG.log("Handling profile login button click");

    // Show auth modal or redirect to login
    const authModal = document.getElementById("authModal");
    if (authModal) {
      authModal.style.display = "block";
      document.body.style.overflow = "hidden";
    } else {
      this.showToast("Login system initializing...", "info");
    }
  }

  showToast(message, type = "info") {
    const { toastContainer } = this.domElements;
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${this.getToastIcon(type)}</div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);

    // Manual close
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }

  getToastIcon(type) {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    return icons[type] || icons.info;
  }
}

// Initialize the My Projects manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  DEBUG.log("DOM Content Loaded - Starting My Projects initialization");

  try {
    const myProjectsManager = new MyProjectsManager();
    window.myProjectsManager = myProjectsManager; // Make globally accessible
    DEBUG.log("My Projects page ready");
  } catch (error) {
    DEBUG.error("Failed to initialize My Projects", error);
  }
});

// Global function for onclick handlers
window.openChatbot = function () {
  if (window.myProjectsManager) {
    window.myProjectsManager.openChatbot();
  } else {
    console.warn("[MY PROJECTS] MyProjectsManager not found");
  }
};

// Export for potential use by other modules
export default MyProjectsManager;
