import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  limit,
  where,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { auth, db, onAuthStateChanged } from "../../core/firebase-core.js";

// DOM Elements
const listDiv = document.getElementById("exploreWidgetList");
const searchInput = document.getElementById("widgetSearch");
const sortSelect = document.getElementById("sortSelect");
const categorySelect = document.getElementById("categorySelect");
const refreshBtn = document.getElementById("refreshBtn");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadMoreContainer = document.getElementById("loadMoreContainer");
const emptyState = document.getElementById("emptyState");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

// Global state
let currentUser = null;
let followingUsers = new Set();
let allWidgets = [];
let filteredWidgets = [];
let displayedWidgets = [];
let currentPage = 0;
const WIDGETS_PER_PAGE = 12;

async function fetchAllWidgets() {
  try {
    console.log("[EXPLORE] Fetching widgets from database");
    console.log("[EXPLORE] Firebase db instance:", !!db);
    const widgetsSnapshot = await getDocs(collection(db, "widgets"));
    const widgets = [];

    widgetsSnapshot.forEach((doc) => {
      const widget = doc.data();
      console.log("[EXPLORE] Processing widget", {
        id: doc.id,
        title: widget.title,
        userId: widget.userId,
        fileCount: widget.files?.length || 0,
      });

      // Get user data for display
      widgets.push({
        ...widget,
        id: doc.id,
        userId: widget.userId,
      });
    });

    console.log("[EXPLORE] Total widgets found:", widgets.length);
    return widgets;
  } catch (error) {
    console.error("[EXPLORE] Error fetching widgets:", error);
    showToast("Failed to load widgets", "error");
    return [];
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Filter and sort functions
function filterWidgets(widgets, searchTerm, category) {
  let filtered = [...widgets];

  // Search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (widget) =>
        widget.title?.toLowerCase().includes(term) ||
        widget.description?.toLowerCase().includes(term) ||
        widget.userName?.toLowerCase().includes(term)
    );
  }

  // Category filter
  if (category && category !== "all") {
    filtered = filtered.filter((widget) => {
      // This would need to be implemented based on your widget data structure
      // For now, we'll use a simple category matching
      return widget.category === category || widget.tags?.includes(category);
    });
  }

  return filtered;
}

function sortWidgets(widgets, sortBy) {
  const sorted = [...widgets];

  switch (sortBy) {
    case "recent":
      return sorted.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    case "popular":
      return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    case "name":
      return sorted.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    case "random":
      return shuffle(sorted);
    default:
      return sorted;
  }
}

function getWidgetsForPage(widgets, page) {
  const start = page * WIDGETS_PER_PAGE;
  const end = start + WIDGETS_PER_PAGE;
  return widgets.slice(start, end);
}

// Helper function to find HTML file in widget files array
function findHtmlFile(files) {
  if (!Array.isArray(files) || files.length === 0) return null;

  // First try to find index.html
  const indexFile = files.find(
    (f) => f.fileName && /index\.html?$/i.test(f.fileName)
  );
  if (indexFile) return indexFile;

  // Fallback to any HTML file
  return files.find((f) => f.fileName && /\.html?$/i.test(f.fileName));
}

// Social features functions
async function loadUserFollowing() {
  if (!currentUser) return;

  try {
    console.log("[EXPLORE DEBUG] Loading user following list", {
      userId: currentUser.uid,
    });
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      followingUsers = new Set(userData.following || []);
      console.log("[EXPLORE DEBUG] Following list loaded", {
        count: followingUsers.size,
      });
    }
  } catch (error) {
    console.error("[EXPLORE DEBUG] Error loading following list:", error);
  }
}

async function toggleFollow(targetUserId, buttonElement) {
  if (!currentUser) {
    showToast("Please log in to follow users", "warning");
    return;
  }

  if (currentUser.uid === targetUserId) {
    showToast("You can't follow yourself", "warning");
    return;
  }

  try {
    const isFollowing = followingUsers.has(targetUserId);
    console.log("[EXPLORE DEBUG] Toggling follow", {
      targetUserId,
      isFollowing,
      currentUserId: currentUser.uid,
    });

    if (isFollowing) {
      // Unfollow
      await updateDoc(doc(db, "users", currentUser.uid), {
        following: arrayRemove(targetUserId),
      });
      await updateDoc(doc(db, "users", targetUserId), {
        followers: arrayRemove(currentUser.uid),
      });
      followingUsers.delete(targetUserId);
      buttonElement.textContent = "Follow";
      buttonElement.classList.remove("following");
      showToast("Unfollowed user", "info");
    } else {
      // Follow
      await updateDoc(doc(db, "users", currentUser.uid), {
        following: arrayUnion(targetUserId),
      });
      await updateDoc(doc(db, "users", targetUserId), {
        followers: arrayUnion(currentUser.uid),
      });
      followingUsers.add(targetUserId);
      buttonElement.textContent = "Following";
      buttonElement.classList.add("following");
      showToast("Now following user!", "success");
    }
  } catch (error) {
    console.error("[EXPLORE DEBUG] Error toggling follow:", error);
    showToast("Error updating follow status", "error");
  }
}

