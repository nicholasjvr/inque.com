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
  // Fallback: try to load without modules
  DEBUG.log("Attempting fallback auth system load");
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

// Import navigation system directly
DEBUG.log("Importing navigation system");
try {
  import("./scripts/ui/navigation.js")
    .then(() => {
      DEBUG.log("Navigation system imported successfully");
    })
    .catch((error) => {
      DEBUG.error("Failed to import navigation system", error);
    });
} catch (error) {
  DEBUG.error("Error importing navigation system", error);
}

// Import tools filter system directly
DEBUG.log("Importing tools filter system");
try {
  import("./scripts/ui/tools-filter.js")
    .then(() => {
      DEBUG.log("Tools filter system imported successfully");
    })
    .catch((error) => {
      DEBUG.error("Failed to import tools filter system", error);
    });
} catch (error) {
  DEBUG.error("Error importing tools filter system", error);
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

    // Initialize banner customization
    initializeBannerCustomization();

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
      DEBUG.log(
        "Profile login button not found (this is normal on pages without login forms)"
      );
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
    DEBUG.log(
      "AI Assistant button not found (this is normal on pages without chatbot)"
    );
  }

  // Check profile navigation buttons
  const profileNavBtns = document.querySelectorAll(".nav-btn[data-page]");
  if (profileNavBtns.length > 0) {
    DEBUG.log(`✅ Profile navigation buttons found`, {
      count: profileNavBtns.length,
    });
  } else {
    DEBUG.log(
      "Profile navigation buttons not found (this is normal on pages without profile navigation)"
    );
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

// Enhanced Scroll and Fullscreen Functionality
DEBUG.log("Initializing enhanced scroll and fullscreen functionality");

// Global state for fullscreen mode
window.fullscreenState = {
  isFullscreen: false,
  originalScrollPosition: 0,
  isInitialized: false,
};

// Initialize enhanced scroll and fullscreen features
function initializeEnhancedScrollAndFullscreen() {
  DEBUG.log("Setting up enhanced scroll and fullscreen features");

  try {
    // Create fullscreen toggle button
    createFullscreenToggleButton();

    // Setup scroll event listeners
    setupScrollEventListeners();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Initialize scroll position restoration
    initializeScrollPositionRestoration();

    window.fullscreenState.isInitialized = true;
    DEBUG.log(
      "Enhanced scroll and fullscreen features initialized successfully"
    );
  } catch (error) {
    DEBUG.error(
      "Failed to initialize enhanced scroll and fullscreen features",
      error
    );
  }
}

// Create fullscreen toggle button
function createFullscreenToggleButton() {
  DEBUG.log("Creating fullscreen toggle button");

  const toggleButton = document.createElement("button");
  toggleButton.id = "fullscreenToggle";
  toggleButton.className = "fullscreen-toggle";
  toggleButton.innerHTML = "⛶";
  toggleButton.title = "Toggle Fullscreen Mode (F11)";

  // Add click event listener
  toggleButton.addEventListener("click", toggleFullscreenMode);

  // Add to DOM
  document.body.appendChild(toggleButton);

  DEBUG.log("Fullscreen toggle button created and added to DOM");
}

// Toggle fullscreen mode
function toggleFullscreenMode() {
  DEBUG.log("Toggling fullscreen mode", {
    currentState: window.fullscreenState.isFullscreen,
  });

  const body = document.body;
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");
  const main = document.querySelector("main");

  if (!window.fullscreenState.isFullscreen) {
    // Enter fullscreen mode
    DEBUG.log("Entering fullscreen mode");

    // Store current scroll position
    window.fullscreenState.originalScrollPosition = window.pageYOffset;

    // Add fullscreen class to body
    body.classList.add("fullscreen-mode");

    // Hide header and footer
    if (header) {
      header.style.transform = "translateY(-100%)";
      DEBUG.log("Header hidden");
    }

    if (footer) {
      footer.style.transform = "translateY(100%)";
      DEBUG.log("Footer hidden");
    }

    // Hide banner when entering fullscreen (since header is hidden)
    updateBannerState("fullscreen-hidden", false);

    // Adjust main content
    if (main) {
      main.style.height = "100vh";
      main.style.paddingTop = "20px";
      main.style.paddingBottom = "20px";
      DEBUG.log("Main content adjusted for fullscreen");
    }

    // Update button icon
    const toggleButton = document.getElementById("fullscreenToggle");
    if (toggleButton) {
      toggleButton.innerHTML = "⛷";
      toggleButton.title = "Exit Fullscreen Mode (F11)";
    }

    window.fullscreenState.isFullscreen = true;

    // Show success notification
    if (window.showToast) {
      window.showToast(
        "Fullscreen mode activated! Press F11 or click the button to exit.",
        "success",
        3000
      );
    }
  } else {
    // Exit fullscreen mode
    DEBUG.log("Exiting fullscreen mode");

    // Remove fullscreen class from body
    body.classList.remove("fullscreen-mode");

    // Show header and footer
    if (header) {
      header.style.transform = "translateY(0)";
      DEBUG.log("Header shown");
    }

    if (footer) {
      footer.style.transform = "translateY(0)";
      DEBUG.log("Footer shown");
    }

    // Restore banner when exiting fullscreen (unless it was previously closed)
    const wasClosed = localStorage.getItem("bannerClosed");

    if (wasClosed !== "true") {
      updateBannerState("visible", true);
      DEBUG.log("Banner restored after exiting fullscreen");
    }

    // Restore main content
    if (main) {
      main.style.height = "";
      main.style.paddingTop = "";
      main.style.paddingBottom = "";
      DEBUG.log("Main content restored");
    }

    // Update button icon
    const toggleButton = document.getElementById("fullscreenToggle");
    if (toggleButton) {
      toggleButton.innerHTML = "⛶";
      toggleButton.title = "Toggle Fullscreen Mode (F11)";
    }

    window.fullscreenState.isFullscreen = false;

    // Restore scroll position
    setTimeout(() => {
      window.scrollTo(0, window.fullscreenState.originalScrollPosition);
      DEBUG.log("Scroll position restored", {
        position: window.fullscreenState.originalScrollPosition,
      });
    }, 100);

    // Show success notification
    if (window.showToast) {
      window.showToast("Fullscreen mode deactivated!", "info", 2000);
    }
  }

  DEBUG.log("Fullscreen mode toggled successfully", {
    newState: window.fullscreenState.isFullscreen,
  });
}

// Setup scroll event listeners for enhanced behavior
function setupScrollEventListeners() {
  DEBUG.log("Setting up scroll event listeners");

  let scrollTimeout;
  let lastScrollTop = 0;

  window.addEventListener(
    "scroll",
    () => {
      const currentScrollTop = window.pageYOffset;
      const scrollDirection = currentScrollTop > lastScrollTop ? "down" : "up";

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Set timeout for scroll end detection
      scrollTimeout = setTimeout(() => {
        DEBUG.log("Scroll ended", {
          position: currentScrollTop,
          direction: scrollDirection,
        });
      }, 150);

      // Update last scroll position
      lastScrollTop = currentScrollTop;

      // Add scroll-based effects
      handleScrollEffects(currentScrollTop, scrollDirection);
    },
    { passive: true }
  );

  DEBUG.log("Scroll event listeners setup complete");
}

// Handle scroll-based visual effects
function handleScrollEffects(scrollTop, direction) {
  const header = document.querySelector("header");
  const fullscreenToggle = document.getElementById("fullscreenToggle");

  // Auto-hide header on scroll down (DISABLED - interferes with hanging banner)
  // TODO: Re-enable this feature with proper banner positioning
  if (false && !window.fullscreenState.isFullscreen && header) {
    if (direction === "down" && scrollTop > 100) {
      header.style.transform = "translateY(-100%)";
      DEBUG.log("Header auto-hidden on scroll down");
    } else if (direction === "up" || scrollTop <= 100) {
      header.style.transform = "translateY(0)";
      DEBUG.log("Header shown on scroll up");
    }
  }

  // Adjust fullscreen toggle opacity based on scroll
  if (fullscreenToggle) {
    const opacity = Math.max(0.3, 1 - scrollTop / 500);
    fullscreenToggle.style.opacity = opacity;
  }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  DEBUG.log("Setting up keyboard shortcuts for fullscreen");

  document.addEventListener("keydown", (e) => {
    // F11 key for fullscreen toggle
    if (e.key === "F11") {
      e.preventDefault();
      DEBUG.log("F11 key pressed - toggling fullscreen");
      toggleFullscreenMode();
    }

    // Escape key to exit fullscreen
    if (e.key === "Escape" && window.fullscreenState.isFullscreen) {
      DEBUG.log("Escape key pressed - exiting fullscreen");
      toggleFullscreenMode();
    }

    // Ctrl + Shift + D for debug mode toggle
    if (e.ctrlKey && e.shiftKey && e.key === "D") {
      e.preventDefault();
      toggleDebugMode();
      DEBUG.log("Debug mode toggled via keyboard shortcut");
    }
  });

  DEBUG.log("Keyboard shortcuts setup complete");
}

// Initialize scroll position restoration
function initializeScrollPositionRestoration() {
  DEBUG.log("Initializing scroll position restoration");

  // Restore scroll position on page load
  window.addEventListener("load", () => {
    const savedPosition = sessionStorage.getItem("scrollPosition");
    if (savedPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition));
        DEBUG.log("Scroll position restored from session storage", {
          position: savedPosition,
        });
      }, 100);
    }
  });

  // Save scroll position before page unload
  window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("scrollPosition", window.pageYOffset.toString());
    DEBUG.log("Scroll position saved to session storage", {
      position: window.pageYOffset,
    });
  });

  DEBUG.log("Scroll position restoration initialized");
}

