// Main entry point for the enhanced inque social app
// This script imports and initializes all core functionality

// Debug logging utility for main entry point
const DEBUG = {
  log: (message, data = null) => {
    console.log(`[MAIN DEBUG] ${message}`, data || "");
  },
  error: (message, error = null) => {
    console.error(`[MAIN DEBUG ERROR] ${message}`, error || "");
  },
  warn: (message, data = null) => {
    console.warn(`[MAIN DEBUG WARN] ${message}`, data || "");
  },
};

DEBUG.log("Starting enhanced inque social app initialization");

// Global state management for preventing duplicate notifications
window.authState = {
  isInitialized: false,
  lastLoginTime: null,
  hasShownWelcome: false,
  currentUser: null,
};

// Import core Firebase functionality
DEBUG.log("Importing firebase-core.js");
try {
  import("./core/firebase-core.js")
    .then((core) => {
      // Expose Firestore db globally for non-module callers
      if (core && core.db) {
        window.db = core.db;
        DEBUG.log("firebase-core.js imported successfully (db exposed)");
      } else {
        DEBUG.warn("firebase-core.js imported but db was not found in exports");
      }
    })
    .catch((error) => {
      DEBUG.error("Failed to import firebase-core.js", error);
    });
} catch (error) {
  DEBUG.error("Error importing firebase-core.js", error);
}

// Import enhanced auth system
DEBUG.log("Importing enhanced auth system");
try {
  import("./scripts/auth/auth.js")
    .then(() => {
      DEBUG.log("Enhanced auth system imported successfully");
    })
    .catch((error) => {
      DEBUG.error("Failed to import enhanced auth system", error);
    });
} catch (error) {
  DEBUG.error("Error importing enhanced auth system", error);
}

// Import enhanced widget upload system
DEBUG.log("Importing enhanced widget upload system");
try {
  import("./scripts/widgets/widget-upload.js")
    .then(() => {
      DEBUG.log("Enhanced widget upload system imported successfully");
    })
    .catch((error) => {
      DEBUG.error("Failed to import enhanced widget upload system", error);
    });
} catch (error) {
  DEBUG.error("Error importing enhanced widget upload system", error);
}

// Import Firestore functions for profile updates
DEBUG.log("Importing Firestore functions");
try {
  import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js")
    .then((firestore) => {
      window.firestore = firestore;
      DEBUG.log("Firestore functions imported successfully");
    })
    .catch((error) => {
      DEBUG.error("Failed to import Firestore functions", error);
    });
} catch (error) {
  DEBUG.error("Error importing Firestore functions", error);
}

// Import social features
DEBUG.log("Importing social features");
try {
  import("./scripts/social/social-features.js")
    .then(() => {
      DEBUG.log("Social features imported successfully");
    })
    .catch((error) => {
      DEBUG.error("Failed to import social features", error);
    });
} catch (error) {
  DEBUG.error("Error importing social features", error);
}

// Note: widget-display and timeline-manager are loaded via script tags in index.html

// Enhanced initialization with feature detection
document.addEventListener("DOMContentLoaded", async () => {
  DEBUG.log("DOM Content Loaded - Starting enhanced initialization");

  try {
    // Initialize authentication modal functionality
    initializeAuthModal();

    // Initialize password visibility toggles
    initializePasswordToggles();

    // Initialize form validation
    initializeFormValidation();

    // Initialize social interactions
    initializeSocialInteractions();

    // Initialize social stats manager
    await socialStatsManager.init();

    // Initialize enhanced UI features
    initializeEnhancedUI();

    // Initialize auth state tracking
    initializeAuthStateTracking();

    // Initialize additional modals
    initializeAdditionalModals();

    // Initialize header quick actions and sidebar login bindings
    initializeHeaderQuickActions();

    DEBUG.log("Enhanced initialization completed successfully");

    // Show welcome message for new users (only once per session)
    showWelcomeMessage();
  } catch (error) {
    DEBUG.error("Error during enhanced initialization", error);
  }
});

// Initialize authentication modal functionality
function initializeAuthModal() {
  DEBUG.log("Initializing authentication modal functionality");

  // DOM Elements for Auth Modal
  const authModal = document.getElementById("authModal");
  const authCloseBtn = document.querySelector(".auth-close-button");
  const loginForm = document.getElementById("loginForm");
  const signUpForm = document.getElementById("signUpForm");
  const showSignUp = document.getElementById("showSignUp");
  const showLogin = document.getElementById("showLogin");
  const showLoginFromForgot = document.getElementById("showLoginFromForgot");
  const authModalTitle = document.getElementById("authModalTitle");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");

  if (!authModal || !authCloseBtn || !loginForm || !signUpForm) {
    DEBUG.warn("Some auth modal elements not found", {
      authModal: !!authModal,
      authCloseBtn: !!authCloseBtn,
      loginForm: !!loginForm,
      signUpForm: !!signUpForm,
    });
    return;
  }

  // Toggle forms
  if (showSignUp) {
    showSignUp.addEventListener("click", (e) => {
      e.preventDefault();
      DEBUG.log("Switching to sign up form");
      loginForm.style.display = "none";
      signUpForm.style.display = "block";
      forgotPasswordForm.style.display = "none";
      authModalTitle.textContent = "Sign Up";
    });
  }

  if (showLogin) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      DEBUG.log("Switching to login form");
      signUpForm.style.display = "none";
      loginForm.style.display = "block";
      forgotPasswordForm.style.display = "none";
      authModalTitle.textContent = "Login";
    });
  }

  if (showLoginFromForgot) {
    showLoginFromForgot.addEventListener("click", (e) => {
      e.preventDefault();
      DEBUG.log("Switching from forgot password to login form");
      forgotPasswordForm.style.display = "none";
      loginForm.style.display = "block";
      authModalTitle.textContent = "Login";
    });
  }

  // Forgot password link
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      DEBUG.log("Switching to forgot password form");
      loginForm.style.display = "none";
      signUpForm.style.display = "none";
      forgotPasswordForm.style.display = "block";
      authModalTitle.textContent = "Reset Password";
    });
  }

  // Open/Close Modal
  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", () => {
      DEBUG.log("Closing auth modal");
      authModal.style.display = "none";
      document.body.style.overflow = "";
    });
  }

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === authModal) {
      DEBUG.log("Closing auth modal via outside click");
      authModal.style.display = "none";
      document.body.style.overflow = "";
    }
  });

  // Close modal on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && authModal.style.display === "block") {
      DEBUG.log("Closing auth modal via escape key");
      authModal.style.display = "none";
      document.body.style.overflow = "";
    }
  });

  DEBUG.log("Authentication modal functionality initialized");
}

