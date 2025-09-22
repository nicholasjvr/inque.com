import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { auth, db, onAuthStateChanged } from "../../core/firebase-core.js";
// DOM Elements
const usersContainer = document.getElementById("users-container");
const userSearch = document.getElementById("userSearch");
const filterSelect = document.getElementById("filterSelect");
const sortSelect = document.getElementById("sortSelect");
const refreshBtn = document.getElementById("refreshBtn");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadMoreContainer = document.getElementById("loadMoreContainer");
const emptyState = document.getElementById("emptyState");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

// Chat Modal Elements
const chatModal = document.getElementById("chatModal");
const chatWithUserEl = document.getElementById("chat-with-user");
const closeChatBtn = document.getElementById("closeChat");
const chatMessagesEl = document.getElementById("chat-messages");
const chatMessageInput = document.getElementById("chat-message-input");
const chatSendBtn = document.getElementById("chat-send-btn");

// Error Modal Elements
const errorModal = document.getElementById("errorModal");
const errorTitle = document.getElementById("errorTitle");
const errorMessage = document.getElementById("errorMessage");
const errorRetryBtn = document.getElementById("errorRetryBtn");
const errorCloseBtn = document.getElementById("errorCloseBtn");

// Toast Container
const toastContainer = document.getElementById("toastContainer");

// State Management
let currentUser = null;
let unsubscribeFromChat = null;
let currentChatRoomId = null;
let allUsers = [];
let filteredUsers = [];
let displayedUsers = [];
let currentPage = 0;
const USERS_PER_PAGE = 12;

// Main initialization function
async function initializeUsersPage() {
  try {
    console.log("🚀 [USERS] Initializing users page");

    // Load users
    allUsers = await fetchUsers();

    if (!allUsers.length) {
      showEmptyState("No users found yet. Check back later!");
      return;
    }

    // Apply initial filters and sorting
    applyFiltersAndRender();

    // Setup event listeners
    setupEventListeners();

    console.log("✅ [USERS] Users page initialized successfully");
  } catch (error) {
    console.error("❌ [USERS] Error initializing users page:", error);
    showEmptyState("Failed to load users. Please refresh the page.");
  }
}

function applyFiltersAndRender() {
  const searchTerm = userSearch?.value || "";
  const filterBy = filterSelect?.value || "all";
  const sortBy = sortSelect?.value || "name";

  // Filter users
  filteredUsers = filterUsers(allUsers, searchTerm, filterBy);

  // Sort users
  filteredUsers = sortUsers(filteredUsers, sortBy);

  // Reset pagination
  currentPage = 0;
  displayedUsers = [];

  // Render first page
  renderUsers();
}

function renderUsers() {
  if (!filteredUsers.length) {
    showEmptyState("No users match your current filters.");
    return;
  }

  // Get users for current page
  const pageUsers = getUsersForPage(filteredUsers, currentPage);

  if (currentPage === 0) {
    usersContainer.innerHTML = "";
  }

  // Render users
  pageUsers.forEach((user) => {
    const card = createUserCard(user);
    usersContainer.appendChild(card);
  });

  displayedUsers = [...displayedUsers, ...pageUsers];

  // Show/hide load more button
  const hasMoreUsers = displayedUsers.length < filteredUsers.length;
  loadMoreContainer.style.display = hasMoreUsers ? "flex" : "none";

  // Show/hide empty state
  emptyState.style.display = filteredUsers.length === 0 ? "flex" : "none";
}