// Toggle debug mode
function toggleDebugMode() {
  const body = document.body;
  const isDebugMode = body.classList.contains("debug-mode");

  if (isDebugMode) {
    body.classList.remove("debug-mode");
    DEBUG.log("Debug mode disabled");
    if (window.showToast) {
      window.showToast("Debug mode disabled", "info", 2000);
    }
  } else {
    body.classList.add("debug-mode");
    DEBUG.log("Debug mode enabled");
    if (window.showToast) {
      window.showToast(
        "Debug mode enabled - Press Ctrl+Shift+D to toggle",
        "success",
        3000
      );
    }
  }
}

// Enhanced smooth scrolling for anchor links
function setupSmoothScrolling() {
  DEBUG.log("Setting up smooth scrolling for anchor links");

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const headerHeight =
          document.querySelector("header")?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        DEBUG.log("Smooth scroll to element", {
          targetId,
          position: targetPosition,
        });
      }
    }
  });

  DEBUG.log("Smooth scrolling setup complete");
}

// Global function to programmatically toggle fullscreen
window.toggleFullscreen = function () {
  DEBUG.log("Fullscreen toggle called via global function");
  toggleFullscreenMode();
};

// Global function to check fullscreen state
window.isFullscreen = function () {
  return window.fullscreenState.isFullscreen;
};

// Global function to enter fullscreen mode
window.enterFullscreen = function () {
  if (!window.fullscreenState.isFullscreen) {
    DEBUG.log("Entering fullscreen via global function");
    toggleFullscreenMode();
  }
};

// Global function to exit fullscreen mode
window.exitFullscreen = function () {
  if (window.fullscreenState.isFullscreen) {
    DEBUG.log("Exiting fullscreen via global function");
    toggleFullscreenMode();
  }
};