// Initialize auth state tracking to prevent duplicate notifications
function initializeAuthStateTracking() {
  DEBUG.log("Initializing auth state tracking");

  // Listen for auth state changes from the auth system
  window.addEventListener("auth-state-changed", (event) => {
    const { user, isNewLogin } = event.detail;

    DEBUG.log("Auth state change event received", {
      userId: user?.uid,
      isNewLogin,
      currentState: window.authState.isInitialized,
    });

    if (user && !window.authState.isInitialized) {
      // First time login in this session
      window.authState.isInitialized = true;
      window.authState.currentUser = user;
      window.authState.lastLoginTime = Date.now();

      if (isNewLogin) {
        // Only show welcome message for actual new logins, not page refreshes
        window.authState.hasShownWelcome = true;
        DEBUG.log("New login detected, will show welcome message");
      }
    } else if (!user) {
      // User logged out
      window.authState.isInitialized = false;
      window.authState.currentUser = null;
      window.authState.lastLoginTime = null;
      window.authState.hasShownWelcome = false;
      DEBUG.log("User logged out, reset auth state");
    }
  });

  DEBUG.log("Auth state tracking initialized");
}

// Initialize additional modals (Widget Studio, Edit Profile)
function initializeAdditionalModals() {
  DEBUG.log("Initializing additional modals");

  // Widget Studio Modal
  const widgetStudioModal = document.getElementById("widgetStudioModal");
  const widgetStudioCloseBtn = document.querySelector(
    ".widget-studio-close-button"
  );

  if (widgetStudioModal && widgetStudioCloseBtn) {
    // Close button
    widgetStudioCloseBtn.addEventListener("click", () => {
      DEBUG.log("Closing Widget Studio modal");
      widgetStudioModal.style.display = "none";
      document.body.style.overflow = "";
    });

    // Close on outside click
    window.addEventListener("click", (e) => {
      if (e.target === widgetStudioModal) {
        DEBUG.log("Closing Widget Studio modal via outside click");
        widgetStudioModal.style.display = "none";
        document.body.style.overflow = "";
      }
    });

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && widgetStudioModal.style.display === "block") {
        DEBUG.log("Closing Widget Studio modal via escape key");
        widgetStudioModal.style.display = "none";
        document.body.style.overflow = "";
      }
    });

    // File upload functionality
    const widgetFileInput = document.getElementById("widgetFileInput");
    const uploadedFiles = document.getElementById("uploadedFiles");
    const createWidgetBtn = document.getElementById("createWidgetBtn");

    if (widgetFileInput && uploadedFiles && createWidgetBtn) {
      widgetFileInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        DEBUG.log("Widget files selected", { count: files.length });

        // Clear previous files
        uploadedFiles.innerHTML = "";

        // Display selected files with better formatting
        files.forEach((file) => {
          const fileItem = document.createElement("div");
          fileItem.className = "file-item";
          fileItem.style.cssText =
            "display: flex; align-items: center; gap: 10px; padding: 12px; background: rgba(0, 240, 255, 0.1); border-radius: 8px; border: 1px solid rgba(0, 240, 255, 0.2); margin-bottom: 8px;";

          const fileIcon = getFileIcon(file.name);
          fileItem.innerHTML = `
            <span style="font-size: 1.2rem;">${fileIcon}</span>
            <span style="flex: 1; color: var(--text-light); font-weight: 500;">${file.name}</span>
            <span style="color: var(--primary-color); font-size: 0.9rem; font-weight: 600;">${(file.size / 1024).toFixed(1)} KB</span>
          `;
          uploadedFiles.appendChild(fileItem);
        });

        // Show success message
        window.showToast(
          `${files.length} file${files.length > 1 ? "s" : ""} selected successfully! 📁`,
          "success"
        );

        // Helper function to get file icons
        function getFileIcon(filename) {
          const ext = filename.split(".").pop().toLowerCase();
          const iconMap = {
            html: "🌐",
            css: "🎨",
            js: "⚡",
            png: "🖼️",
            jpg: "🖼️",
            jpeg: "🖼️",
            gif: "🖼️",
            svg: "🖼️",
            json: "📋",
            txt: "📄",
            md: "📝",
          };
          return iconMap[ext] || "📁";
        }

        // Enable create button if files are selected
        createWidgetBtn.disabled = files.length === 0;
      });

      // Create widget button
      createWidgetBtn.addEventListener("click", async () => {
        DEBUG.log("Create widget button clicked");

        try {
          const files = Array.from(widgetFileInput.files);
          if (files.length === 0) {
            window.showToast(
              "Please select files to create a widget",
              "warning"
            );
            return;
          }

          // Show loading state
          createWidgetBtn.disabled = true;
          createWidgetBtn.innerHTML =
            '<span class="btn-loader">Creating...</span>';

          // Simulate widget creation process (replace with actual logic)
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Success notification
          window.showToast("Widget created successfully! 🎉", "success");

          // Reset form
          widgetFileInput.value = "";
          uploadedFiles.innerHTML = "";
          createWidgetBtn.disabled = true;

          // Close modal after success
          setTimeout(() => {
            const widgetStudioModal =
              document.getElementById("widgetStudioModal");
            if (widgetStudioModal) {
              widgetStudioModal.style.display = "none";
              document.body.style.overflow = "";
            }
          }, 1500);

          DEBUG.log("Widget created successfully");
        } catch (error) {
          DEBUG.error("Failed to create widget", error);
          window.showToast(
            "Failed to create widget: " + error.message,
            "error"
          );
        } finally {
          // Reset button state
          createWidgetBtn.disabled = false;
          createWidgetBtn.innerHTML = "Create Widget";
        }
      });
    }

    DEBUG.log("Widget Studio modal initialized");
  }

  // Edit Profile Modal
  const editProfileModal = document.getElementById("editProfileModal");
  const editProfileCloseBtn = document.querySelector(
    ".edit-profile-close-button"
  );
  const editProfileForm = document.getElementById("editProfileForm");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (editProfileModal && editProfileCloseBtn) {
    // Close button
    editProfileCloseBtn.addEventListener("click", () => {
      DEBUG.log("Closing Edit Profile modal");
      editProfileModal.style.display = "none";
      document.body.style.overflow = "";
    });

    // Cancel button
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", () => {
        DEBUG.log("Canceling profile edit");
        editProfileModal.style.display = "none";
        document.body.style.overflow = "";
      });
    }

    // Close on outside click
    window.addEventListener("click", (e) => {
      if (e.target === editProfileModal) {
        DEBUG.log("Closing Edit Profile modal via outside click");
        editProfileModal.style.display = "none";
        document.body.style.overflow = "";
      }
    });

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && editProfileModal.style.display === "block") {
        DEBUG.log("Closing Edit Profile modal via escape key");
        editProfileModal.style.display = "none";
        document.body.style.overflow = "";
      }

      // Enter key on form submission
      if (
        e.key === "Enter" &&
        e.ctrlKey &&
        editProfileModal.style.display === "block"
      ) {
        e.preventDefault();
        DEBUG.log("Form submission triggered via Ctrl+Enter");
        editProfileForm.dispatchEvent(new Event("submit"));
      }
    });

    // Form submission
    if (editProfileForm) {
      editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        DEBUG.log("Edit profile form submitted");

        // Get form elements
        const saveBtn = editProfileForm.querySelector(".save-btn");
        const originalBtnText = saveBtn.textContent;

        // Show loading state
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="btn-loader">Saving...</span>';

        try {
          const formData = new FormData(editProfileForm);
          const displayName = document.getElementById("editDisplayName").value;
          const bio = document.getElementById("editBio").value;
          const twitter = document.getElementById("editTwitter").value;
          const instagram = document.getElementById("editInstagram").value;
          const github = document.getElementById("editGithub").value;
          const website = document.getElementById("editWebsite").value;

          // Get current user
          if (!window.authState || !window.authState.currentUser) {
            window.showToast("Please log in to update your profile", "error");
            return;
          }

          // Update profile in Firestore
          if (
            window.firestore &&
            window.firestore.doc &&
            window.firestore.updateDoc
          ) {
            const userRef = window.firestore.doc(
              db,
              "users",
              window.authState.currentUser.uid
            );
            await window.firestore.updateDoc(userRef, {
              name: displayName,
              bio: bio,
              socialLinks: {
                twitter: twitter,
                instagram: instagram,
                github: github,
                website: website,
              },
              updatedAt: new Date(),
            });
          } else {
            throw new Error("Firestore functions not available");
          }

          // Update local state
          if (window.authState.currentUser) {
            window.authState.currentUser.displayName = displayName;
          }

          // Show success notification with more details
          window.showToast(
            `Profile updated successfully! Welcome back, ${displayName}! ✨`,
            "success"
          );

          // Close modal after success
          editProfileModal.style.display = "none";
          document.body.style.overflow = "";

          // Update profile display in header if it exists
          const profileNameElement = document.querySelector(".profile-name");
          if (profileNameElement) {
            profileNameElement.textContent = displayName;
          }

          DEBUG.log("Profile updated successfully", { displayName, bio });
        } catch (error) {
          DEBUG.error("Failed to update profile", error);
          window.showToast(
            "Failed to update profile: " + error.message,
            "error"
          );
        } finally {
          // Reset button state
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalBtnText;
        }
      });
    }

    // Photo preview functionality
    const editPhotoInput = document.getElementById("editPhoto");
    const photoPreview = document.getElementById("photoPreview");

    if (editPhotoInput && photoPreview) {
      editPhotoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            photoPreview.innerHTML = `<img src="${e.target.result}" alt="Profile preview" style="max-width: 100px; border-radius: 50%;" />`;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    DEBUG.log("Edit Profile modal initialized");
  }

  // Global function to open Widget Studio modal
  window.openWidgetStudio = function () {
    DEBUG.log("Opening Widget Studio modal");
    if (widgetStudioModal) {
      DEBUG.log("Widget Studio modal found, opening...");
      widgetStudioModal.style.display = "block";
      document.body.style.overflow = "hidden";
      DEBUG.log("Widget Studio modal opened successfully");
    } else {
      DEBUG.error("Widget Studio modal not found");
      console.error("Widget Studio modal element not found in DOM");
    }
  };

  // Global function to open Edit Profile modal
  window.openEditProfile = function () {
    DEBUG.log("Opening Edit Profile modal");
    if (editProfileModal) {
      DEBUG.log("Edit Profile modal found, opening...");
      editProfileModal.style.display = "block";
      document.body.style.overflow = "hidden";

      // Populate form with current user data
      const editDisplayName = document.getElementById("editDisplayName");
      const editBio = document.getElementById("editBio");

      if (editDisplayName && window.authState && window.authState.currentUser) {
        // Populate with current user data
        editDisplayName.value = window.authState.currentUser.displayName || "";
        DEBUG.log("Populated form with user data");
      } else {
        DEBUG.log("No user data available for form population");
      }

      DEBUG.log("Edit Profile modal opened successfully");
    } else {
      DEBUG.error("Edit Profile modal not found");
      console.error("Edit Profile modal element not found in DOM");
    }
  };

  DEBUG.log("Additional modals initialization completed");

  // Debug function to check modal status
  window.debugModals = function () {
    DEBUG.log("=== MODAL DEBUG INFO ===");
    DEBUG.log("Widget Studio Modal:", {
      element: !!widgetStudioModal,
      display: widgetStudioModal ? widgetStudioModal.style.display : "N/A",
      id: widgetStudioModal ? widgetStudioModal.id : "N/A",
    });
    DEBUG.log("Edit Profile Modal:", {
      element: !!editProfileModal,
      display: editProfileModal ? editProfileModal.style.display : "N/A",
      id: editProfileModal ? editProfileModal.id : "N/A",
    });
    DEBUG.log("Global functions:", {
      openWidgetStudio: typeof window.openWidgetStudio,
      openEditProfile: typeof window.openEditProfile,
    });
    DEBUG.log("=== END MODAL DEBUG ===");
  };
}