function createUserCard(userData) {
  const card = document.createElement("div");
  card.className = "user-card";
  card.dataset.uid = userData.id;
  card.dataset.name = userData.name || "Anonymous User";

  // Add online status indicator
  const onlineIndicator = userData.isOnline
    ? '<div class="online-indicator"></div>'
    : "";

  // Create skills badges
  const skillsHtml = userData.skills
    ? userData.skills
        .slice(0, 4)
        .map((skill) => `<span class="skill-badge">${skill}</span>`)
        .join("")
    : "";

  // Calculate time since last active
  const timeAgo = getTimeAgo(userData.lastActive);

  card.innerHTML = `
    <div class="user-card-header">
      <div class="user-card-pic" style="background-image: url(${
        userData.photoURL || "assets/imgs/portal_placeholder.gif"
      })"></div>
      ${onlineIndicator}
    </div>

    <div class="user-card-content">
      <h3 class="user-card-name">${userData.name || "Anonymous User"}</h3>
      <p class="user-card-bio">${userData.bio || "Creative developer exploring the digital universe! 🚀"}</p>

      <div class="user-card-stats">
        <div class="stat">
          <span class="stat-icon">📊</span>
          <span class="stat-value">${userData.projectCount || 0}</span>
          <span class="stat-label">Projects</span>
        </div>
        <div class="stat">
          <span class="stat-icon">🕐</span>
          <span class="stat-value">${timeAgo}</span>
          <span class="stat-label">Active</span>
        </div>
      </div>

      <div class="user-card-skills">
        ${skillsHtml}
      </div>
    </div>

    <div class="user-card-actions">
      <button class="chat-btn">
        <span class="btn-icon">💬</span>
        <span class="btn-text">Chat</span>
      </button>
      <a href="/?user=${userData.id}" class="view-profile-btn">
        <span class="btn-icon">👤</span>
        <span class="btn-text">Profile</span>
      </a>
      <button class="follow-btn">
        <span class="btn-icon">➕</span>
        <span class="btn-text">Follow</span>
      </button>
    </div>
  `;

  // Add event listeners
  const chatBtn = card.querySelector(".chat-btn");
  const followBtn = card.querySelector(".follow-btn");

  chatBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleChatClick(userData);
  });

  followBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleFollowClick(userData);
  });

  return card;
}

function showEmptyState(message) {
  usersContainer.innerHTML = "";
  loadMoreContainer.style.display = "none";
  emptyState.style.display = "flex";

  const emptyMessage = emptyState.querySelector("p");
  if (emptyMessage) {
    emptyMessage.textContent = message;
  }
}

function setupEventListeners() {
  // Search input
  if (userSearch) {
    let searchTimeout;
    userSearch.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        applyFiltersAndRender();
      }, 300);
    });
  }

  // Filter and sort selects
  if (filterSelect) {
    filterSelect.addEventListener("change", applyFiltersAndRender);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", applyFiltersAndRender);
  }

  // Refresh button
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML =
        '<span>🔄</span><span class="btn-text">Loading...</span>';

      try {
        allUsers = await fetchUsers();
        applyFiltersAndRender();
        showToast("Users refreshed!", "success");
      } catch (error) {
        showToast("Failed to refresh users", "error");
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML =
          '<span>🔄</span><span class="btn-text">Refresh</span>';
      }
    });
  }

  // Load more button
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      currentPage++;
      renderUsers();

      // Smooth scroll to show new content
      if (displayedUsers.length > USERS_PER_PAGE) {
        usersContainer.lastElementChild.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    });
  }

  // Clear filters button
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      if (userSearch) userSearch.value = "";
      if (filterSelect) filterSelect.value = "all";
      if (sortSelect) sortSelect.value = "name";
      applyFiltersAndRender();
    });
  }

  // Set up modal event listeners
  if (closeChatBtn) {
    closeChatBtn.addEventListener("click", closeChat);
  }

  if (chatSendBtn) {
    chatSendBtn.addEventListener("click", sendMessage);
  }

  if (chatMessageInput) {
    chatMessageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }

  if (errorCloseBtn) {
    errorCloseBtn.addEventListener("click", hideErrorModal);
  }

  if (errorRetryBtn) {
    errorRetryBtn.addEventListener("click", () => {
      hideErrorModal();
      initializeUsersPage();
    });
  }
}

// Filter and sort functions
function filterUsers(users, searchTerm, filterBy) {
  let filtered = [...users];

  // Search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.bio?.toLowerCase().includes(term) ||
        user.skills?.some((skill) => skill.toLowerCase().includes(term))
    );
  }

  // Category filter
  if (filterBy && filterBy !== "all") {
    switch (filterBy) {
      case "online":
        filtered = filtered.filter((user) => user.isOnline);
        break;
      case "recent":
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (user) => user.lastActive && new Date(user.lastActive) > oneDayAgo
        );
        break;
      case "creators":
        filtered = filtered.filter((user) => user.projectCount > 0);
        break;
    }
  }

  return filtered;
}

function sortUsers(users, sortBy) {
  const sorted = [...users];

  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    case "recent":
      return sorted.sort(
        (a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0)
      );
    case "projects":
      return sorted.sort(
        (a, b) => (b.projectCount || 0) - (a.projectCount || 0)
      );
    case "random":
      return sorted.sort(() => Math.random() - 0.5);
    default:
      return sorted;
  }
}