// Initialize enhanced scroll and fullscreen features when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  DEBUG.log(
    "DOM Content Loaded - Initializing enhanced scroll and fullscreen features"
  );

  // Wait a bit for other initializations to complete
  setTimeout(() => {
    initializeEnhancedScrollAndFullscreen();
    setupSmoothScrolling();
  }, 500);
});

DEBUG.log("Enhanced scroll and fullscreen functionality loaded");

// Global functions for backward compatibility (previously from vibe-coders-integration.js)
DEBUG.log("Setting up global compatibility functions");

// Global function to test integration
window.testVibeCodersIntegration = function () {
  DEBUG.log("Testing inQ platform integration");

  // Test navigation
  if (window.navigationManager) {
    DEBUG.log("✅ Navigation manager available");
  } else {
    DEBUG.warn("⚠️ Navigation manager not available");
  }

  // Test tools filter
  if (window.toolsFilterManager) {
    DEBUG.log("✅ Tools filter manager available");
  } else {
    DEBUG.warn("⚠️ Tools filter manager not available");
  }

  // Test auth
  if (window.authState && window.authState.isInitialized) {
    DEBUG.log("✅ Auth system initialized");
  } else {
    DEBUG.log("Auth system not initialized (this is normal during startup)");
  }

  // Show success message
  if (window.showToast) {
    window.showToast(
      "inQ Platform integration test completed! 🎉",
      "success",
      3000
    );
  }

  DEBUG.log("inQ platform integration test completed");
};

// Initialize banner customization functionality
function initializeBannerCustomization() {
  DEBUG.log("Initializing banner customization functionality");

  try {
    // Banner customization modal elements
    const bannerModal = document.getElementById("bannerCustomizationModal");
    const bannerCloseBtn = document.getElementById(
      "bannerCustomizationCloseBtn"
    );
    const customizeBannerBtn = document.getElementById("customizeBannerBtn");
    const saveBannerBtn = document.getElementById("saveBannerBtn");
    const resetBannerBtn = document.getElementById("resetBannerBtn");

    if (!bannerModal || !bannerCloseBtn || !customizeBannerBtn) {
      DEBUG.warn("Some banner customization elements not found", {
        bannerModal: !!bannerModal,
        bannerCloseBtn: !!bannerCloseBtn,
        customizeBannerBtn: !!customizeBannerBtn,
      });
      return;
    }

    // Open banner customization modal
    customizeBannerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      DEBUG.log("Opening banner customization modal");
      bannerModal.style.display = "block";
      document.body.style.overflow = "hidden";
      populateCustomizationOptions();
    });

    // Close banner customization modal
    bannerCloseBtn.addEventListener("click", () => {
      DEBUG.log("Closing banner customization modal");
      bannerModal.style.display = "none";
      document.body.style.overflow = "";
    });

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === bannerModal) {
        DEBUG.log("Closing banner customization modal via outside click");
        bannerModal.style.display = "none";
        document.body.style.overflow = "";
      }
    });

    // Close modal on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && bannerModal.style.display === "block") {
        DEBUG.log("Closing banner customization modal via escape key");
        bannerModal.style.display = "none";
        document.body.style.overflow = "";
      }
    });

    // Layout option buttons
    const layoutOptions = document.querySelectorAll(".layout-option");
    layoutOptions.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        DEBUG.log("Layout option clicked", { layout: btn.dataset.layout });

        // Remove active class from all options
        layoutOptions.forEach((option) => option.classList.remove("active"));
        // Add active class to clicked option
        btn.classList.add("active");

        // Apply layout changes
        applyBannerLayout(btn.dataset.layout);
      });
    });

    // Theme option buttons
    const themeOptions = document.querySelectorAll(".theme-option");
    themeOptions.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        DEBUG.log("Theme option clicked", { theme: btn.dataset.theme });

        // Remove active class from all options
        themeOptions.forEach((option) => option.classList.remove("active"));
        // Add active class to clicked option
        btn.classList.add("active");

        // Apply theme changes
        applyBannerTheme(btn.dataset.theme);
      });
    });

    // Save banner customization
    if (saveBannerBtn) {
      saveBannerBtn.addEventListener("click", (e) => {
        e.preventDefault();
        DEBUG.log("Saving banner customization");
        saveBannerCustomization();
      });
    }

    // Reset banner customization
    if (resetBannerBtn) {
      resetBannerBtn.addEventListener("click", (e) => {
        e.preventDefault();
        DEBUG.log("Resetting banner customization");
        resetBannerCustomization();
      });
    }

    // Global function to open profile customization
    window.openProfileCustomization = function () {
      DEBUG.log("Opening profile customization via global function");
      if (bannerModal) {
        bannerModal.style.display = "block";
        document.body.style.overflow = "hidden";
        populateCustomizationOptions();
      }
    };

    // Initialize banner card controls
    initializeBannerCardControls();

    DEBUG.log("Banner customization functionality initialized successfully");
  } catch (error) {
    DEBUG.error("Error initializing banner customization", error);
  }
}