// Initialize password visibility toggles
function initializePasswordToggles() {
  const passwordToggles = document.querySelectorAll(".password-toggle");

  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const input = toggle.previousElementSibling;
      const type = input.type === "password" ? "text" : "password";
      input.type = type;
      toggle.textContent = type === "password" ? "👁️" : "🙈";
      DEBUG.log("Password visibility toggled", { type });
    });
  });

  DEBUG.log("Password toggles initialized");
}

// Initialize form validation
function initializeFormValidation() {
  // Username availability check
  const usernameInput = document.getElementById("signUpUsername");
  if (usernameInput) {
    let timeout;
    usernameInput.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        checkUsernameAvailability(usernameInput.value);
      }, 500);
    });
  }

  // Password strength indicator
  const passwordInput = document.getElementById("signUpPassword");
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      updatePasswordStrength(passwordInput.value);
    });
  }

  // Confirm password validation
  const confirmPasswordInput = document.getElementById("confirmPassword");
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", () => {
      validatePasswordConfirmation();
    });
  }

  DEBUG.log("Form validation initialized");
}

// Check username availability
async function checkUsernameAvailability(username) {
  const availabilityDiv = document.getElementById("usernameAvailability");
  if (!availabilityDiv || !username) return;

  availabilityDiv.className = "username-availability checking";
  availabilityDiv.textContent = "Checking availability...";

  try {
    // Simulate API call (replace with actual Firebase query)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo purposes, assume usernames with 'test' are taken
    const isAvailable = !username.toLowerCase().includes("test");

    availabilityDiv.className = `username-availability ${
      isAvailable ? "available" : "unavailable"
    }`;
    availabilityDiv.textContent = isAvailable
      ? "Username available"
      : "Username taken";

    DEBUG.log("Username availability checked", { username, isAvailable });
  } catch (error) {
    availabilityDiv.className = "username-availability unavailable";
    availabilityDiv.textContent = "Error checking availability";
    DEBUG.error("Username availability check failed", error);
  }
}