function openMessageModal(targetUserId, targetUserName) {
  if (!currentUser) {
    showToast("Please log in to message users", "warning");
    return;
  }

  if (currentUser.uid === targetUserId) {
    showToast("You can't message yourself", "warning");
    return;
  }

  console.log("[EXPLORE DEBUG] Opening message modal", {
    targetUserId,
    targetUserName,
  });

  // Create message modal
  const modal = document.createElement("div");
  modal.className = "message-modal";
  modal.innerHTML = `
    <div class="message-modal-content">
      <div class="message-modal-header">
        <h3>💬 Message ${targetUserName}</h3>
        <button class="message-modal-close">&times;</button>
      </div>
      <div class="message-modal-body">
        <textarea 
          id="messageText" 
          placeholder="Type your message here..." 
          maxlength="500"
          rows="4"
        ></textarea>
        <div class="message-modal-actions">
          <button class="message-send-btn">Send Message</button>
          <button class="message-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = "flex";

  // Event listeners
  const closeBtn = modal.querySelector(".message-modal-close");
  const cancelBtn = modal.querySelector(".message-cancel-btn");
  const sendBtn = modal.querySelector(".message-send-btn");
  const messageText = modal.querySelector("#messageText");

  const closeModal = () => {
    document.body.removeChild(modal);
  };

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  sendBtn.addEventListener("click", async () => {
    const message = messageText.value.trim();
    if (!message) {
      showToast("Please enter a message", "warning");
      return;
    }

    try {
      // In a real implementation, you'd save this to a messages collection
      console.log("[EXPLORE DEBUG] Sending message", {
        to: targetUserId,
        from: currentUser.uid,
        message,
      });

      showToast(`Message sent to ${targetUserName}!`, "success");
      closeModal();
    } catch (error) {
      console.error("[EXPLORE DEBUG] Error sending message:", error);
      showToast("Error sending message", "error");
    }
  });

  // Focus on textarea
  setTimeout(() => messageText.focus(), 100);
}

function showToast(message, type = "info") {
  // Create toast notification
  const toast = document.createElement("div");
  toast.className = `explore-toast explore-toast-${type}`;
  toast.textContent = message;

  const toastContainer = document.getElementById("toastContainer");
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

// Main initialization function
async function initializeExplorePage() {
  try {
    console.log(
      "[EXPLORE] Initializing explore page with Firebase integration"
    );

    // Load widgets
    allWidgets = await fetchAllWidgets();

    if (!allWidgets.length) {
      showEmptyState("No widgets found yet. Check back later!");
      return;
    }

    // Filter valid widgets
    allWidgets = allWidgets.filter((widget) => {
      const htmlFile = findHtmlFile(widget.files);
      return htmlFile && htmlFile.downloadURL;
    });

    if (!allWidgets.length) {
      showEmptyState("No widgets with previews available yet.");
      return;
    }

    // Apply initial filters and sorting
    applyFiltersAndRender();

    // Setup event listeners
    setupEventListeners();

    console.log("[EXPLORE] Explore page initialized successfully");
  } catch (error) {
    console.error("[EXPLORE] Error initializing explore page:", error);
    showEmptyState("Failed to load widgets. Please refresh the page.");
  }
}

function applyFiltersAndRender() {
  const searchTerm = searchInput?.value || "";
  const category = categorySelect?.value || "all";
  const sortBy = sortSelect?.value || "recent";

  // Filter widgets
  filteredWidgets = filterWidgets(allWidgets, searchTerm, category);

  // Sort widgets
  filteredWidgets = sortWidgets(filteredWidgets, sortBy);

  // Reset pagination
  currentPage = 0;
  displayedWidgets = [];

  // Render first page
  renderWidgets();
}

function renderWidgets() {
  if (!filteredWidgets.length) {
    showEmptyState("No widgets match your current filters.");
    return;
  }

  // Get widgets for current page
  const pageWidgets = getWidgetsForPage(filteredWidgets, currentPage);

  if (currentPage === 0) {
    listDiv.innerHTML = "";
  }

  // Render widgets
  pageWidgets.forEach((widget) => {
    const card = createWidgetCard(widget);
    listDiv.appendChild(card);
  });

  displayedWidgets = [...displayedWidgets, ...pageWidgets];

  // Show/hide load more button
  const hasMoreWidgets = displayedWidgets.length < filteredWidgets.length;
  loadMoreContainer.style.display = hasMoreWidgets ? "flex" : "none";

  // Show/hide empty state
  emptyState.style.display = filteredWidgets.length === 0 ? "flex" : "none";
}

function createWidgetCard(widget) {
  const htmlFile = findHtmlFile(widget.files);
  const isFollowing = followingUsers.has(widget.userId);
  const isOwnWidget = currentUser && currentUser.uid === widget.userId;

  const card = document.createElement("div");
  card.className = "explore-widget-card";

  card.innerHTML = `
    <div class="explore-widget-header">
      <h3 class="explore-widget-title">${widget.title || "Untitled Widget"}</h3>
      <div class="explore-widget-user">by ${widget.userName || "Unknown User"}</div>
    </div>

    <div class="explore-widget-preview">
      ${
        htmlFile && htmlFile.downloadURL
          ? `<iframe src="${htmlFile.downloadURL}" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>`
          : `<div class="no-preview">📦 No Preview Available</div>`
      }
    </div>

    <div class="explore-widget-actions">
      <a href="/?user=${widget.userId}" class="explore-profile-link" title="View ${widget.userName || "User"}'s profile">👤 Profile</a>
      ${
        !isOwnWidget
          ? `
        <button class="explore-follow-btn ${isFollowing ? "following" : ""}"
                data-user-id="${widget.userId}"
                title="${isFollowing ? "Unfollow user" : "Follow user"}">
          ${isFollowing ? "✓ Following" : "+ Follow"}
        </button>
        <button class="explore-message-btn"
                data-user-id="${widget.userId}"
                data-user-name="${widget.userName || "Unknown User"}"
                title="Send message">
          💬 Message
        </button>
      `
          : ""
      }
    </div>
  `;

  return card;
}

function showEmptyState(message) {
  listDiv.innerHTML = "";
  loadMoreContainer.style.display = "none";
  emptyState.style.display = "flex";

  const emptyMessage = emptyState.querySelector("p");
  if (emptyMessage) {
    emptyMessage.textContent = message;
  }
}

function setupEventListeners() {
  // Search input
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        applyFiltersAndRender();
      }, 300);
    });
  }

  // Sort and category filters
  if (sortSelect) {
    sortSelect.addEventListener("change", applyFiltersAndRender);
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", applyFiltersAndRender);
  }

  // Refresh button
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML =
        '<span>🔄</span><span class="btn-text">Loading...</span>';

      try {
        allWidgets = await fetchAllWidgets();
        applyFiltersAndRender();
        showToast("Widgets refreshed!", "success");
      } catch (error) {
        showToast("Failed to refresh widgets", "error");
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
      renderWidgets();

      // Smooth scroll to show new content
      if (displayedWidgets.length > WIDGETS_PER_PAGE) {
        listDiv.lastElementChild.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    });
  }

  // Clear filters button
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (sortSelect) sortSelect.value = "recent";
      if (categorySelect) categorySelect.value = "all";
      applyFiltersAndRender();
    });
  }
}

// Initialize the page with error handling
initializeExplorePage().catch((error) => {
  console.error("[EXPLORE] Failed to initialize explore page:", error);
  // Show error message to user
  const listDiv = document.getElementById("exploreWidgetList");
  if (listDiv) {
    listDiv.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Failed to load widgets</h3>
        <p>There was an error loading the explore page. Please refresh the page to try again.</p>
        <button class="empty-action-btn" onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
  }
});

// Initialize authentication and social features
onAuthStateChanged(auth, async (user) => {
  console.log("[EXPLORE] Firebase auth state changed", {
    userId: user?.uid,
    isAuthenticated: !!user,
  });
  currentUser = user;

  if (user) {
    await loadUserFollowing();
    // Re-apply filters to update UI with follow buttons
    if (allWidgets.length > 0) {
      applyFiltersAndRender();
    }
  } else {
    followingUsers.clear();
    // Re-apply filters to update UI without follow buttons
    if (allWidgets.length > 0) {
      applyFiltersAndRender();
    }
  }
});

// Event delegation for social buttons and other interactions
document.addEventListener("click", (e) => {
  if (e.target.matches(".explore-follow-btn")) {
    e.preventDefault();
    const userId = e.target.dataset.userId;
    toggleFollow(userId, e.target);
  }

  if (e.target.matches(".explore-message-btn")) {
    e.preventDefault();
    const userId = e.target.dataset.userId;
    const userName = e.target.dataset.userName;
    openMessageModal(userId, userName);
  }

  // Handle fullscreen preview (if needed)
  if (e.target.matches(".explore-widget-preview iframe")) {
    e.preventDefault();
    // Could implement fullscreen preview here
  }
});
// Enhanced user experience features
document.addEventListener("DOMContentLoaded", () => {
  console.log("[EXPLORE] Initializing enhanced features");

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
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  // Escape to clear search
  if (e.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
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

  // Observe all widget cards for animation
  document.querySelectorAll(".explore-widget-card").forEach((card) => {
    animationObserver.observe(card);
  });
}