// Populate customization options
function populateCustomizationOptions() {
  DEBUG.log("Populating banner customization options");

  try {
    const quickLinksContainer = document.getElementById(
      "quickLinksCustomization"
    );
    if (!quickLinksContainer) {
      DEBUG.warn("Quick links customization container not found");
      return;
    }

    // Available quick links
    const availableLinks = [
      {
        id: "projects",
        label: "📊 Projects",
        href: "pages/my-projects.html",
        enabled: true,
      },
      {
        id: "studio",
        label: "🎨 Studio",
        href: "pages/widget_studio.html",
        enabled: true,
      },
      {
        id: "explore",
        label: "🔍 Explore",
        href: "pages/explore.html",
        enabled: true,
      },
      {
        id: "community",
        label: "👥 Community",
        href: "pages/users.html",
        enabled: true,
      },
      {
        id: "inventory",
        label: "📦 Inventory",
        href: "pages/inventory.html",
        enabled: false,
      },
      {
        id: "profile",
        label: "👤 Profile",
        href: "pages/profile-edit.html",
        enabled: false,
      },
    ];

    // Clear existing options
    quickLinksContainer.innerHTML = "";

    // Create customization options for each link
    availableLinks.forEach((link) => {
      const linkOption = document.createElement("div");
      linkOption.className = "quick-link-option";
      linkOption.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--bg-tertiary);
        border: 1px solid var(--primary-neon);
        border-radius: 6px;
        margin-bottom: 8px;
      `;

      linkOption.innerHTML = `
        <input 
          type="checkbox" 
          id="link-${link.id}" 
          ${link.enabled ? "checked" : ""}
          style="margin: 0;"
        >
        <label for="link-${link.id}" style="color: var(--text-primary); cursor: pointer; flex: 1;">
          ${link.label}
        </label>
        <span style="color: var(--text-secondary); font-size: 0.8rem;">
          ${link.enabled ? "Enabled" : "Disabled"}
        </span>
      `;

      quickLinksContainer.appendChild(linkOption);
    });

    DEBUG.log("Customization options populated successfully");
  } catch (error) {
    DEBUG.error("Error populating customization options", error);
  }
}

// Apply banner layout changes
function applyBannerLayout(layout) {
  DEBUG.log("Applying banner layout", { layout });

  try {
    const profileBanner = document.getElementById("profileBanner");
    const bannerUserSection = profileBanner?.querySelector(
      ".banner-user-section"
    );
    const bannerQuickLinks = profileBanner?.querySelector(
      ".banner-quick-links"
    );
    const bannerActions = profileBanner?.querySelector(".banner-actions");

    if (!profileBanner) {
      DEBUG.warn("Profile banner not found");
      return;
    }

    // Reset styles
    profileBanner.style.flexDirection = "row";
    profileBanner.style.gap = "20px";
    profileBanner.style.padding = "12px 20px";

    switch (layout) {
      case "horizontal":
        // Default horizontal layout
        profileBanner.style.flexDirection = "row";
        profileBanner.style.gap = "20px";
        break;

      case "compact":
        // Compact layout with smaller gaps
        profileBanner.style.flexDirection = "row";
        profileBanner.style.gap = "12px";
        profileBanner.style.padding = "8px 16px";
        break;

      case "minimal":
        // Minimal layout with vertical arrangement
        profileBanner.style.flexDirection = "column";
        profileBanner.style.gap = "8px";
        profileBanner.style.padding = "16px 20px";
        break;
    }

    DEBUG.log("Banner layout applied successfully", { layout });
  } catch (error) {
    DEBUG.error("Error applying banner layout", error);
  }
}

// Apply banner theme changes
function applyBannerTheme(theme) {
  DEBUG.log("Applying banner theme", { theme });

  try {
    const profileBanner = document.getElementById("profileBanner");
    const quickLinks = profileBanner?.querySelectorAll(".banner-quick-link");

    if (!profileBanner) {
      DEBUG.warn("Profile banner not found");
      return;
    }

    // Reset to default theme
    profileBanner.style.background =
      "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)";
    profileBanner.style.borderColor = "var(--primary-neon)";

    switch (theme) {
      case "neon":
        // Default neon theme
        profileBanner.style.background =
          "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)";
        profileBanner.style.borderColor = "var(--primary-neon)";
        break;

      case "monochrome":
        // Monochrome theme
        profileBanner.style.background =
          "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)";
        profileBanner.style.borderColor = "#ffffff";
        break;

      case "pastel":
        // Pastel theme
        profileBanner.style.background =
          "linear-gradient(135deg, #2a1a2a 0%, #3a2a3a 100%)";
        profileBanner.style.borderColor = "#ff69b4";
        break;
    }

    DEBUG.log("Banner theme applied successfully", { theme });
  } catch (error) {
    DEBUG.error("Error applying banner theme", error);
  }
}

// Save banner customization
function saveBannerCustomization() {
  DEBUG.log("Saving banner customization");

  try {
    // Get current settings
    const activeLayout =
      document.querySelector(".layout-option.active")?.dataset.layout ||
      "horizontal";
    const activeTheme =
      document.querySelector(".theme-option.active")?.dataset.theme || "neon";

    // Get enabled quick links
    const enabledLinks = [];
    const linkCheckboxes = document.querySelectorAll(
      "#quickLinksCustomization input[type='checkbox']:checked"
    );
    linkCheckboxes.forEach((checkbox) => {
      const linkId = checkbox.id.replace("link-", "");
      enabledLinks.push(linkId);
    });

    // Save to localStorage
    const bannerSettings = {
      layout: activeLayout,
      theme: activeTheme,
      enabledLinks: enabledLinks,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem("bannerCustomization", JSON.stringify(bannerSettings));

    // Apply settings
    applyBannerLayout(activeLayout);
    applyBannerTheme(activeTheme);
    updateQuickLinks(enabledLinks);

    // Show success message
    if (window.showToast) {
      window.showToast("Banner customization saved! 🎨", "success", 3000);
    }

    // Show customization indicator
    const indicator = document.getElementById("bannerCustomizationIndicator");
    if (indicator) {
      indicator.style.display = "block";
      setTimeout(() => {
        indicator.style.display = "none";
      }, 3000);
    }

    // Close modal
    const bannerModal = document.getElementById("bannerCustomizationModal");
    if (bannerModal) {
      bannerModal.style.display = "none";
      document.body.style.overflow = "";
    }

    DEBUG.log("Banner customization saved successfully", bannerSettings);
  } catch (error) {
    DEBUG.error("Error saving banner customization", error);
    if (window.showToast) {
      window.showToast("Failed to save banner customization", "error");
    }
  }
}

// Reset banner customization
function resetBannerCustomization() {
  DEBUG.log("Resetting banner customization");

  try {
    // Clear localStorage
    localStorage.removeItem("bannerCustomization");

    // Reset to default settings
    applyBannerLayout("horizontal");
    applyBannerTheme("neon");
    updateQuickLinks(["projects", "studio", "explore", "community"]);

    // Reset modal options
    const layoutOptions = document.querySelectorAll(".layout-option");
    layoutOptions.forEach((option) => {
      option.classList.remove("active");
      if (option.dataset.layout === "horizontal") {
        option.classList.add("active");
      }
    });

    const themeOptions = document.querySelectorAll(".theme-option");
    themeOptions.forEach((option) => {
      option.classList.remove("active");
      if (option.dataset.theme === "neon") {
        option.classList.add("active");
      }
    });

    // Show success message
    if (window.showToast) {
      window.showToast("Banner customization reset! 🔄", "info", 3000);
    }

    DEBUG.log("Banner customization reset successfully");
  } catch (error) {
    DEBUG.error("Error resetting banner customization", error);
    if (window.showToast) {
      window.showToast("Failed to reset banner customization", "error");
    }
  }
}

// Update quick links based on enabled links
function updateQuickLinks(enabledLinks) {
  DEBUG.log("Updating quick links", { enabledLinks });

  try {
    const bannerQuickLinks = document.querySelector(".banner-quick-links");
    if (!bannerQuickLinks) {
      DEBUG.warn("Banner quick links container not found");
      return;
    }

    // Clear existing links
    bannerQuickLinks.innerHTML = "";

    // Available links mapping
    const linkMap = {
      projects: {
        label: "📊 Projects",
        href: "pages/my-projects.html",
        color: "primary",
      },
      studio: {
        label: "🎨 Studio",
        href: "pages/widget_studio.html",
        color: "secondary",
      },
      explore: {
        label: "🔍 Explore",
        href: "pages/explore.html",
        color: "accent",
      },
      community: {
        label: "👥 Community",
        href: "pages/users.html",
        color: "error",
      },
      inventory: {
        label: "📦 Inventory",
        href: "pages/inventory.html",
        color: "success",
      },
      profile: {
        label: "👤 Profile",
        href: "pages/profile-edit.html",
        color: "warning",
      },
    };

    // Add enabled links
    enabledLinks.forEach((linkId) => {
      const linkData = linkMap[linkId];
      if (linkData) {
        const linkElement = document.createElement("a");
        linkElement.href = linkData.href;
        linkElement.className = "banner-quick-link";
        linkElement.setAttribute("data-color", linkData.color);
        linkElement.title = linkData.label;
        linkElement.style.cssText = `
          padding: 8px 12px;
          background: rgba(0, 240, 255, 0.15);
          border: 1px solid #00f0ff;
          border-radius: 6px;
          color: #00f0ff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        `;
        linkElement.textContent = linkData.label;

        bannerQuickLinks.appendChild(linkElement);
      }
    });

    DEBUG.log("Quick links updated successfully");
  } catch (error) {
    DEBUG.error("Error updating quick links", error);
  }
}