// Update password strength indicator
function updatePasswordStrength(password) {
  const strengthDiv = document.getElementById("passwordStrength");
  if (!strengthDiv) return;

  let strength = 0;
  let feedback = "";

  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const strengthClasses = ["weak", "medium", "strong", "very-strong"];
  const strengthTexts = ["Weak", "Medium", "Strong", "Very Strong"];

  strengthDiv.className = `password-strength ${
    strengthClasses[Math.min(strength - 1, 3)]
  }`;

  strengthDiv.textContent = strengthTexts[Math.min(strength - 1, 3)] || "Weak";
}

// Validate password confirmation
function validatePasswordConfirmation() {
  const passwordInput = document.getElementById("signUpPassword");
  const confirmInput = document.getElementById("confirmPassword");
  const submitBtn = document.getElementById("signUpSubmitBtn");

  if (!passwordInput || !confirmInput || !submitBtn) return;

  const passwordsMatch = passwordInput.value === confirmInput.value;
  submitBtn.disabled = !passwordsMatch;

  if (confirmInput.value && !passwordsMatch) {
    confirmInput.style.borderColor = "#f44336";
  } else {
    confirmInput.style.borderColor = "";
  }
}

// Initialize social interactions
function initializeSocialInteractions() {
  // Follow/Unfollow buttons
  document.addEventListener("click", (e) => {
    if (e.target.matches(".follow-btn")) {
      e.preventDefault();
      const userId = e.target.dataset.userId;
      const isFollowing = e.target.dataset.following === "true";

      // Update button state immediately for better UX
      e.target.dataset.following = (!isFollowing).toString();
      e.target.textContent = isFollowing ? "Follow" : "Following";
      e.target.className = isFollowing ? "follow-btn" : "follow-btn following";

      DEBUG.log("Follow button clicked", { userId, isFollowing });
    }
  });

  // Like/Unlike buttons
  document.addEventListener("click", (e) => {
    if (e.target.matches(".like-btn")) {
      e.preventDefault();
      const widgetId = e.target.dataset.widgetId;
      const isLiked = e.target.dataset.liked === "true";

      // Update button state immediately for better UX
      e.target.dataset.liked = (!isLiked).toString();
      e.target.innerHTML = isLiked ? "🤍 Like" : "❤️ Liked";
      e.target.className = isLiked ? "like-btn" : "like-btn liked";

      DEBUG.log("Like button clicked", { widgetId, isLiked });
    }
  });

  // Social action buttons
  document.addEventListener("click", (e) => {
    if (e.target.matches("#editProfileSocialBtn")) {
      e.preventDefault();
      DEBUG.log("Edit profile social button clicked");
      if (window.openEditProfile) {
        window.openEditProfile();
      }
    }

    if (e.target.matches("#shareProfileBtn")) {
      e.preventDefault();
      DEBUG.log("Share profile button clicked");
      shareUserProfile();
    }

    if (e.target.matches("#viewActivityBtn")) {
      e.preventDefault();
      DEBUG.log("View activity button clicked");
      showUserActivity();
    }
  });

  DEBUG.log("Social interactions initialized");
}