function getUsersForPage(users, page) {
  const start = page * USERS_PER_PAGE;
  const end = start + USERS_PER_PAGE;
  return users.slice(start, end);
}

// Initialize the page
initializeUsersPage();

// === ERROR HANDLING ===
function showErrorModal(title, message, retryFunction = null) {
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  errorModal.style.display = "flex";

  // Store retry function if provided
  if (retryFunction) {
    errorRetryBtn.onclick = () => {
      hideErrorModal();
      retryFunction();
    };
  }
}

function hideErrorModal() {
  errorModal.style.display = "none";
}

function logError(error, context = "Unknown") {
  console.error(`❌ [USERS] Error in ${context}:`, error);

  // Determine error type and show appropriate message
  let title = "Error";
  let message = "An unexpected error occurred.";

  if (error.code === "permission-denied") {
    title = "Access Denied";
    message =
      "You don't have permission to access this feature. Please log in.";
  } else if (error.code === "unavailable") {
    title = "Connection Error";
    message =
      "Unable to connect to the server. Please check your internet connection.";
  } else if (error.code === "not-found") {
    title = "Not Found";
    message = "The requested resource was not found.";
  } else if (error.message.includes("recaptcha")) {
    title = "Security Check Failed";
    message = "The security verification failed. Please try again.";
  }

  showErrorModal(title, message);
}

// === USER FETCHING ===
async function fetchUsers() {
  try {
    console.log("📡 [USERS] Fetching users from database");

    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = [];

    usersSnapshot.forEach((doc) => {
      if (currentUser && doc.id === currentUser.uid) return; // Don't show current user
      const userData = { id: doc.id, ...doc.data() };

      // Add mock data for enhanced features
      userData.isOnline = Math.random() > 0.7; // 30% chance of being online
      userData.projectCount = Math.floor(Math.random() * 10); // 0-9 projects
      userData.lastActive = new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ); // Last 7 days
      userData.bio =
        userData.bio || "Creative developer exploring the digital universe! 🚀";
      userData.skills = userData.skills || [
        "JavaScript",
        "React",
        "Design",
        "Innovation",
      ];

      users.push(userData);
    });

    console.log(`✅ [USERS] Loaded ${users.length} users`);
    return users;
  } catch (error) {
    console.error("❌ [USERS] Error fetching users:", error);
    logError(error, "fetchUsers");
    throw error;
  }
}

// === USER STATS ===
function updateUserStats() {
  console.log("📈 [USERS] Updating user statistics");

  const totalUsers = allUsers.length;
  const onlineUsers = allUsers.filter((user) => user.isOnline).length;
  const activeToday = allUsers.filter((user) => {
    if (!user.lastActive) return false;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(user.lastActive) > oneDayAgo;
  }).length;

  // Animate numbers
  animateNumber("total-users", totalUsers);
  animateNumber("online-users", onlineUsers);
  animateNumber("active-today", activeToday);
}

function animateNumber(elementId, targetNumber) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const startNumber = parseInt(element.textContent) || 0;
  const duration = 1000;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentNumber = Math.round(
      startNumber + (targetNumber - startNumber) * progress
    );
    element.textContent = currentNumber;

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }

  requestAnimationFrame(updateNumber);
}