// Load saved banner customization on page load
function loadBannerCustomization() {
  DEBUG.log("Loading saved banner customization");

  try {
    const savedSettings = localStorage.getItem("bannerCustomization");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);

      // Apply saved settings
      applyBannerLayout(settings.layout || "horizontal");
      applyBannerTheme(settings.theme || "neon");
      updateQuickLinks(
        settings.enabledLinks || ["projects", "studio", "explore", "community"]
      );

      DEBUG.log("Banner customization loaded successfully", settings);
    } else {
      DEBUG.log("No saved banner customization found, using defaults");
    }
  } catch (error) {
    DEBUG.error("Error loading banner customization", error);
  }
}

// Add restore button for closed banners
function addBannerRestoreButton() {
  DEBUG.log("Adding banner restore button to header");

  try {
    // Check if restore button already exists
    if (document.getElementById("bannerRestoreBtn")) {
      return;
    }

    const header = document.querySelector("header");
    if (!header) {
      DEBUG.warn("Header not found for restore button");
      return;
    }

    // Create restore button
    const restoreBtn = document.createElement("button");
    restoreBtn.id = "bannerRestoreBtn";
    restoreBtn.innerHTML = "🏴‍☠️";
    restoreBtn.title = "Restore Profile Banner";
    restoreBtn.style.cssText = `
      width: 40px;
      height: 40px;
      background: rgba(0, 255, 255, 0.2);
      border: 2px solid var(--primary-neon);
      border-radius: 50%;
      color: var(--primary-neon);
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: pulse 2s infinite;
      margin-left: 20px;
    `;

    // Add hover effects
    restoreBtn.addEventListener("mouseenter", () => {
      restoreBtn.style.background = "rgba(0, 255, 255, 0.3)";
      restoreBtn.style.transform = "scale(1.1)";
      restoreBtn.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
    });

    restoreBtn.addEventListener("mouseleave", () => {
      restoreBtn.style.background = "rgba(0, 255, 255, 0.2)";
      restoreBtn.style.transform = "scale(1)";
      restoreBtn.style.boxShadow = "none";
    });

    // Add click handler
    restoreBtn.addEventListener("click", () => {
      DEBUG.log("Restoring banner from closed state");

      const profileBanner = document.getElementById("profileBanner");
      if (profileBanner) {
        updateBannerState("visible", true);

        // Remove closed state from localStorage
        localStorage.removeItem("bannerClosed");

        // Remove restore button after a short delay to ensure state is updated
        setTimeout(() => {
          restoreBtn.remove();
        }, 100);

        // Show success message
        if (window.showToast) {
          window.showToast("Profile banner restored! 🏴‍☠️", "success", 3000);
        }
      }
    });

    // Add to header navigation area (middle section)
    const headerContent = header.querySelector('div[style*="display: flex"]');
    if (headerContent) {
      // Insert the button in the middle of the navigation
      const nav = headerContent.querySelector("nav");
      if (nav) {
        nav.appendChild(restoreBtn);
      } else {
        // Fallback: add after the title section
        const titleSection = headerContent.querySelector(
          'div[style*="display: flex"][style*="align-items: center"]'
        );
        if (titleSection) {
          titleSection.appendChild(restoreBtn);
        } else {
          headerContent.appendChild(restoreBtn);
        }
      }
    } else {
      // Fallback: add to header directly
      header.appendChild(restoreBtn);
    }

    DEBUG.log("Banner restore button added successfully");
  } catch (error) {
    DEBUG.error("Error adding banner restore button", error);
  }
}

