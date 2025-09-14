import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { auth, db, onAuthStateChanged } from "../../core/firebase-core.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 [USERS PAGE] Initializing Users Explore Page");

  // DOM Elements
  const usersContainer = document.getElementById("users-container");
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

  // State Management
  let currentUser = null;
  let unsubscribeFromChat = null;
  let currentChatRoomId = null;
  let isLoading = true;
  let usersData = [];
  let filteredUsers = [];
  let currentFilter = "all";
  let currentSort = "name";

  // Initialize the app
  initializeApp();

  function initializeApp() {
    console.log(
      "🔧 [USERS PAGE] Setting up modular components and event listeners"
    );

    // Initialize modular components
    initializeSearchAndFilters();
    initializeUserStats();
    initializeThemeToggle();

    // Set up error modal event listeners
    errorCloseBtn.addEventListener("click", hideErrorModal);
    errorRetryBtn.addEventListener("click", () => {
      hideErrorModal();
      fetchUsers();
    });

    // Set up chat modal event listeners
    closeChatBtn.addEventListener("click", closeChat);
    chatSendBtn.addEventListener("click", sendMessage);
    chatMessageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      if (user) {
        console.log("✅ [USERS PAGE] User authenticated:", user.uid);
        fetchUsers();
      } else {
        console.log("❌ [USERS PAGE] No user authenticated");
        showEmptyState("Please log in to view users");
      }
    });
  }

  // === ERROR HANDLING ===
  function showErrorModal(title, message, retryFunction = null) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorModal.classList.add("show");

    // Store retry function if provided
    if (retryFunction) {
      errorRetryBtn.onclick = () => {
        hideErrorModal();
        retryFunction();
      };
    }
  }

  function hideErrorModal() {
    errorModal.classList.remove("show");
  }

  function logError(error, context = "Unknown") {
    console.error(`Error in ${context}:`, error);

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

  // === LOADING STATES ===
  function showLoading() {
    isLoading = true;
    usersContainer.innerHTML = `
      <div class="users-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading Users...</div>
      </div>
    `;
  }

  function showEmptyState(message) {
    isLoading = false;
    usersContainer.innerHTML = `
      <div class="users-empty">
        <h3>No Users Found</h3>
        <p>${message}</p>
      </div>
    `;
  }

  // === MODULAR COMPONENTS ===

  function initializeSearchAndFilters() {
    console.log("🔍 [USERS PAGE] Initializing search and filters component");

    // Create search and filter bar
    const header = document.querySelector(".page-header");
    const searchFilterBar = document.createElement("div");
    searchFilterBar.className = "search-filter-bar";
    searchFilterBar.innerHTML = `
      <div class="search-container">
        <input type="text" id="user-search" placeholder="🔍 Search users..." class="search-input">
        <button id="clear-search" class="clear-search-btn">✕</button>
      </div>
      <div class="filter-container">
        <select id="user-filter" class="filter-select">
          <option value="all">👥 All Users</option>
          <option value="online">🟢 Online Now</option>
          <option value="recent">🕐 Recently Active</option>
          <option value="creators">🎨 Content Creators</option>
        </select>
        <select id="user-sort" class="sort-select">
          <option value="name">📝 Name (A-Z)</option>
          <option value="recent">⏰ Recent Activity</option>
          <option value="projects">📊 Most Projects</option>
          <option value="random">🎲 Random</option>
        </select>
      </div>
    `;

    header.appendChild(searchFilterBar);

    // Add event listeners
    const searchInput = document.getElementById("user-search");
    const clearSearchBtn = document.getElementById("clear-search");
    const filterSelect = document.getElementById("user-filter");
    const sortSelect = document.getElementById("user-sort");

    searchInput.addEventListener("input", handleSearch);
    clearSearchBtn.addEventListener("click", clearSearch);
    filterSelect.addEventListener("change", handleFilter);
    sortSelect.addEventListener("change", handleSort);
  }

  function initializeUserStats() {
    console.log("📊 [USERS PAGE] Initializing user stats component");

    const header = document.querySelector(".page-header");
    const statsBar = document.createElement("div");
    statsBar.className = "user-stats-bar";
    statsBar.innerHTML = `
      <div class="stat-item">
        <span class="stat-number" id="total-users">0</span>
        <span class="stat-label">Total Users</span>
      </div>
      <div class="stat-item">
        <span class="stat-number" id="online-users">0</span>
        <span class="stat-label">Online Now</span>
      </div>
      <div class="stat-item">
        <span class="stat-number" id="active-today">0</span>
        <span class="stat-label">Active Today</span>
      </div>
    `;

    header.appendChild(statsBar);
  }

  function initializeThemeToggle() {
    console.log("🎨 [USERS PAGE] Initializing theme toggle component");

    const header = document.querySelector(".page-header");
    const themeToggle = document.createElement("button");
    themeToggle.className = "theme-toggle-btn";
    themeToggle.innerHTML = "🌙";
    themeToggle.title = "Toggle Dark/Light Theme";

    themeToggle.addEventListener("click", toggleTheme);
    header.appendChild(themeToggle);
  }

  function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    console.log("🔍 [USERS PAGE] Searching for:", searchTerm);

    if (searchTerm === "") {
      filteredUsers = [...usersData];
    } else {
      filteredUsers = usersData.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm) ||
          user.bio?.toLowerCase().includes(searchTerm)
      );
    }

    applyFiltersAndSort();
    updateUserStats();
  }

  function clearSearch() {
    console.log("🧹 [USERS PAGE] Clearing search");
    document.getElementById("user-search").value = "";
    filteredUsers = [...usersData];
    applyFiltersAndSort();
    updateUserStats();
  }

  function handleFilter(e) {
    currentFilter = e.target.value;
    console.log("🔧 [USERS PAGE] Filter changed to:", currentFilter);
    applyFiltersAndSort();
  }

  function handleSort(e) {
    currentSort = e.target.value;
    console.log("📊 [USERS PAGE] Sort changed to:", currentSort);
    applyFiltersAndSort();
  }

  function applyFiltersAndSort() {
    let users = [...filteredUsers];

    // Apply filters
    switch (currentFilter) {
      case "online":
        users = users.filter((user) => user.isOnline);
        break;
      case "recent":
        // Filter users active in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        users = users.filter(
          (user) => user.lastActive && new Date(user.lastActive) > oneDayAgo
        );
        break;
      case "creators":
        users = users.filter((user) => user.projectCount > 0);
        break;
    }

    // Apply sorting
    switch (currentSort) {
      case "name":
        users.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "recent":
        users.sort(
          (a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0)
        );
        break;
      case "projects":
        users.sort((a, b) => (b.projectCount || 0) - (a.projectCount || 0));
        break;
      case "random":
        users = users.sort(() => Math.random() - 0.5);
        break;
    }

    renderUsers(users);
  }

  function updateUserStats() {
    console.log("📈 [USERS PAGE] Updating user statistics");

    const totalUsers = usersData.length;
    const onlineUsers = usersData.filter((user) => user.isOnline).length;
    const activeToday = usersData.filter((user) => {
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

  function toggleTheme() {
    console.log("🎨 [USERS PAGE] Toggling theme");
    const body = document.body;
    const isDark = body.classList.contains("light-theme");

    if (isDark) {
      body.classList.remove("light-theme");
      body.classList.add("dark-theme");
    } else {
      body.classList.remove("dark-theme");
      body.classList.add("light-theme");
    }
  }

  // === USER FETCHING ===
  const fetchUsers = async () => {
    if (!usersContainer) return;

    console.log("📡 [USERS PAGE] Fetching users from database");
    showLoading();

    try {
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
          userData.bio ||
          "Creative developer exploring the digital universe! 🚀";
        userData.skills = userData.skills || [
          "JavaScript",
          "React",
          "Design",
          "Innovation",
        ];

        users.push(userData);
      });

      if (users.length === 0) {
        showEmptyState("No other users found. Be the first to join!");
        return;
      }

      // Store users data and initialize filtering
      usersData = users;
      filteredUsers = [...users];

      console.log(`✅ [USERS PAGE] Loaded ${users.length} users`);
      renderUsers(users);
      updateUserStats();
    } catch (error) {
      console.error("❌ [USERS PAGE] Error fetching users:", error);
      logError(error, "fetchUsers");
      showEmptyState("Failed to load users. Please try again.");
    }
  };

  function renderUsers(users) {
    isLoading = false;
    usersContainer.innerHTML = "";

    users.forEach((userData) => {
      const card = createUserCard(userData);
      usersContainer.appendChild(card);
    });
  }

  function createUserCard(userData) {
    console.log(
      "🎨 [USERS PAGE] Creating enhanced user card for:",
      userData.name
    );

    const card = document.createElement("div");
    card.className = "user-card";
    card.dataset.uid = userData.id;
    card.dataset.name = userData.name;

    // Add online status indicator
    const onlineIndicator = userData.isOnline
      ? '<div class="online-indicator"></div>'
      : "";

    // Create skills badges
    const skillsHtml = userData.skills
      ? userData.skills
          .slice(0, 3)
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
          </div>
        </div>
        
        <div class="user-card-skills">
          ${skillsHtml}
        </div>
      </div>
      
      <div class="user-card-hover">
        <button class="chat-btn">
          <span class="btn-icon">💬</span>
          <span class="btn-text">Chat</span>
        </button>
        <a href="/?user=${userData.id}" class="view-profile-btn">
          <span class="btn-icon">👤</span>
          <span class="btn-text">View Profile</span>
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

    // Add click handler for view profile button
    const viewProfileBtn = card.querySelector(".view-profile-btn");
    viewProfileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleViewProfileClick(userData);
    });

    // Add click animation
    card.addEventListener("click", () => {
      card.style.transform = "scale(0.98)";
      setTimeout(() => {
        card.style.transform = "";
      }, 150);
    });

    return card;
  }

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

  function handleViewProfileClick(userData) {
    console.log(
      "👤 [USERS PAGE] View Profile button clicked for:",
      userData.name,
      "(" + userData.id + ")"
    );

    // Construct the profile URL
    const profileUrl = `/?user=${userData.id}`;
    console.log("🔗 [USERS PAGE] Navigating to profile URL:", profileUrl);

    // Navigate to the user's profile with their widget timeline
    window.location.href = profileUrl;
  }

  function handleFollowClick(userData) {
    console.log("➕ [USERS PAGE] Follow button clicked for:", userData.name);

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
    // For now, just show a success message
    showNotification(`Now following ${userData.name}! 🎉`, "success");
  }

  function showNotification(message, type = "info") {
    console.log("🔔 [USERS PAGE] Showing notification:", message);

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
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
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  function handleChatClick(userData) {
    if (!currentUser) {
      showErrorModal(
        "Login Required",
        "Please log in to start a chat with other users.",
        () => {
          // Redirect to login or show login modal
          window.location.href = "/";
        }
      );
      return;
    }

    openChat(userData.id, userData.name);
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
      const messagesRef = collection(
        db,
        "chats",
        currentChatRoomId,
        "messages"
      );
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

      const messagesRef = collection(
        db,
        "chats",
        currentChatRoomId,
        "messages"
      );
      await addDoc(messagesRef, {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });

      chatMessageInput.value = "";
    } catch (error) {
      logError(error, "sendMessage");
      showErrorModal(
        "Send Failed",
        "Failed to send message. Please try again."
      );
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
});