// === TOAST NOTIFICATIONS ===
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast-notification ${type}`;
  toast.textContent = message;

  if (toastContainer) {
    toastContainer.appendChild(toast);
  } else {
    document.body.appendChild(toast);
  }

  // Add fade-in animation
  toast.classList.add("fade-in");

  // Auto remove after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }, 4000);
}

// === UTILITY FUNCTIONS ===
function getTimeAgo(date) {
  if (!date) return "Unknown";

  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
  if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;
  return `${Math.floor(diffInDays / 7)}w ago`;
}

// === EVENT HANDLERS ===
function handleChatClick(userData) {
  if (!currentUser) {
    showErrorModal(
      "Login Required",
      "Please log in to start a chat with other users.",
      () => {
        window.location.href = "/";
      }
    );
    return;
  }

  openChat(userData.id, userData.name || "Anonymous User");
}

function handleFollowClick(userData) {
  console.log("➕ [USERS] Follow button clicked for:", userData.name);

  if (!currentUser) {
    showErrorModal(
      "Login Required",
      "Please log in to follow other users.",
      () => {
        window.location.href = "/";
      }
    );
    return;
  }

  // Add follow functionality here
  showToast(`Now following ${userData.name || "this user"}! 🎉`, "success");
}

// === CHAT FUNCTIONALITY ===
function openChat(otherUserId, otherUserName) {
  try {
    chatWithUserEl.textContent = `Chat with ${otherUserName}`;

    // Create a consistent chat room ID
    const uids = [currentUser.uid, otherUserId].sort();
    currentChatRoomId = `chat_${uids[0]}_${uids[1]}`;

    chatMessagesEl.innerHTML = ""; // Clear previous messages
    chatModal.style.display = "flex";

    // Listen for new messages
    const messagesRef = collection(db, "chats", currentChatRoomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"), limit(50));

    unsubscribeFromChat = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msgData = change.doc.data();
            addMessageToChat(msgData);
          }
        });
        // Scroll to the bottom
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
      },
      (error) => {
        logError(error, "chatListener");
      }
    );
  } catch (error) {
    logError(error, "openChat");
  }
}

function addMessageToChat(msgData) {
  const messageEl = document.createElement("div");
  messageEl.className = "message";
  messageEl.classList.add(
    msgData.senderId === currentUser.uid ? "sent" : "received"
  );
  messageEl.textContent = msgData.text;
  chatMessagesEl.appendChild(messageEl);
}

async function sendMessage() {
  const messageText = chatMessageInput.value.trim();
  if (messageText === "" || !currentChatRoomId || !currentUser) return;

  try {
    // Disable send button while sending
    chatSendBtn.disabled = true;
    chatSendBtn.textContent = "Sending...";

    const messagesRef = collection(db, "chats", currentChatRoomId, "messages");
    await addDoc(messagesRef, {
      text: messageText,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    });

    chatMessageInput.value = "";
  } catch (error) {
    logError(error, "sendMessage");
    showErrorModal("Send Failed", "Failed to send message. Please try again.");
  } finally {
    // Re-enable send button
    chatSendBtn.disabled = false;
    chatSendBtn.textContent = "Send";
  }
}

function closeChat() {
  chatModal.style.display = "none";
  if (unsubscribeFromChat) {
    unsubscribeFromChat();
    unsubscribeFromChat = null;
  }
  currentChatRoomId = null;
  chatMessageInput.value = "";
}

// === AUTHENTICATION ===
onAuthStateChanged(auth, async (user) => {
  console.log("🔐 [USERS] Auth state changed", { userId: user?.uid });
  currentUser = user;

  if (user) {
    if (allUsers.length > 0) {
      // Re-apply filters to update UI
      applyFiltersAndRender();
      updateUserStats();
    }
  } else {
    // Clear user-specific data
    currentChatRoomId = null;
    if (unsubscribeFromChat) {
      unsubscribeFromChat();
      unsubscribeFromChat = null;
    }
  }
});

// === ENHANCED FEATURES ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 [USERS] Initializing enhanced features");

  // Initialize enhanced features
  initializeEnhancedFeatures();
});

// Enhanced features for better UX
function initializeEnhancedFeatures() {
  // Add smooth scrolling for better navigation
  document.documentElement.style.scrollBehavior = "smooth";

  // Initialize keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // Add focus management for accessibility
  initializeFocusManagement();

  // Initialize intersection observer for animations
  initializeScrollAnimations();
}

function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    if (userSearch) {
      userSearch.focus();
      userSearch.select();
    }
  }

  // Escape to clear search
  if (e.key === "Escape" && document.activeElement === userSearch) {
    userSearch.value = "";
    applyFiltersAndRender();
  }
}

function initializeFocusManagement() {
  // Ensure focus is visible for keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      document.body.classList.add("keyboard-navigation");
    }
  });

  document.addEventListener("mousedown", () => {
    document.body.classList.remove("keyboard-navigation");
  });
}

function initializeScrollAnimations() {
  // Add fade-in animations for cards as they enter viewport
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in");
        animationObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all user cards for animation
  document.querySelectorAll(".user-card").forEach((card) => {
    animationObserver.observe(card);
  });
}

// === GLOBAL ERROR HANDLER ===
window.addEventListener("error", (event) => {
  logError(event.error, "Global Error");
});

window.addEventListener("unhandledrejection", (event) => {
  logError(event.reason, "Unhandled Promise Rejection");
});

// === RECAPTCHA ERROR HANDLER ===
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "recaptcha-error") {
    showErrorModal(
      "Security Check Failed",
      "The security verification failed. Please refresh the page and try again."
    );
  }
});