// Social stats management
let socialStatsManager = {
  currentUser: null,
  socialFeatures: null,
  debugMode: true,

  async init() {
    DEBUG.log("Initializing social stats manager");

    try {
      // Wait for social features to be available
      await this.waitForSocialFeatures();

      // Setup auth state listener
      this.setupAuthListener();

      DEBUG.log("Social stats manager initialized successfully");
    } catch (error) {
      DEBUG.error("Failed to initialize social stats manager", error);
    }
  },

  async waitForSocialFeatures() {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      if (window.socialFeatures) {
        this.socialFeatures = window.socialFeatures;
        DEBUG.log("Social features found for stats manager", { attempts });
        return;
      }

      if (this.debugMode) {
        console.log(
          `[SOCIAL STATS] Waiting for social features... attempt ${attempts + 1}/${maxAttempts}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    throw new Error("Social features not available after maximum attempts");
  },

  setupAuthListener() {
    // Listen for auth state changes
    document.addEventListener("authStateChanged", async (event) => {
      DEBUG.log(
        "Auth state changed event received in stats manager",
        event.detail
      );
      await this.handleAuthStateChange(event.detail);
    });

    // Also check current auth state
    if (window.authState && window.authState.currentUser) {
      this.handleAuthStateChange(window.authState.currentUser);
    }
  },

  async handleAuthStateChange(user) {
    DEBUG.log("Handling auth state change in stats manager", {
      userId: user?.uid,
    });

    if (user) {
      this.currentUser = user;
      await this.loadAndDisplaySocialData(user.uid);
      this.showSocialElements(true);
    } else {
      this.currentUser = null;
      this.showSocialElements(false);
      this.clearSocialData();
    }
  },

  async loadAndDisplaySocialData(userId) {
    try {
      DEBUG.log("Loading social data for user", userId);

      // Load user's social data
      await this.socialFeatures.loadUserSocialData(userId);

      // Get additional user stats
      const userStats = await this.getUserStats(userId);

      // Update UI with social data
      this.updateSocialStats(userStats);

      DEBUG.log("Social data loaded and displayed successfully");
    } catch (error) {
      DEBUG.error("Failed to load social data", error);
    }
  },

  async getUserStats(userId) {
    try {
      const { db } = await import("./core/firebase-core.js");
      const { doc, getDoc, collection, query, where, getDocs } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Get user document
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Get user's widgets count
      const widgetsQuery = query(
        collection(db, "widgets"),
        where("userId", "==", userId)
      );
      const widgetsSnapshot = await getDocs(widgetsQuery);
      const widgetsCount = widgetsSnapshot.size;

      // Get total likes across all user's widgets
      let totalLikes = 0;
      widgetsSnapshot.forEach((doc) => {
        const widgetData = doc.data();
        totalLikes += widgetData.stats?.likes || 0;
      });

      return {
        followers: this.socialFeatures.followers.size,
        following: this.socialFeatures.following.size,
        widgets: widgetsCount,
        likes: totalLikes,
        displayName: userData.displayName || "User",
        bio: userData.bio || "",
      };
    } catch (error) {
      DEBUG.error("Failed to get user stats", error);
      return {
        followers: 0,
        following: 0,
        widgets: 0,
        likes: 0,
        displayName: "User",
        bio: "",
      };
    }
  },

  updateSocialStats(stats) {
    DEBUG.log("Updating social stats in UI", stats);

    // Update follower count
    const followersElement = document.getElementById("profileFollowers");
    if (followersElement) {
      followersElement.textContent = stats.followers;
    }

    // Update following count
    const followingElement = document.getElementById("profileFollowing");
    if (followingElement) {
      followingElement.textContent = stats.following;
    }

    // Update widgets count
    const widgetsElement = document.getElementById("profileWidgets");
    if (widgetsElement) {
      widgetsElement.textContent = stats.widgets;
    }

    // Update likes count
    const likesElement = document.getElementById("profileLikes");
    if (likesElement) {
      likesElement.textContent = stats.likes;
    }

    // Update profile name and bio if available
    if (stats.displayName && stats.displayName !== "User") {
      const profileNameElement = document.getElementById("profileName");
      if (profileNameElement) {
        profileNameElement.textContent = stats.displayName;
      }
    }

    if (stats.bio) {
      const profileBioElement = document.getElementById("profileBio");
      if (profileBioElement) {
        profileBioElement.textContent = stats.bio;
      }
    }
  },

  showSocialElements(show) {
    const socialStats = document.getElementById("profileSocialStats");
    const socialActions = document.getElementById("profileSocialActions");

    if (socialStats) {
      socialStats.style.display = show ? "flex" : "none";
    }

    if (socialActions) {
      socialActions.style.display = show ? "flex" : "none";
    }
  },

  clearSocialData() {
    DEBUG.log("Clearing social data from UI");

    const elements = [
      "profileFollowers",
      "profileFollowing",
      "profileWidgets",
      "profileLikes",
    ];
    elements.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = "0";
      }
    });
  },
};

// Helper functions for social actions
async function shareUserProfile() {
  try {
    if (!socialStatsManager.currentUser) {
      window.showToast("Please log in to share your profile", "error");
      return;
    }

    const profileUrl = `${window.location.origin}/profile/${socialStatsManager.currentUser.uid}`;
    const shareText = `Check out my profile on inque!`;

    if (navigator.share) {
      await navigator.share({
        title: "My inque Profile",
        text: shareText,
        url: profileUrl,
      });
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${profileUrl}`);
      window.showToast("Profile link copied to clipboard!", "success");
    }

    DEBUG.log("Profile shared successfully");
  } catch (error) {
    DEBUG.error("Failed to share profile", error);
    window.showToast("Failed to share profile", "error");
  }
}

