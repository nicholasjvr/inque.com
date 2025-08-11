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
    .then(() => {
      DEBUG.log("firebase-core.js imported successfully");
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

    // Initialize enhanced UI features
    initializeEnhancedUI();

    // Initialize auth state tracking
    initializeAuthStateTracking();

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

  DEBUG.log("Social interactions initialized");
}

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
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    const container =
      document.getElementById("toast-container") || document.body;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 100);

    // Auto remove
    setTimeout(() => {
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
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
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
