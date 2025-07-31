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

// Import timeline and widget management
DEBUG.log("Importing timeline-manager.js");
try {
  import("./scripts/timeline-manager.js")
    .then(() => {
      DEBUG.log("timeline-manager.js imported successfully");
    })
    .catch((error) => {
      DEBUG.error("Failed to import timeline-manager.js", error);
    });
} catch (error) {
  DEBUG.error("Error importing timeline-manager.js", error);
}

// Enhanced initialization with feature detection
document.addEventListener("DOMContentLoaded", async () => {
  DEBUG.log("DOM Content Loaded - Starting enhanced initialization");

  try {
    // Initialize password visibility toggles
    initializePasswordToggles();

    // Initialize form validation
    initializeFormValidation();

    // Initialize social interactions
    initializeSocialInteractions();

    // Initialize enhanced UI features
    initializeEnhancedUI();

    DEBUG.log("Enhanced initialization completed successfully");

    // Show welcome message for new users
    showWelcomeMessage();
  } catch (error) {
    DEBUG.error("Error during enhanced initialization", error);
  }
});

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
  } catch (error) {
    availabilityDiv.className = "username-availability unavailable";
    availabilityDiv.textContent = "Error checking availability";
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

// Show welcome message for new users
function showWelcomeMessage() {
  const isNewUser = sessionStorage.getItem("isNewUser");
  if (isNewUser) {
    setTimeout(() => {
      window.showToast(
        "Welcome to inque! 🎉 Start by uploading your first widget!",
        "success",
        8000
      );
      sessionStorage.removeItem("isNewUser");
    }, 2000);
  }
}

DEBUG.log("Enhanced inque social app initialization complete");