function showUserActivity() {
  DEBUG.log("Showing user activity");
  // You can implement this to show user's recent activity
  window.showToast(
    "Activity feature coming soon! Check back for updates.",
    "info"
  );
}

// Test function for social features (call from browser console)
window.testSocialFeatures = function () {
  DEBUG.log("Testing social features...");
  console.log("Social Stats Manager:", socialStatsManager);
  console.log("Window Social Features:", window.socialFeatures);
  console.log("Social Stats Elements:", {
    followers: document.getElementById("profileFollowers"),
    following: document.getElementById("profileFollowing"),
    widgets: document.getElementById("profileWidgets"),
    likes: document.getElementById("profileLikes"),
    socialStats: document.getElementById("profileSocialStats"),
    socialActions: document.getElementById("profileSocialActions"),
  });

  if (socialStatsManager.currentUser) {
    console.log("Current User:", socialStatsManager.currentUser);
  } else {
    console.log("No current user - try logging in first");
  }
};

// Initialize enhanced UI features
function initializeEnhancedUI() {
  // Enhanced modal animations
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.addEventListener("show.bs.modal", () => {
      modal.querySelector(".modal-content").style.animation =
        "slideInUp 0.3s ease-out";
    });
  });

  // Enhanced form animations
  const forms = document.querySelectorAll(".auth-form");
  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const submitBtn = form.querySelector(".auth-submit-btn");
      if (submitBtn) {
        submitBtn.classList.add("loading");
        submitBtn.querySelector(".btn-text").style.display = "none";
        submitBtn.querySelector(".btn-loader").style.display = "inline-block";
      }
    });
  });

  // Enhanced toast notifications
  window.showToast = function (message, type = "info", duration = 5000) {
    DEBUG.log(`Showing toast notification: ${type} - ${message}`);

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    const container =
      document.getElementById("toast-container") || document.body;

    if (!document.getElementById("toast-container")) {
      DEBUG.warn("Toast container not found, appending to body");
    }

    container.appendChild(toast);
    DEBUG.log("Toast element created and added to DOM");

    // Trigger animation
    setTimeout(() => {
      toast.classList.add("show");
      DEBUG.log("Toast animation triggered");
    }, 100);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove("show");
      DEBUG.log("Toast auto-removal started");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
          DEBUG.log("Toast element removed from DOM");
        }
      }, 300);
    }, duration);

    // Manual close
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      DEBUG.log("Toast manually closed by user");
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
          DEBUG.log("Toast element removed from DOM after manual close");
        }
      }, 300);
    });

    DEBUG.log(
      `Toast notification displayed successfully: ${type} - ${message}`
    );
  };

  DEBUG.log("Enhanced UI features initialized");
}