// Add banner activation button for minimized state
function addBannerActivationButton() {
  DEBUG.log("Adding banner activation button");

  try {
    // Check if activation button already exists
    if (document.getElementById("bannerActivationBtn")) {
      return;
    }

    const header = document.querySelector("header");
    if (!header) {
      DEBUG.warn("Header not found for activation button");
      return;
    }

    // Create activation button
    const activationBtn = document.createElement("button");
    activationBtn.id = "bannerActivationBtn";
    activationBtn.innerHTML = "🔗";
    activationBtn.title = "Expand Profile Banner";
    activationBtn.style.cssText = `
      width: 40px;
      height: 40px;
      background: rgba(0, 255, 255, 0.2);
      border: 2px solid var(--primary-neon);
      border-radius: 50%;
      color: var(--primary-neon);
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: pulse 2s infinite;
      margin-left: 20px;
    `;

    // Add hover effects
    activationBtn.addEventListener("mouseenter", () => {
      activationBtn.style.background = "rgba(0, 255, 255, 0.3)";
      activationBtn.style.transform = "scale(1.1)";
      activationBtn.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
    });

    activationBtn.addEventListener("mouseleave", () => {
      activationBtn.style.background = "rgba(0, 255, 255, 0.2)";
      activationBtn.style.transform = "scale(1)";
      activationBtn.style.boxShadow = "none";
    });

    // Add click handler
    activationBtn.addEventListener("click", () => {
      DEBUG.log("Activating banner from minimized state");

      updateBannerState("visible", true);

      // Remove activation button after a short delay to ensure state is updated
      setTimeout(() => {
        activationBtn.remove();
      }, 100);

      // Show success message
      if (window.showToast) {
        window.showToast("Profile banner expanded! 🔗", "success", 2000);
      }
    });

    // Add to header navigation area (middle section)
    const headerContent = header.querySelector('div[style*="display: flex"]');
    if (headerContent) {
      const nav = headerContent.querySelector("nav");
      if (nav) {
        nav.appendChild(activationBtn);
      } else {
        const titleSection = headerContent.querySelector(
          'div[style*="display: flex"][style*="align-items: center"]'
        );
        if (titleSection) {
          titleSection.appendChild(activationBtn);
        } else {
          headerContent.appendChild(activationBtn);
        }
      }
    } else {
      header.appendChild(activationBtn);
    }

    DEBUG.log("Banner activation button added successfully");
  } catch (error) {
    DEBUG.error("Error adding banner activation button", error);
  }
}

// Centralized banner state management for consolidated structure
function updateBannerState(state, animate = true) {
  DEBUG.log(`Updating banner state to: ${state}`);

  const profileBanner = document.getElementById("profileBanner");
  const bannerSection = document.getElementById("profile-banner-section");
  const bannerChain = document.getElementById("bannerChain");
  const chainLink = document.getElementById("chainLink");
  const headerBannerContainer = document.getElementById(
    "header-banner-container"
  );

  if (!profileBanner || !bannerSection || !headerBannerContainer) {
    DEBUG.warn("Banner elements not found for state update");
    return;
  }

  // Remove all state classes first
  profileBanner.classList.remove("hidden", "minimized", "entered");
  headerBannerContainer.classList.remove(
    "hidden",
    "minimized",
    "fullscreen-hidden"
  );

  // Apply new state
  switch (state) {
    case "visible":
      profileBanner.classList.add("entered");
      headerBannerContainer.style.opacity = "1";
      headerBannerContainer.style.pointerEvents = "auto";
      if (animate) {
        profileBanner.style.animation =
          "bannerDropAndSway 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards";
      }
      // Show chain elements
      if (bannerChain) bannerChain.style.opacity = "1";
      if (chainLink) chainLink.style.opacity = "1";
      // Remove activation button if it exists
      const activationBtn = document.getElementById("bannerActivationBtn");
      if (activationBtn) activationBtn.remove();
      // Clear minimized state
      localStorage.removeItem("bannerMinimized");
      DEBUG.log("Banner visible state restored, minimized state cleared");
      break;

    case "minimized":
      profileBanner.classList.add("minimized");
      headerBannerContainer.classList.add("minimized");
      headerBannerContainer.style.opacity = "1";
      headerBannerContainer.style.pointerEvents = "auto";
      profileBanner.style.animation = "none";
      // Hide chain elements
      if (bannerChain) bannerChain.style.opacity = "0";
      if (chainLink) chainLink.style.opacity = "0";
      // Show banner activation button
      addBannerActivationButton();
      // Store minimized state
      localStorage.setItem("bannerMinimized", "true");
      DEBUG.log("Banner minimized state stored");
      break;

    case "hidden":
      profileBanner.classList.add("hidden");
      headerBannerContainer.classList.add("hidden");
      headerBannerContainer.style.opacity = "0";
      headerBannerContainer.style.pointerEvents = "none";
      if (animate) {
        profileBanner.style.animation =
          "zipUpToHeader 0.6s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards";
      }
      // Hide chain elements immediately
      if (bannerChain) bannerChain.style.opacity = "0";
      if (chainLink) chainLink.style.opacity = "0";
      break;

    case "fullscreen-hidden":
      headerBannerContainer.classList.add("fullscreen-hidden");
      headerBannerContainer.style.opacity = "0";
      headerBannerContainer.style.pointerEvents = "none";
      profileBanner.style.animation = "none";
      // Hide chain elements
      if (bannerChain) bannerChain.style.opacity = "0";
      if (chainLink) chainLink.style.opacity = "0";
      break;
  }

  DEBUG.log(`Banner state updated to: ${state}`);

  // Dispatch custom event for UI positioning adjustments
  window.dispatchEvent(
    new CustomEvent("banner-state-changed", {
      detail: { state: state },
    })
  );
}

