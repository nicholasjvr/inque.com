import { auth, db, storage } from "../../core/firebase-core.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

// Enhanced Auth System with Social Features
class SocialAuthManager {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.isLoading = false;
    this.authStateListeners = [];
    this.debugMode = true;
    this.hasShownWelcomeThisSession = false;

    // Cache DOM elements
    this.domElements = {};
    this.notificationUnsubscribe = null;

    // Initialize DOM elements when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializeDOMElements();
      });
    } else {
      this.initializeDOMElements();
    }
  }

  // Debug logging utility
  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[SOCIAL AUTH] ${message}`, data || "");
    }
  }

  error(message, error = null) {
    console.error(`[SOCIAL AUTH ERROR] ${message}`, error || "");
  }

  // Initialize DOM element references
  initializeDOMElements() {
    this.log("Initializing DOM element references");

    this.domElements = {
      // Auth Modal
      authModal: document.getElementById("authModal"),
      authCloseBtn: document.querySelector(".auth-close-button"),
      loginForm: document.getElementById("loginForm"),
      signUpForm: document.getElementById("signUpForm"),
      showSignUp: document.getElementById("showSignUp"),
      showLogin: document.getElementById("showLogin"),
      authModalTitle: document.getElementById("authModalTitle"),
      googleLoginBtn: document.getElementById("googleLoginBtn"),
      githubLoginBtn: document.getElementById("githubLoginBtn"),

      // Profile Elements
      profilePicContainer: document.querySelector(".profile-pic-container"),
      profileName: document.querySelector(".profile-name"),
      profileBio: document.querySelector(".profile-bio"),
      profileLvl: document.getElementById("profileLvl"),
      profileType: document.getElementById("profileType"),
      profileRole: document.getElementById("profileRole"),
      profileStatusIndicator: document.getElementById("profileStatusIndicator"),
      profileStatus: document.getElementById("profileStatus"),

      // Sidebar Elements
      sidebarAvatar: document.querySelector(".sidebar-avatar"),
      sidebarUserName: document.querySelector(".sidebar-user-name"),
      sidebarUserEmail: document.querySelector(".sidebar-user-email"),
      sidebarUserStatus: document.querySelector(".sidebar-user-status"),
      sidebarStatusDot: document.querySelector(".status-dot"),
      sidebarLoginBtn: document.getElementById("sidebarLoginBtn"),
      sidebarUserActions: document.getElementById("sidebarUserActions"),
      sidebarEditProfileBtn: document.getElementById("sidebarEditProfileBtn"),
      sidebarLogoutBtn: document.getElementById("sidebarLogoutBtn"),
      sidebarStats: document.querySelector(".sidebar-stats"),
      sidebarLvl: document.getElementById("sidebarLvl"),
      sidebarType: document.getElementById("sidebarType"),
      sidebarRole: document.getElementById("sidebarRole"),

      // Notification Elements
      notificationCount: document.getElementById("notificationCount"),
      notificationList: document.getElementById("notificationList"),
      markAllReadBtn: document.getElementById("markAllReadBtn"),
    };

    this.log("DOM elements initialized", Object.keys(this.domElements));
  }

  // Initialize the auth system
  async init() {
    this.log("Initializing Social Auth Manager");

    // Set up auth state listener
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      this.log("Auth state changed", { userId: user?.uid });

      if (user) {
        await this.handleUserLogin(user);
      } else {
        await this.handleUserLogout();
      }

      // Notify listeners
      this.authStateListeners.forEach((listener) => listener(user));

      // Dispatch custom event for main.js to listen to
      this.dispatchAuthStateEvent(user);
    });

    // Set up DOM event listeners
    this.setupEventListeners();

    this.log("Social Auth Manager initialized");

    // Add debug function to check auth state
    window.debugAuthState = () => {
      console.log("[AUTH DEBUG] Current auth state:", {
        currentUser: this.currentUser?.uid,
        userProfile: this.userProfile,
        isLoading: this.isLoading,
        hasShownWelcome: this.hasShownWelcomeThisSession,
      });
    };
  }

  // Dispatch custom auth state change event
  dispatchAuthStateEvent(user, profile = null) {
    const isNewLogin = user && !this.hasShownWelcomeThisSession;

    if (user) {
      this.hasShownWelcomeThisSession = true;
    }

    const event = new CustomEvent("auth-state-changed", {
      detail: {
        user,
        profile: profile || this.userProfile,
        isNewLogin,
        timestamp: Date.now(),
      },
    });

    window.dispatchEvent(event);
    this.log("Auth state change event dispatched", {
      userId: user?.uid,
      isNewLogin,
      hasProfile: !!profile,
    });
  }

  // Enhanced registration with social features
  async registerUser(userData) {
    try {
      this.isLoading = true;
      this.log("Starting user registration", { email: userData.email });

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Create comprehensive user profile
      const profileData = {
        uid: user.uid,
        email: userData.email,
        displayName: userData.displayName || userData.email.split("@")[0],
        bio: userData.bio || "Welcome to inque! 🚀",
        photoURL: userData.photoURL || this.getDefaultAvatar(),
        username: userData.username || this.generateUsername(userData.email),
        level: 1,
        experience: 0,
        type: "NEWB",
        role: "USER",
        followers: [],
        following: [],
        widgets: [],
        socialLinks: {
          twitter: userData.twitter || "",
          instagram: userData.instagram || "",
          github: userData.github || "",
          website: userData.website || "",
        },
        preferences: {
          theme: "auto",
          notifications: true,
          privacy: "public",
          language: "en",
        },
        stats: {
          widgetsCreated: 0,
          followersCount: 0,
          followingCount: 0,
          totalViews: 0,
          totalLikes: 0,
        },
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        isVerified: false,
        isPremium: false,
      };

      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), profileData);
      this.log("User profile created successfully");

      // Create welcome notification
      await this.createNotification(user.uid, {
        type: "welcome",
        title: "Welcome to inque! 🎉",
        message:
          "Your account has been created successfully. Start by uploading your first widget!",
        icon: "🎉",
        data: { action: "upload_widget" },
      });

      // Create default widget slots
      await this.createDefaultWidgetSlots(user.uid);

      this.log("Registration completed successfully");
      return { success: true, user, profile: profileData };
    } catch (error) {
      this.error("Registration failed", error);
      return { success: false, error: this.getUserFriendlyError(error) };
    } finally {
      this.isLoading = false;
    }
  }

  // Enhanced login with social features
  async loginUser(credentials) {
    try {
      this.isLoading = true;
      this.log("Starting user login", { email: credentials.email });

      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      const user = userCredential.user;

      // Update last active
      await updateDoc(doc(db, "users", user.uid), {
        lastActive: serverTimestamp(),
      });

      // Create login notification
      await this.createNotification(user.uid, {
        type: "login",
        title: "Welcome back! 👋",
        message: "You've successfully logged into your account.",
        icon: "🔐",
        data: { action: "dashboard" },
      });

      this.log("Login completed successfully");
      return { success: true, user };
    } catch (error) {
      this.error("Login failed", error);
      return { success: false, error: this.getUserFriendlyError(error) };
    } finally {
      this.isLoading = false;
    }
  }

  // Social provider login
  async loginWithProvider(providerName) {
    try {
      this.isLoading = true;
      this.log("Starting social login", { provider: providerName });

      let provider;
      switch (providerName) {
        case "google":
          provider = new GoogleAuthProvider();
          break;
        case "github":
          provider = new GithubAuthProvider();
          break;
        default:
          throw new Error("Unsupported provider");
      }

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in our database
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // Create new user profile for social login
        await this.createSocialUserProfile(user, providerName);
      } else {
        // Update existing user
        await updateDoc(doc(db, "users", user.uid), {
          lastActive: serverTimestamp(),
        });
      }

      this.log("Social login completed successfully");
      return { success: true, user };
    } catch (error) {
      this.error("Social login failed", error);
      return { success: false, error: this.getUserFriendlyError(error) };
    } finally {
      this.isLoading = false;
    }
  }

  // Widget upload functionality is now handled by WidgetUploadManager
  // This method is kept for backward compatibility but delegates to the upload manager
  async uploadWidget(widgetData) {
    this.log("Widget upload requested, delegating to WidgetUploadManager");

    // Import the upload manager if not already available
    if (!window.widgetUploadManager) {
      const { default: widgetUploadManager } = await import(
        "../widgets/widget-upload.js"
      );
      window.widgetUploadManager = widgetUploadManager;
    }

    // Delegate to the upload manager
    return await window.widgetUploadManager.handleWidgetUpload(widgetData);
  }

  // Social features
  async followUser(targetUserId) {
    try {
      if (!this.currentUser) throw new Error("User must be logged in");

      const currentUserId = this.currentUser.uid;

      // Add to following list
      await updateDoc(doc(db, "users", currentUserId), {
        following: arrayUnion(targetUserId),
      });

      // Add to target user's followers
      await updateDoc(doc(db, "users", targetUserId), {
        followers: arrayUnion(currentUserId),
      });

      // Create follow notification
      await this.createNotification(targetUserId, {
        type: "follow",
        title: "New follower! 👥",
        message: `${
          this.userProfile?.displayName || "Someone"
        } started following you.`,
        icon: "👥",
        data: { followerId: currentUserId, action: "view_profile" },
      });

      this.log("User followed successfully");
      return { success: true };
    } catch (error) {
      this.error("Follow action failed", error);
      return { success: false, error: this.getUserFriendlyError(error) };
    }
  }

  async unfollowUser(targetUserId) {
    try {
      if (!this.currentUser) throw new Error("User must be logged in");

      const currentUserId = this.currentUser.uid;

      // Remove from following list
      await updateDoc(doc(db, "users", currentUserId), {
        following: arrayRemove(targetUserId),
      });

      // Remove from target user's followers
      await updateDoc(doc(db, "users", targetUserId), {
        followers: arrayRemove(currentUserId),
      });

      this.log("User unfollowed successfully");
      return { success: true };
    } catch (error) {
      this.error("Unfollow action failed", error);
      return { success: false, error: this.getUserFriendlyError(error) };
    }
  }

  // Helper methods
  generateUsername(email) {
    const base = email.split("@")[0];
    const random = Math.floor(Math.random() * 1000);
    return `${base}${random}`;
  }

  generateWidgetId() {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDefaultAvatar() {
    const avatars = [
      "https://i.pinimg.com/originals/3c/69/1d/3c691d9047d7fb33383a8b417c8e9b67.jpg",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  getUserFriendlyError(error) {
    const errorMessages = {
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password":
        "Password is too weak. Please choose a stronger password.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/too-many-requests":
        "Too many failed attempts. Please try again later.",
      "auth/network-request-failed":
        "Network error. Please check your connection.",
      "auth/popup-closed-by-user": "Login was cancelled.",
      "auth/cancelled-popup-request": "Login was cancelled.",
      "auth/popup-blocked":
        "Popup was blocked. Please allow popups for this site.",
    };

    return errorMessages[error.code] || "An error occurred. Please try again.";
  }

  async createNotification(userId, notificationData) {
    try {
      const notification = {
        userId: userId,
        type: notificationData.type || "system",
        title: notificationData.title,
        message: notificationData.message,
        read: false,
        timestamp: serverTimestamp(),
        data: notificationData.data || {},
        icon: notificationData.icon || "🔔",
      };

      await addDoc(collection(db, "notifications"), notification);
      this.log("Notification created", notification);
      return notification;
    } catch (error) {
      this.error("Error creating notification", error);
      throw error;
    }
  }

  async createDefaultWidgetSlots(userId) {
    try {
      const placeholderHtml = new Blob(
        [
          `<html>
        <head><title>Widget Placeholder</title></head>
        <body style='display:flex;align-items:center;justify-content:center;height:100vh;background:#222;color:#fff;font-family:Arial,sans-serif;'>
          <div style='text-align:center;'>
            <h2>Widget Placeholder</h2>
            <p>This is a placeholder widget.</p>
            <p>Upload your files to replace this!</p>
            <img src='https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif' alt='Placeholder' style='max-width:200px;border-radius:10px;'/>
          </div>
        </body>
      </html>`,
        ],
        { type: "text/html" }
      );

      for (let i = 1; i <= 3; i++) {
        const storageRef = ref(
          storage,
          `users/${userId}/app-widget-${i}/index.html`
        );
        await uploadBytes(storageRef, placeholderHtml);
        this.log(`Created widget slot ${i}`);
      }
    } catch (error) {
      this.error("Error creating widget slots", error);
    }
  }

  async uploadWidgetFiles(files, userId, widgetId) {
    const fileUrls = [];

    for (const file of files) {
      const fileRef = ref(
        storage,
        `users/${userId}/widgets/${widgetId}/${file.name}`
      );
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      fileUrls.push(url);
    }

    return fileUrls;
  }

  async createSocialUserProfile(user, providerName) {
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split("@")[0],
      bio: "Welcome to inque! 🚀",
      photoURL: user.photoURL || this.getDefaultAvatar(),
      username: this.generateUsername(user.email),
      level: 1,
      experience: 0,
      type: "NEWB",
      role: "USER",
      followers: [],
      following: [],
      widgets: [],
      socialLinks: {},
      preferences: {
        theme: "auto",
        notifications: true,
        privacy: "public",
        language: "en",
      },
      stats: {
        widgetsCreated: 0,
        followersCount: 0,
        followingCount: 0,
        totalViews: 0,
        totalLikes: 0,
      },
      // Enhanced Dashboard Customization Settings
      dashboardSettings: {
        layout: "grid", // "grid" | "list" | "timeline"
        theme: "neo-brutalist", // "neo-brutalist" | "minimal" | "dark" | "custom"
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
      },
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      isVerified: false,
      isPremium: false,
      loginProvider: providerName,
    };

    await setDoc(doc(db, "users", user.uid), profileData);
    await this.createDefaultWidgetSlots(user.uid);
  }

  // Dashboard Settings Management
  async updateDashboardSettings(userId, settings) {
    try {
      this.log("Updating dashboard settings", { userId, settings });

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        dashboardSettings: settings,
        updatedAt: serverTimestamp(),
      });

      this.log("Dashboard settings updated successfully");
      return { success: true };
    } catch (error) {
      this.error("Failed to update dashboard settings", error);
      return { success: false, error: error.message };
    }
  }

  async getDashboardSettings(userId) {
    try {
      this.log("Getting dashboard settings", { userId });

      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const settings =
          data.dashboardSettings || this.getDefaultDashboardSettings();
        this.log("Dashboard settings retrieved", settings);
        return { success: true, settings };
      } else {
        throw new Error("User profile not found");
      }
    } catch (error) {
      this.error("Failed to get dashboard settings", error);
      return { success: false, error: error.message };
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

  // Event listeners setup
  setupEventListeners() {
    // ... existing event listeners will be enhanced here
  }

  // Auth state management
  onAuthStateChanged(listener) {
    this.authStateListeners.push(listener);
  }

  async handleUserLogin(user) {
    this.log("Handling user login", { uid: user.uid });

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        this.userProfile = userDoc.data();
        this.log("User profile loaded", this.userProfile);

        // Update UI for logged in user
        this.updateUIForLoggedInUser();

        // Set up notification listener
        this.setupNotificationListener(user.uid);

        // Dispatch enhanced auth state event with profile data
        this.dispatchAuthStateEvent(user, this.userProfile);
      } else {
        this.log("User profile not found, creating default profile");
        // Create a default profile if it doesn't exist
        const defaultUserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0],
          name: user.displayName || user.email?.split("@")[0],
          bio: "Welcome to inque! 🚀",
          photoURL: user.photoURL || this.getDefaultAvatar(),
          username: this.generateUsername(user.email),
          level: 1,
          experience: 0,
          type: "NEWB",
          role: "USER",
          followers: [],
          following: [],
          widgets: [],
          socialLinks: {},
          preferences: {
            theme: "auto",
            notifications: true,
            privacy: "public",
            language: "en",
          },
          stats: {
            widgetsCreated: 0,
            followersCount: 0,
            followingCount: 0,
            totalViews: 0,
            totalLikes: 0,
          },
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          isVerified: false,
          isPremium: false,
        };

        await setDoc(doc(db, "users", user.uid), defaultUserProfile);
        this.userProfile = defaultUserProfile;

        // Update UI
        this.updateUIForLoggedInUser();

        // Set up notification listener
        this.setupNotificationListener(user.uid);

        // Dispatch enhanced auth state event with profile data
        this.dispatchAuthStateEvent(user, this.userProfile);
      }
    } catch (error) {
      this.error("Error handling user login", error);
    }
  }

  async handleUserLogout() {
    this.log("Handling user logout");
    this.userProfile = null;
    this.updateUIForLoggedOutUser();

    // Clean up notification listener
    if (this.notificationUnsubscribe) {
      this.notificationUnsubscribe();
    }
  }

  updateUIForLoggedInUser() {
    this.log("Updating UI for logged in user");
    // UI updates are now handled by ProfileHub
    // Just emit auth state change for ProfileHub to handle
    this.dispatchAuthStateEvent(this.currentUser);
  }

  updateUIForLoggedOutUser() {
    this.log("Updating UI for logged out user");
    // UI updates are now handled by ProfileHub
    // Just emit auth state change for ProfileHub to handle
    this.dispatchAuthStateEvent(null);
  }

  // Legacy method - UI updates now handled by ProfileHub
  updateProfileBanner(profileData, isLoggedIn = false) {
    this.log("Profile banner update delegated to ProfileHub");
    // ProfileHub will handle this via auth state change events
  }

  updateSidebarUserInfo(profileData, isLoggedIn = false, userEmail = null) {
    this.log("Sidebar user info update delegated to ProfileHub");
    // ProfileHub will handle this via auth state change events
  }

  // Notification system methods
  async markNotificationAsRead(notificationId) {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { read: true });
      this.log("Notification marked as read", { notificationId });
    } catch (error) {
      this.error("Error marking notification as read", error);
    }
  }

  async markAllNotificationsAsRead(userId) {
    try {
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("read", "==", false)
      );

      const querySnapshot = await getDocs(notificationsQuery);
      const updatePromises = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);
      this.log("All notifications marked as read");
    } catch (error) {
      this.error("Error marking all notifications as read", error);
    }
  }

  setupNotificationListener(userId) {
    this.log("Setting up notification listener", { userId });

    // Clean up previous listener if exists
    if (this.notificationUnsubscribe) {
      this.notificationUnsubscribe();
    }

    const { notificationCount, notificationList, markAllReadBtn } =
      this.domElements;

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    this.notificationUnsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        // Clear current notifications
        if (notificationList) notificationList.innerHTML = "";

        let unreadCount = 0;
        let hasNotifications = false;

        snapshot.forEach((doc) => {
          const notification = { id: doc.id, ...doc.data() };
          hasNotifications = true;

          if (!notification.read) {
            unreadCount++;
          }

          // Create notification element
          const notificationItem = this.createNotificationElement(notification);
          if (notificationList) notificationList.appendChild(notificationItem);
        });

        // Update notification count
        if (notificationCount) {
          notificationCount.textContent = unreadCount;
          notificationCount.style.display =
            unreadCount > 0 ? "inline-block" : "none";
        }

        // Show/hide mark all as read button
        if (markAllReadBtn) {
          markAllReadBtn.style.display =
            unreadCount > 0 ? "inline-block" : "none";
        }

        // Show empty state if no notifications
        if (!hasNotifications && notificationList) {
          const emptyItem = document.createElement("div");
          emptyItem.className = "notification-item empty-notification";
          emptyItem.innerHTML =
            '<span class="notification-text">No new notifications</span>';
          notificationList.appendChild(emptyItem);
        }
      },
      (error) => {
        this.error("Error listening to notifications", error);
      }
    );
  }

  createNotificationElement(notification) {
    const notificationItem = document.createElement("div");
    notificationItem.className = `notification-item ${notification.type} ${
      notification.read ? "read" : "unread"
    }`;
    notificationItem.dataset.notificationId = notification.id;

    const timestamp = notification.timestamp
      ? new Date(notification.timestamp.toDate()).toLocaleString()
      : "Just now";

    notificationItem.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-icon">${notification.icon}</span>
          <span class="notification-title">${notification.title}</span>
          ${!notification.read ? '<span class="unread-indicator"></span>' : ""}
        </div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${timestamp}</div>
      </div>
      <button class="notification-close" aria-label="Dismiss notification">&times;</button>
    `;

    // Add click handler to mark as read
    notificationItem.addEventListener("click", (e) => {
      if (!e.target.classList.contains("notification-close")) {
        this.markNotificationAsRead(notification.id);
        this.handleNotificationAction(notification);
      }
    });

    // Add close button handler
    const closeBtn = notificationItem.querySelector(".notification-close");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notificationItem.remove();
    });

    return notificationItem;
  }

  handleNotificationAction(notification) {
    this.log("Handling notification action", { type: notification.type });

    switch (notification.type) {
      case "mention":
        if (notification.data.postId) {
          this.log("Navigate to post:", notification.data.postId);
        }
        break;
      case "like":
        if (notification.data.postId) {
          this.log("Navigate to liked post:", notification.data.postId);
        }
        break;
      case "follow":
        if (notification.data.followerId) {
          this.log(
            "Navigate to follower profile:",
            notification.data.followerId
          );
        }
        break;
      case "widget":
        if (notification.data.widgetId) {
          this.log("Open widget:", notification.data.widgetId);
        }
        break;
      default:
        this.log("Notification clicked:", notification);
    }
  }

  // Toast notification utility
  showToast(message, type = "info", duration = 5000) {
    this.log("Showing toast", { message, type, duration });

    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      this.log("Toast container not found");
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 100);

    // Auto remove
    const autoRemove = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);

    // Manual close
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      clearTimeout(autoRemove);
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
  }
}