// Show welcome message for new users (only once per session)
function showWelcomeMessage() {
  const isNewUser = sessionStorage.getItem("isNewUser");
  if (isNewUser && !window.authState.hasShownWelcome) {
    setTimeout(() => {
      window.showToast(
        "Welcome to inque! 🎉 Start by uploading your first widget!",
        "success",
        8000
      );
      sessionStorage.removeItem("isNewUser");
      window.authState.hasShownWelcome = true;
      DEBUG.log("Welcome message shown for new user");
    }, 2000);
  }
}

// Initialize header quick actions and sidebar login bindings
function initializeHeaderQuickActions() {
  DEBUG.log("Initializing header quick actions and sidebar login bindings");

  try {
    // Initialize Tutorial Button
    const tutorialBtn = document.getElementById("tutorialBtn");
    if (tutorialBtn) {
      tutorialBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        DEBUG.log("Tutorial button clicked");

        // Show tutorial information
        if (window.showToast) {
          window.showToast(
            "Tutorial feature coming soon! This will explain everything about inque.",
            "info",
            5000
          );
        } else {
          alert(
            "Tutorial feature coming soon! This will explain everything about inque."
          );
        }
      });
      DEBUG.log("Tutorial button listener attached successfully");
    } else {
      DEBUG.warn("Tutorial button not found in DOM");
    }

    // Initialize Edit Profile Quick Button
    const editProfileQuickBtn = document.getElementById("editProfileQuickBtn");
    if (editProfileQuickBtn) {
      editProfileQuickBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        DEBUG.log("Edit Profile quick button clicked");

        if (window.openEditProfile) {
          window.openEditProfile();
          DEBUG.log("Edit Profile modal opened via global function");
        } else {
          DEBUG.warn(
            "openEditProfile global function not available, using fallback"
          );
          const editProfileModal = document.getElementById("editProfileModal");
          if (editProfileModal) {
            editProfileModal.style.display = "block";
            document.body.style.overflow = "hidden";
            DEBUG.log("Edit Profile modal shown via fallback");
          } else {
            DEBUG.error("Edit Profile modal not found");
            if (window.showToast) {
              window.showToast("Edit Profile not available", "error");
            }
          }
        }
      });
      DEBUG.log("Edit Profile quick button listener attached successfully");
    } else {
      DEBUG.warn("Edit Profile quick button not found in DOM");
    }

    // Initialize Sidebar Login Button
    const sidebarLoginBtn = document.getElementById("sidebarLoginBtn");
    if (sidebarLoginBtn) {
      sidebarLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        DEBUG.log("Sidebar Login button clicked");

        if (window.openAuthModal) {
          window.openAuthModal("login");
          DEBUG.log("Auth modal opened via global function");
        } else {
          DEBUG.warn(
            "openAuthModal global function not available, using fallback"
          );
          const authModal = document.getElementById("authModal");
          if (authModal) {
            authModal.style.display = "block";
            document.body.style.overflow = "hidden";
            DEBUG.log("Auth modal shown via fallback");
          } else {
            DEBUG.error("Auth modal not found");
            if (window.showToast) {
              window.showToast("Login not available", "error");
            }
          }
        }
      });
      DEBUG.log("Sidebar login button listener attached successfully");
    } else {
      DEBUG.warn("Sidebar login button not found in DOM");
    }

    // Initialize AI Assistant Button (if not already handled by quick actions)
    const aiAssistantBtn = document.querySelector(
      '[data-action="openChatbot"]'
    );
    if (aiAssistantBtn) {
      aiAssistantBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        DEBUG.log("AI Assistant button clicked");

        if (typeof openChatbot === "function") {
          openChatbot();
          DEBUG.log("AI Assistant opened successfully");
        } else {
          DEBUG.error("openChatbot function not found");
          if (window.showToast) {
            window.showToast("AI Assistant not available", "error");
          }
        }
      });
      DEBUG.log("AI Assistant button listener attached successfully");
    } else {
      DEBUG.warn("AI Assistant button not found in DOM");
    }

    // Initialize Profile Navigation Buttons
    const profileNavBtns = document.querySelectorAll(".nav-btn[data-page]");
    if (profileNavBtns.length > 0) {
      profileNavBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const page = btn.getAttribute("data-page");
          if (!page) return;
          DEBUG.log(`Profile navigation button clicked`, { page });

          switch (page) {
            case "about":
              window.location.href = "core/personal/about.html";
              break;
            case "explore":
              window.location.href = "pages/explore.html";
              break;
            case "inventory":
              window.location.href = "pages/inventory.html";
              break;
            default:
              DEBUG.warn(`Unknown page navigation`, { page });
          }
        });
      });
      DEBUG.log(`Profile navigation buttons initialized`, {
        count: profileNavBtns.length,
      });
    } else {
      DEBUG.warn("Profile navigation buttons not found in DOM");
    }

    // Initialize Profile Banner Login Button
    const profileLoginBtn = document.getElementById("profileLoginBtn");
    if (profileLoginBtn) {
      // Update button visibility based on auth state
      const updateLoginButton = () => {
        const isLoggedIn = window.authState && window.authState.isInitialized;
        profileLoginBtn.style.display = isLoggedIn ? "none" : "inline-flex";
        DEBUG.log("Profile login button visibility updated", { isLoggedIn });
      };

      // Initial update
      updateLoginButton();

      // Listen for auth state changes
      window.addEventListener("auth-state-changed", () => {
        DEBUG.log("Auth state changed, updating profile login button");
        updateLoginButton();
      });

      // Handle login button click
      profileLoginBtn.addEventListener("click", () => {
        DEBUG.log("Profile login button clicked");
        if (window.openAuthModal) {
          window.openAuthModal("login");
        } else {
          const authModal = document.getElementById("authModal");
          if (authModal) {
            authModal.style.display = "block";
            document.body.style.overflow = "hidden";
            DEBUG.log("Auth modal shown via fallback");
          } else {
            DEBUG.error("Auth modal not found");
          }
        }
      });
      DEBUG.log("Profile login button listener attached successfully");
    } else {
      DEBUG.warn("Profile login button not found in DOM");
    }

    // Initialize Profile Banner Collapse/Expand
    const collapseBtn = document.getElementById("collapseProfileBtn");
    const profileBanner = document.getElementById("profile-banner");
    if (collapseBtn && profileBanner) {
      const collapseIcon = collapseBtn.querySelector(".collapse-icon");
      let collapsed = false;

      if (collapseIcon) {
        collapseBtn.addEventListener("click", () => {
          collapsed = !collapsed;
          DEBUG.log("Profile banner collapse toggled", { collapsed });

          if (collapsed) {
            profileBanner.classList.add("collapsed");
            profileBanner.style.maxHeight = "120px";
            profileBanner.style.overflow = "hidden";
            collapseBtn.classList.add("collapsed");
            collapseIcon.textContent = "▲";
          } else {
            profileBanner.classList.remove("collapsed");
            profileBanner.style.maxHeight = "none";
            profileBanner.style.overflow = "visible";
            collapseBtn.classList.remove("collapsed");
            collapseIcon.textContent = "▼";
          }
        });
        DEBUG.log("Profile banner collapse functionality initialized");
      } else {
        DEBUG.warn("Profile banner collapse icon not found");
      }
    } else {
      DEBUG.warn("Profile banner collapse elements not found", {
        collapseBtn: !!collapseBtn,
        profileBanner: !!profileBanner,
      });
    }

    // Initialize Leave a Note Button
    const leaveNoteBtn = document.getElementById("leaveNoteBtn");
    if (leaveNoteBtn) {
      leaveNoteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        DEBUG.log("Leave a Note button clicked");

        if (window.showToast) {
          window.showToast(
            "Leave a Note feature coming soon! This will let you leave messages in the yearbook.",
            "info",
            5000
          );
        } else {
          alert(
            "Leave a Note feature coming soon! This will let you leave messages in the yearbook."
          );
        }
      });
      DEBUG.log("Leave a Note button listener attached successfully");
    } else {
      DEBUG.warn("Leave a Note button not found in DOM");
    }

    DEBUG.log("Header quick actions initialization completed successfully");

    // Validate button states
    validateButtonStates();
  } catch (error) {
    DEBUG.error("Error during header quick actions initialization", error);
  }
}