// Initialize UI positioning adjustments to prevent button overlap
function initializeUIPositioning() {
  DEBUG.log("Initializing UI positioning adjustments");

  try {
    const fullscreenToggle = document.getElementById("fullscreenToggle");
    const toastContainer = document.getElementById("toast-container");
    const headerBannerContainer = document.getElementById(
      "header-banner-container"
    );

    if (!fullscreenToggle || !toastContainer) {
      DEBUG.warn("UI elements not found for positioning adjustments");
      return;
    }

    // Function to adjust positioning based on banner state
    const adjustUIPositioning = () => {
      const isMobile = window.innerWidth <= 768;
      const isBannerVisible =
        headerBannerContainer &&
        !headerBannerContainer.classList.contains("hidden") &&
        !headerBannerContainer.classList.contains("fullscreen-hidden");

      if (isMobile && isBannerVisible) {
        // Adjust positioning when banner is visible on mobile
        fullscreenToggle.style.top = "200px";
        toastContainer.style.top = "200px";
        DEBUG.log("UI positioning adjusted for mobile with visible banner");
      } else if (isMobile) {
        // Standard mobile positioning
        fullscreenToggle.style.top = "100px";
        toastContainer.style.top = "100px";
        DEBUG.log("UI positioning adjusted for mobile without banner");
      } else {
        // Desktop positioning
        fullscreenToggle.style.top = "140px";
        toastContainer.style.top = "140px";
        DEBUG.log("UI positioning adjusted for desktop");
      }
    };

    // Initial adjustment
    adjustUIPositioning();

    // Listen for banner state changes
    window.addEventListener("banner-state-changed", adjustUIPositioning);

    // Listen for resize events
    window.addEventListener("resize", () => {
      setTimeout(adjustUIPositioning, 100);
    });

    DEBUG.log("UI positioning adjustments initialized successfully");
  } catch (error) {
    DEBUG.error("Error initializing UI positioning adjustments", error);
  }
}

// Initialize mobile-specific banner behavior
function initializeMobileBannerBehavior() {
  DEBUG.log("Initializing mobile-specific banner behavior");

  try {
    const profileBanner = document.getElementById("profileBanner");
    const headerBannerContainer = document.getElementById(
      "header-banner-container"
    );

    if (!profileBanner || !headerBannerContainer) {
      DEBUG.warn("Banner elements not found for mobile behavior");
      return;
    }

    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      DEBUG.log(
        "Mobile device detected - applying mobile banner optimizations"
      );

      // Add mobile-specific classes
      headerBannerContainer.classList.add("mobile-optimized");
      profileBanner.classList.add("mobile-optimized");

      // Optimize touch interactions
      profileBanner.style.touchAction = "manipulation";
      profileBanner.style.webkitTouchCallout = "none";
      profileBanner.style.webkitUserSelect = "none";
      profileBanner.style.userSelect = "none";

      // Add mobile-specific event listeners
      profileBanner.addEventListener(
        "touchstart",
        (e) => {
          // Prevent default touch behaviors that might interfere
          e.preventDefault();
        },
        { passive: false }
      );

      // Handle orientation changes
      window.addEventListener("orientationchange", () => {
        DEBUG.log("Orientation changed - recalculating banner position");
        setTimeout(() => {
          // Force reflow to ensure proper positioning
          headerBannerContainer.style.transform = "translateZ(0)";
          setTimeout(() => {
            headerBannerContainer.style.transform = "";
          }, 100);
        }, 100);
      });

      // Handle resize events for mobile
      let resizeTimeout;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const newIsMobile = window.innerWidth <= 768;
          if (newIsMobile !== isMobile) {
            DEBUG.log("Screen size changed - reinitializing mobile behavior");
            initializeMobileBannerBehavior();
          }
        }, 250);
      });
    } else {
      DEBUG.log("Desktop device detected - using standard banner behavior");
      // Remove mobile classes if they exist
      headerBannerContainer.classList.remove("mobile-optimized");
      profileBanner.classList.remove("mobile-optimized");
    }
  } catch (error) {
    DEBUG.error("Error initializing mobile banner behavior", error);
  }
}