// Initialize the enhanced auth system
const socialAuth = new SocialAuthManager();

// Expose for debugging (remove in production)
window.socialAuth = socialAuth;

document.addEventListener("DOMContentLoaded", () => {
  socialAuth.init();

  // DOM Elements for Auth Modal
  const authModal = document.getElementById("authModal");
  const authCloseBtn = document.querySelector(".auth-close-button");
  const loginForm = document.getElementById("loginForm");
  const signUpForm = document.getElementById("signUpForm");
  const showSignUp = document.getElementById("showSignUp");
  const showLogin = document.getElementById("showLogin");
  const authModalTitle = document.getElementById("authModalTitle");
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const githubLoginBtn = document.getElementById("githubLoginBtn");

  // DOM Elements for Profile Banner & Edit
  const profilePicContainer = document.querySelector(".profile-pic-container");
  const profileName = document.querySelector(".profile-name");
  const profileBio = document.querySelector(".profile-bio");
  const profileLvl = document.getElementById("profileLvl");
  const profileType = document.getElementById("profileType");
  const profileRole = document.getElementById("profileRole");
  const profileStatusIndicator = document.getElementById(
    "profileStatusIndicator"
  );
  const profileStatus = document.getElementById("profileStatus");
  const editProfileQuickBtn = document.getElementById("editProfileQuickBtn");
  const editProfileModal = document.getElementById("editProfileModal");
  const editProfileForm = document.getElementById("editProfileForm");
  const editPhotoInput = document.getElementById("editPhoto");
  const editProfileCloseBtn = document.querySelector(
    ".edit-profile-close-button"
  );

  // Add event listener for edit profile quick button
  if (editProfileQuickBtn) {
    editProfileQuickBtn.addEventListener("click", () => {
      console.log("[PROFILE EDIT] Edit profile quick button clicked");
      if (window.openEditProfile) {
        window.openEditProfile();
      } else {
        socialAuth.showToast("Edit Profile not available", "error");
      }
    });
  }

  // DOM Elements for Sidebar
  const sidebarAvatar = document.querySelector(".sidebar-avatar");
  const sidebarUserName = document.querySelector(".sidebar-user-name");
  const sidebarUserEmail = document.querySelector(".sidebar-user-email");
  const sidebarUserStatus = document.querySelector(".sidebar-user-status");
  const sidebarStatusDot = document.querySelector(".status-dot");
  const sidebarLoginBtn = document.getElementById("sidebarLoginBtn");
  const sidebarUserActions = document.getElementById("sidebarUserActions");
  const sidebarEditProfileBtn = document.getElementById(
    "sidebarEditProfileBtn"
  );
  const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");

  // DOM Elements for Sidebar Stats
  const sidebarStats = document.querySelector(".sidebar-stats");
  const sidebarLvl = document.getElementById("sidebarLvl");
  const sidebarType = document.getElementById("sidebarType");
  const sidebarRole = document.getElementById("sidebarRole");

  // DOM Elements for Notifications
  const notificationCount = document.getElementById("notificationCount");
  const notificationList = document.getElementById("notificationList");
  const markAllReadBtn = document.getElementById("markAllReadBtn");

  let currentUserProfile = null;
  let selectedFile = null;
  let notificationUnsubscribe = null; // For cleaning up real-time listeners

  const defaultProfile = {
    name: "Welcome to inque!",
    bio: "This is a space to create, share, and display your interactive projects. Sign up to start building your personal widget dashboard.",
    lvl: "LVL • ?",
    type: "TYPE • ?",
    role: "ROLE • GUEST",
    photoURL:
      "https://i.pinimg.com/originals/3c/69/1d/3c691d9047d7fb33383a8b417c8e9b67.jpg",
  };

  // ===== NOTIFICATION SYSTEM =====
  // Note: Notification methods are now handled by the SocialAuthManager class

  // Mark notification as read - now handled by SocialAuthManager class

  // Mark all notifications as read - now handled by SocialAuthManager class

  // Set up real-time notification listener - now handled by SocialAuthManager class

  // Create notification element - now handled by SocialAuthManager class

  // Handle notification actions - now handled by SocialAuthManager class

  // Add local notification (for immediate feedback)
  // Profile banner updates - now handled by SocialAuthManager class

  // Sidebar user info updates - now handled by SocialAuthManager class

  // Quick Actions Event Listeners (moved to end of file to avoid duplicate)
  // Toggle forms
  if (showSignUp) {
    showSignUp.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Switching to sign up form");
      loginForm.style.display = "none";
      signUpForm.style.display = "block";
      forgotPasswordForm.style.display = "none";
      authModalTitle.textContent = "Sign Up";
    });
  }

  if (showLogin) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Switching to login form");
      signUpForm.style.display = "none";
      loginForm.style.display = "block";
      forgotPasswordForm.style.display = "none";
      authModalTitle.textContent = "Login";
    });
  }

  // Show login from forgot password form
  const showLoginFromForgot = document.getElementById("showLoginFromForgot");
  if (showLoginFromForgot) {
    showLoginFromForgot.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Switching from forgot password to login form");
      forgotPasswordForm.style.display = "none";
      loginForm.style.display = "block";
      authModalTitle.textContent = "Login";
    });
  }

  // Open/Close Modal
  if (sidebarLoginBtn) {
    sidebarLoginBtn.addEventListener("click", () => {
      console.log("[SIDEBAR LOGIN] Login button clicked");
      if (window.openAuthModal) {
        window.openAuthModal("login");
      } else {
        // Fallback: show the auth modal directly
        authModal.style.display = "block";
        document.body.style.overflow = "hidden";
      }
    });
  }

  // Edit Profile button
  if (sidebarEditProfileBtn) {
    sidebarEditProfileBtn.addEventListener("click", () => {
      console.log("[SIDEBAR EDIT PROFILE] Edit profile button clicked");
      if (window.openEditProfile) {
        window.openEditProfile();
      } else {
        socialAuth.showToast("Edit Profile not available", "error");
      }
    });
  }

  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", () => {
      console.log("Closing auth modal");
      authModal.style.display = "none";
      document.body.style.overflow = "";
    });
  }

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === authModal) {
      console.log("Closing auth modal via outside click");
      authModal.style.display = "none";
      document.body.style.overflow = "";
    }
  });

  // Close modal on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && authModal.style.display === "block") {
      console.log("Closing auth modal via escape key");
      authModal.style.display = "none";
      document.body.style.overflow = "";
    }
  });

  // Sidebar auth button event listeners
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          console.log("User signed out.");
        })
        .catch((error) => {
          console.error("Sign out error:", error);
        });
    });
  }

  // Toast notifications - now handled by SocialAuthManager class

  // Handle Auth State Changes with better error handling
  onAuthStateChanged(auth, async (user) => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileUserId = urlParams.get("user");

    if (user) {
      try {
        console.log("User authenticated:", user.uid);

        // Only show welcome toast if this is a new login (not page refresh)
        if (!window.authState || !window.authState.isInitialized) {
          socialAuth.showToast(
            `Welcome back, ${user.displayName || user.email}! 🎉`,
            "success",
            4000
          );
        }

        // Close the auth modal if it's open
        const authModal = document.getElementById("authModal");
        if (authModal && authModal.style.display === "block") {
          authModal.style.display = "none";
          document.body.style.overflow = "";
        }

        // Get user profile from Firestore
        console.log("Fetching user profile from Firestore...");
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          console.log("User profile found:", userDoc.data());
          const sidebarProfile = userDoc.data();
          socialAuth.updateSidebarUserInfo(sidebarProfile, true, user.email);

          // Show profile banner for viewed profile (could be self or other)
          if (profileUserId) {
            // For now, just show the current user's profile
            // TODO: Implement fetchAndDisplayProfile for viewing other users
            socialAuth.updateProfileBanner(sidebarProfile, true);
          } else {
            socialAuth.updateProfileBanner(sidebarProfile, true);
          }

          // Set up notifications for this user
          socialAuth.setupNotificationListener(user.uid);
        } else {
          console.warn(
            "User profile not found in Firestore, creating default profile"
          );
          // Create a default profile if it doesn't exist
          const defaultUserProfile = {
            name: user.displayName || user.email.split("@")[0],
            bio: "A new user ready to create amazing things.",
            lvl: "LVL • 1",
            type: "TYPE • NEWB",
            role: "ROLE • USER",
            photoURL: defaultProfile.photoURL,
            email: user.email,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          };

          await setDoc(doc(db, "users", user.uid), defaultUserProfile);
          socialAuth.updateSidebarUserInfo(
            defaultUserProfile,
            true,
            user.email
          );
          socialAuth.updateProfileBanner(defaultUserProfile, true);
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        socialAuth.showToast(
          "Error loading profile. Please refresh the page.",
          "error"
        );
      }
    } else {
      // Not logged in
      console.log("User not authenticated");
      socialAuth.updateSidebarUserInfo(defaultProfile, false);
      socialAuth.updateProfileBanner(defaultProfile, false);

      // Clean up notification listener
      if (notificationUnsubscribe) {
        notificationUnsubscribe();
      }
    }
  });

  // Social Provider Login
  const handleProviderLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Logged in with provider:", result.user);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      alert(error.message);
      console.error("Provider login error:", error);
    }
  };

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
      handleProviderLogin(new GoogleAuthProvider());
    });
  }

  if (githubLoginBtn) {
    githubLoginBtn.addEventListener("click", () => {
      handleProviderLogin(new GithubAuthProvider());
    });
  }

  // Note: Social login buttons now work for both login and signup
  // The same buttons handle both cases automatically

  // Forgot Password
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("forgotPasswordEmail").value;

      try {
        // Show loading state
        const submitBtn = forgotPasswordForm.querySelector(".auth-submit-btn");
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;

        await sendPasswordResetEmail(auth, email);

        socialAuth.showToast(
          "Password reset email sent! Check your inbox.",
          "success"
        );

        // Switch back to login form
        forgotPasswordForm.style.display = "none";
        loginForm.style.display = "block";
        authModalTitle.textContent = "Login";
      } catch (error) {
        console.error("Password reset error:", error);
        let errorMessage = "Failed to send reset email. Please try again.";
        if (error.code === "auth/user-not-found") {
          errorMessage = "No account found with this email address.";
        }
        socialAuth.showToast(errorMessage, "error");
      } finally {
        // Reset button state
        const submitBtn = forgotPasswordForm.querySelector(".auth-submit-btn");
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Sign Up
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("signUpEmail").value;
      const password = document.getElementById("signUpPassword").value;

      try {
        // Show loading state
        const submitBtn = signUpForm.querySelector(".auth-submit-btn");
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Creating Account...";
        submitBtn.disabled = true;

        // Check if reCAPTCHA is available (optional for development)
        if (typeof grecaptcha !== "undefined" && grecaptcha.enterprise) {
          grecaptcha.enterprise.ready(async () => {
            const token = await grecaptcha.enterprise.execute(
              "6Ldt0YYrAAAAAKyNgAPO8Te96_m5innDHsSkppQc",
              { action: "SIGNUP" }
            );
            console.log("reCAPTCHA token (Sign Up):", token);
          });
        } else {
          console.log(
            "reCAPTCHA not available, proceeding without verification (development mode)"
          );
        }

        // Create the user account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        console.log("User created:", user.uid);

        // Create user profile in Firestore
        const newUserProfile = {
          name: email.split("@")[0],
          bio: "A new user ready to create amazing things.",
          lvl: "LVL • 1",
          type: "TYPE • NEWB",
          role: "ROLE • USER",
          photoURL: defaultProfile.photoURL,
          email: email,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };

        console.log("Creating user profile in Firestore...");
        await setDoc(doc(db, "users", user.uid), newUserProfile);
        console.log("User profile created in Firestore");

        // Create widget slots in Storage (only if storage is available)
        try {
          console.log("Creating widget slots in Storage...");
          const placeholderHtml = new Blob(
            [
              `<html>
              <head><title>Widget Placeholder</title></head>
              <body style='display:flex;align-items:center;justify-content:center;height:100vh;background:#222;color:#fff;font-family:Arial,sans-serif;'>
                <div style='text-align:center;'>
                  <h2>Widget Placeholder</h2>
                  <p>This is a placeholder widget.</p>
                  <p>Upload your files to replace this!</p>
                  <img src='https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif' alt='Placeholder' style='max-width:200px;border-radius:10px;'/>
                </div>
              </body>
            </html>`,
            ],
            { type: "text/html" }
          );

          // Create widget slots
          for (let i = 1; i <= 3; i++) {
            const storageRef = ref(
              storage,
              `users/${user.uid}/app-widget-${i}/index.html`
            );
            await uploadBytes(storageRef, placeholderHtml);
            console.log(`Created widget slot ${i}`);
          }
          console.log("All widget slots created successfully");
        } catch (storageError) {
          console.warn(
            "Storage setup failed (this is okay for now):",
            storageError
          );
          // Don't fail the signup if storage fails
        }

        // Create initial notifications
        try {
          await socialAuth.createNotification(user.uid, {
            type: "system",
            title: "Welcome to inque! 🎉",
            message:
              "Your account has been created successfully. Start by uploading your first widget!",
            icon: "🎉",
          });
        } catch (notificationError) {
          console.warn(
            "Failed to create welcome notification:",
            notificationError
          );
        }

        console.log("Signup completed successfully!");

        // Close the auth modal
        const authModal = document.getElementById("authModal");
        if (authModal) {
          authModal.style.display = "none";
          document.body.style.overflow = "";
        }

        // Show success message
        socialAuth.showToast(
          "Account created successfully! Welcome to inque! 🎉",
          "success",
          5000
        );

        // The auth state change will be handled by onAuthStateChanged
        // which will trigger the ProfileHub and home section updates
      } catch (error) {
        console.error("Signup error:", error);

        // Provide user-friendly error messages
        let errorMessage = "Signup failed. Please try again.";
        if (error.code === "auth/email-already-in-use") {
          errorMessage =
            "This email is already registered. Please try logging in instead.";
        } else if (error.code === "auth/weak-password") {
          errorMessage =
            "Password is too weak. Please choose a stronger password.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "Please enter a valid email address.";
        }

        socialAuth.showToast(errorMessage, "error", 5000);
      } finally {
        // Reset button state
        const submitBtn = signUpForm.querySelector(".auth-submit-btn");
        submitBtn.textContent = "Create Account";
        submitBtn.disabled = false;
      }
    });
  }
  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Check if reCAPTCHA is available (optional for development)
      if (typeof grecaptcha !== "undefined" && grecaptcha.enterprise) {
        grecaptcha.enterprise.ready(async () => {
          const token = await grecaptcha.enterprise.execute(
            "6Ldt0YYrAAAAAKyNgAPO8Te96_m5innDHsSkppQc",
            { action: "LOGIN" }
          );
          console.log("reCAPTCHA token (Login):", token);
          performLogin();
        });
      } else {
        console.log(
          "reCAPTCHA not available, proceeding without verification (development mode)"
        );
        performLogin();
      }

      function performLogin() {
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            console.log("Logged in:", userCredential.user);
          })
          .catch((error) => {
            alert(error.message);
            console.error("Login error:", error);
          });
      }
    });
  }

  // Logout
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          console.log("User signed out.");
        })
        .catch((error) => {
          console.error("Sign out error:", error);
        });
    });
  }

  // Mark All Read Button Event Listener
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", () => {
      if (auth.currentUser) {
        socialAuth.markAllNotificationsAsRead(auth.currentUser.uid);
        socialAuth.showToast("All notifications marked as read!", "success");
      } else {
        socialAuth.showToast(
          "Please log in to mark all notifications as read.",
          "info"
        );
      }
    });
  }

  // Forgot Password Link
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Forgot password link clicked");

      // Switch to forgot password form
      loginForm.style.display = "none";
      signUpForm.style.display = "none";
      forgotPasswordForm.style.display = "block";
      authModalTitle.textContent = "Reset Password";
    });
  }

  // Quick Actions Event Listeners
  const quickActionBtns = document.querySelectorAll(".quick-action-btn");
  quickActionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      console.log("Quick action clicked:", action);

      // Close sidebar when opening modals
      const closeSidebar = () => {
        // Use the global sidebar handler if available, otherwise fall back to direct manipulation
        if (window.sidebarHandler) {
          window.sidebarHandler.closeSidebar();
        } else {
          const sidebar = document.querySelector(".sidebar-nav");
          const overlay = document.querySelector(".sidebar-overlay");
          if (sidebar && overlay) {
            sidebar.classList.remove("open");
            overlay.classList.remove("show");
            document.body.style.overflow = "";
          }
        }
      };

      switch (action) {
        case "newWidget":
          socialAuth.showToast("Opening Widget Studio...", "info");
          closeSidebar(); // Close sidebar before opening modal
          // Use global function to open Widget Studio modal
          if (window.openWidgetStudio) {
            window.openWidgetStudio();
            console.log(
              "[QUICK ACTION] Widget Studio modal opened successfully"
            );
          } else {
            socialAuth.showToast("Widget Studio not available", "error");
          }
          break;
        case "shareProfile":
          closeSidebar(); // Close sidebar before sharing
          if (navigator.share) {
            navigator.share({
              title: "Check out my profile!",
              url: window.location.href,
            });
          } else {
            navigator.clipboard.writeText(window.location.href);
            socialAuth.showToast("Profile URL copied to clipboard!", "success");
          }
          break;
        case "settings":
          closeSidebar(); // Close sidebar before opening settings
          socialAuth.showToast("Settings panel opening...", "info");
          break;
        case "testNotifications":
          closeSidebar(); // Close sidebar before testing
          if (auth.currentUser) {
            socialAuth.showToast(
              "Test notifications feature coming soon!",
              "info"
            );
          } else {
            socialAuth.showToast(
              "Please log in to test notifications.",
              "info"
            );
          }
          break;

        case "openChatbot":
          closeSidebar(); // Close sidebar before opening chatbot
          socialAuth.showToast("Opening AI Assistant...", "info");
          // Open chatbot modal
          if (typeof openChatbot === "function") {
            openChatbot();
            console.log("[QUICK ACTION] AI Assistant opened successfully");
          } else {
            socialAuth.showToast("AI Assistant not available", "error");
            console.error("[QUICK ACTION] openChatbot function not found");
          }
          break;
        default:
          socialAuth.showToast(
            `Action "${action}" not implemented yet.`,
            "warning"
          );
      }
    });
  });
});