// Validate that all expected buttons are properly initialized
function validateButtonStates() {
  DEBUG.log("Validating button states...");

  const expectedButtons = [
    { id: "tutorialBtn", name: "Tutorial Button" },
    { id: "editProfileQuickBtn", name: "Edit Profile Quick Button" },
    { id: "sidebarLoginBtn", name: "Sidebar Login Button" },
    { id: "leaveNoteBtn", name: "Leave a Note Button" },
    { id: "collapseProfileBtn", name: "Profile Collapse Button" },
  ];

  const missingButtons = [];
  const workingButtons = [];

  expectedButtons.forEach((button) => {
    const element = document.getElementById(button.id);
    if (element) {
      workingButtons.push(button.name);
    } else {
      missingButtons.push(button.name);
    }
  });

  if (workingButtons.length > 0) {
    DEBUG.log("✅ Working buttons", workingButtons);
  }

  if (missingButtons.length > 0) {
    DEBUG.warn("⚠️ Missing buttons", missingButtons);
  }

  // Check AI Assistant button
  const aiAssistantBtn = document.querySelector('[data-action="openChatbot"]');
  if (aiAssistantBtn) {
    DEBUG.log("✅ AI Assistant button found");
  } else {
    DEBUG.warn("⚠️ AI Assistant button not found");
  }

  // Check profile navigation buttons
  const profileNavBtns = document.querySelectorAll(".nav-btn[data-page]");
  if (profileNavBtns.length > 0) {
    DEBUG.log(`✅ Profile navigation buttons found`, {
      count: profileNavBtns.length,
    });
  } else {
    DEBUG.warn("⚠️ Profile navigation buttons not found");
  }
}

// Global function to open auth modal (can be called from anywhere)
window.openAuthModal = function (formType = "login") {
  DEBUG.log("Opening auth modal", { formType });

  const authModal = document.getElementById("authModal");
  const loginForm = document.getElementById("loginForm");
  const signUpForm = document.getElementById("signUpForm");
  const authModalTitle = document.getElementById("authModalTitle");

  if (authModal && loginForm && signUpForm && authModalTitle) {
    // Show the appropriate form
    if (formType === "signup") {
      loginForm.style.display = "none";
      signUpForm.style.display = "block";
      authModalTitle.textContent = "Sign Up";
    } else {
      signUpForm.style.display = "none";
      loginForm.style.display = "block";
      authModalTitle.textContent = "Login";
    }

    authModal.style.display = "block";
    document.body.style.overflow = "hidden";

    DEBUG.log("Auth modal opened successfully", { formType });
  } else {
    DEBUG.error("Failed to open auth modal - elements not found");
  }
};

DEBUG.log("Enhanced inque social app initialization complete");