// Initialize banner card controls (minimize, close, etc.)
// TODO: Future enhancement - Add customizable animations from user inventory
// TODO: Future enhancement - Add achievement-unlocked banner styles and effects
// TODO: Future enhancement - Add seasonal/holiday banner themes
function initializeBannerCardControls() {
  DEBUG.log("Initializing hanging banner controls");

  try {
    const profileBanner = document.getElementById("profileBanner");
    const minimizeBtn = document.getElementById("minimizeBannerBtn");
    const closeBtn = document.getElementById("closeBannerBtn");

    if (!profileBanner) {
      DEBUG.warn("Profile banner not found for controls");
      return;
    }

    // Add entrance animation completion handler
    profileBanner.addEventListener("animationend", (e) => {
      if (e.animationName === "bannerDropAndSway") {
        DEBUG.log("Hanging banner entrance animation completed");
        profileBanner.classList.add("entered");

        // Show welcome message for banner
        if (window.showToast) {
          setTimeout(() => {
            window.showToast(
              "Welcome! Your hanging profile banner is ready 🏴‍☠️",
              "info",
              4000
            );
          }, 1000);
        }
      }
    });

    // Minimize button functionality
    if (minimizeBtn) {
      minimizeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        DEBUG.log("Toggling banner minimize state");

        const isCurrentlyMinimized =
          profileBanner.classList.contains("minimized");
        const newState = isCurrentlyMinimized ? "visible" : "minimized";

        updateBannerState(newState, false);

        minimizeBtn.textContent = isCurrentlyMinimized ? "−" : "+";
        minimizeBtn.title = isCurrentlyMinimized
          ? "Minimize Banner"
          : "Expand Banner";

        if (window.showToast) {
          window.showToast(
            isCurrentlyMinimized ? "Banner expanded" : "Banner minimized",
            "info",
            2000
          );
        }
      });
    }

    // Close button functionality
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        DEBUG.log("Closing banner with zip-up animation");

        updateBannerState("hidden", true);

        if (window.showToast) {
          window.showToast(
            "Banner zipped up! Use restore button to bring it back 🏴‍☠️",
            "info",
            3000
          );
        }

        // Store closed state
        localStorage.setItem("bannerClosed", "true");

        // Add restore button after animation completes
        setTimeout(() => {
          addBannerRestoreButton();
        }, 700);
      });
    }

    // Check if banner was previously closed or minimized
    const wasClosed = localStorage.getItem("bannerClosed");
    const wasMinimized = localStorage.getItem("bannerMinimized");

    if (wasClosed === "true") {
      DEBUG.log("Banner was previously closed, hiding it");
      updateBannerState("hidden", false);

      // Add a restore button to the header for closed banners
      addBannerRestoreButton();
    } else if (wasMinimized === "true") {
      DEBUG.log("Banner was previously minimized, showing minimized state");
      updateBannerState("minimized", false);
    } else {
      DEBUG.log("Banner is visible, starting entrance animation");
      updateBannerState("visible", true);
    }

    // Banner is now fixed to header - no drag functionality needed
    // The banner stays attached to the header and centers automatically
    DEBUG.log(
      "Banner positioning fixed to header - drag functionality removed for better mobile UX"
    );

    // Clear any saved drag positions since banner is now fixed
    localStorage.removeItem("bannerPosition");

    // Initialize mobile-specific banner behavior
    initializeMobileBannerBehavior();

    // Initialize mobile drawer functionality
    initializeMobileDrawer();

    DEBUG.log("Banner card controls initialized successfully");

    // Debug function removed for cleaner UI

    // Initialize UI positioning adjustments
    initializeUIPositioning();
  } catch (error) {
    DEBUG.error("Error initializing banner card controls", error);
  }
}

// Initialize mobile drawer functionality
function initializeMobileDrawer() {
  DEBUG.log("Initializing mobile drawer functionality");

  try {
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const mobileDrawer = document.getElementById("mobileDrawer");
    const mobileDrawerClose = document.getElementById("mobileDrawerClose");
    const mobileDrawerOverlay = document.getElementById("mobileDrawerOverlay");
    const mobileAuthBtn = document.getElementById("mobileAuthBtn");
    const authBtn = document.getElementById("authBtn");

    if (!mobileMenuToggle || !mobileDrawer || !mobileDrawerClose) {
      DEBUG.warn("Mobile drawer elements not found");
      return;
    }

    // Toggle drawer open
    const openDrawer = () => {
      DEBUG.log("Opening mobile drawer");
      mobileDrawer.classList.add("open");
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    };

    // Toggle drawer closed
    const closeDrawer = () => {
      DEBUG.log("Closing mobile drawer");
      mobileDrawer.classList.remove("open");
      document.body.style.overflow = ""; // Restore scrolling
    };

    // Event listeners
    mobileMenuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDrawer();
    });

    mobileDrawerClose.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeDrawer();
    });

    mobileDrawerOverlay.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeDrawer();
    });

    // Close drawer when clicking on navigation items
    const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
    mobileNavItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        // Don't close for external links immediately
        if (item.href && item.href.includes("pages/")) {
          // Small delay to allow navigation
          setTimeout(() => {
            closeDrawer();
          }, 100);
        } else {
          closeDrawer();
        }
      });
    });

    // Sync mobile auth button with main auth button
    if (mobileAuthBtn && authBtn) {
      mobileAuthBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeDrawer();
        // Trigger the main auth button click
        authBtn.click();
      });
    }

    // Handle escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileDrawer.classList.contains("open")) {
        closeDrawer();
      }
    });

    // Handle window resize - close drawer on desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768 && mobileDrawer.classList.contains("open")) {
        closeDrawer();
      }
    });

    // Sync user info between main banner and mobile drawer
    const syncUserInfo = () => {
      const userName = document.getElementById("userName");
      const userStatus = document.getElementById("userStatus");
      const mobileUserName = document.getElementById("mobileUserName");
      const mobileUserStatus = document.getElementById("mobileUserStatus");

      if (userName && mobileUserName) {
        mobileUserName.textContent = userName.textContent;
      }
      if (userStatus && mobileUserStatus) {
        mobileUserStatus.textContent = userStatus.textContent;
      }
    };

    // Initial sync
    syncUserInfo();

    // Watch for changes in user info
    const observer = new MutationObserver(syncUserInfo);
    const userInfoElement = document.getElementById("userName");
    if (userInfoElement) {
      observer.observe(userInfoElement, { childList: true, subtree: true });
    }

    DEBUG.log("Mobile drawer functionality initialized successfully");
  } catch (error) {
    DEBUG.error("Error initializing mobile drawer", error);
  }
}

// Load banner customization when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadBannerCustomization();
  }, 1000);
});

DEBUG.log("Enhanced inque social app initialization complete");
