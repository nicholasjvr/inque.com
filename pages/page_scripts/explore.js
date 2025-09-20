import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIZcD-L5jD84hEYLxWOwHTE2iTY6EJ0zI",
  authDomain: "inque-31cb5.firebaseapp.com",
  projectId: "inque-31cb5",
  storageBucket: "inque-31cb5.firebasestorage.app",
  messagingSenderId: "338722493567",
  appId: "1:338722493567:web:4c46ecdfe92ddf2a5d5b4a",
  measurementId: "G-KQT58LWVSK",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

const listDiv = document.getElementById("exploreWidgetList");
listDiv.innerHTML = '<div style="color:#fff">Loading widgets...</div>';

// Global state
let currentUser = null;
let followingUsers = new Set();

async function fetchAllWidgets() {
  try {
    console.log("[EXPLORE DEBUG] Fetching widgets from widgets collection");
    const widgetsSnapshot = await getDocs(collection(db, "widgets"));
    const widgets = [];

    widgetsSnapshot.forEach((doc) => {
      const widget = doc.data();
      console.log("[EXPLORE DEBUG] Processing widget", {
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

    console.log("[EXPLORE DEBUG] Total widgets found:", widgets.length);
    return widgets;
  } catch (error) {
    console.error("[EXPLORE DEBUG] Error fetching widgets:", error);
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

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

(async function showWidgets() {
  try {
    let widgets = await fetchAllWidgets();
    if (!widgets.length) {
      listDiv.innerHTML = '<div style="color:#fff">No widgets found yet.</div>';
      return;
    }

    // Filter out widgets without HTML files
    const validWidgets = widgets.filter((widget) => {
      const htmlFile = findHtmlFile(widget.files);
      return htmlFile && htmlFile.downloadURL;
    });

    if (!validWidgets.length) {
      listDiv.innerHTML =
        '<div style="color:#fff">No widgets with HTML files found.</div>';
      return;
    }

    widgets = shuffle(validWidgets).slice(0, 12); // Show up to 12 random widgets
    listDiv.innerHTML = "";

    for (const widget of widgets) {
      const htmlFile = findHtmlFile(widget.files);
      console.log("[EXPLORE DEBUG] Rendering widget", {
        id: widget.id,
        title: widget.title,
        htmlFile: htmlFile?.fileName,
        downloadURL: htmlFile?.downloadURL,
      });

      const card = document.createElement("div");
      card.className = "explore-widget-card";

      // Check if user is following this widget's creator
      const isFollowing = followingUsers.has(widget.userId);
      const isOwnWidget = currentUser && currentUser.uid === widget.userId;

      card.innerHTML = `
        <div class="explore-widget-title">${
          widget.title || "Untitled Widget"
        }</div>
        <div class="explore-widget-user">by ${widget.userName || "Unknown User"}</div>
        ${
          htmlFile && htmlFile.downloadURL
            ? `<iframe class='explore-widget-preview' src='${htmlFile.downloadURL}' sandbox='allow-scripts allow-same-origin'></iframe>`
            : `<div style='height:200px;display:flex;align-items:center;justify-content:center;background:#111;border-radius:6px;color:#888;'>No Preview</div>`
        }
        <div class="explore-widget-actions">
          <a href='/?user=${
            widget.userId
          }' class="explore-profile-link">👤 View Profile</a>
          ${
            !isOwnWidget
              ? `
            <button class="explore-follow-btn ${isFollowing ? "following" : ""}" 
                    data-user-id="${widget.userId}">
              ${isFollowing ? "✓ Following" : "+ Follow"}
            </button>
            <button class="explore-message-btn" 
                    data-user-id="${widget.userId}" 
                    data-user-name="${widget.userName || "Unknown User"}">
              💬 Message
            </button>
          `
              : ""
          }
        </div>
      `;
      listDiv.appendChild(card);
    }
  } catch (e) {
    console.error("[EXPLORE DEBUG] Error loading widgets:", e);
    listDiv.innerHTML = `<div style='color:#f66'>Error loading widgets: ${e.message}</div>`;
  }
})();

// Initialize authentication and social features
onAuthStateChanged(auth, async (user) => {
  console.log("[EXPLORE DEBUG] Auth state changed", { userId: user?.uid });
  currentUser = user;

  if (user) {
    await loadUserFollowing();
    // Re-render widgets to update follow buttons
    const widgets = await fetchAllWidgets();
    if (widgets.length > 0) {
      const validWidgets = widgets.filter((widget) => {
        const htmlFile = findHtmlFile(widget.files);
        return htmlFile && htmlFile.downloadURL;
      });
      const shuffledWidgets = shuffle(validWidgets).slice(0, 12);
      renderWidgets(shuffledWidgets);
    }
  } else {
    followingUsers.clear();
    // Re-render widgets to remove follow buttons
    const widgets = await fetchAllWidgets();
    if (widgets.length > 0) {
      const validWidgets = widgets.filter((widget) => {
        const htmlFile = findHtmlFile(widget.files);
        return htmlFile && htmlFile.downloadURL;
      });
      const shuffledWidgets = shuffle(validWidgets).slice(0, 12);
      renderWidgets(shuffledWidgets);
    }
  }
});

// Event delegation for social buttons
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
});

// Helper function to render widgets (extracted from showWidgets)
async function renderWidgets(widgets) {
  listDiv.innerHTML = "";

  for (const widget of widgets) {
    const htmlFile = findHtmlFile(widget.files);
    console.log("[EXPLORE DEBUG] Rendering widget", {
      id: widget.id,
      title: widget.title,
      htmlFile: htmlFile?.fileName,
      downloadURL: htmlFile?.downloadURL,
    });

    const card = document.createElement("div");
    card.className = "explore-widget-card";

    // Check if user is following this widget's creator
    const isFollowing = followingUsers.has(widget.userId);
    const isOwnWidget = currentUser && currentUser.uid === widget.userId;

    card.innerHTML = `
      <div class="explore-widget-title">${
        widget.title || "Untitled Widget"
      }</div>
      <div class="explore-widget-user">by ${widget.userName || "Unknown User"}</div>
      ${
        htmlFile && htmlFile.downloadURL
          ? `<iframe class='explore-widget-preview' src='${htmlFile.downloadURL}' sandbox='allow-scripts allow-same-origin'></iframe>`
          : `<div style='height:200px;display:flex;align-items:center;justify-content:center;background:#111;border-radius:6px;color:#888;'>No Preview</div>`
      }
      <div class="explore-widget-actions">
        <a href='/?user=${
          widget.userId
        }' class="explore-profile-link">👤 View Profile</a>
        ${
          !isOwnWidget
            ? `
          <button class="explore-follow-btn ${isFollowing ? "following" : ""}" 
                  data-user-id="${widget.userId}">
            ${isFollowing ? "✓ Following" : "+ Follow"}
          </button>
          <button class="explore-message-btn" 
                  data-user-id="${widget.userId}" 
                  data-user-name="${widget.userName || "Unknown User"}">
            💬 Message
          </button>
        `
            : ""
        }
      </div>
    `;
    listDiv.appendChild(card);
  }
}

// Mobile menu functionality
document.addEventListener("DOMContentLoaded", () => {
  console.log("[EXPLORE DEBUG] Initializing mobile menu functionality");

  // Create mobile menu toggle button
  const createMobileMenuToggle = () => {
    if (window.innerWidth <= 480) {
      const header = document.querySelector(".explore-header");
      const headerActions = document.querySelector(".header-actions");

      if (
        header &&
        headerActions &&
        !document.querySelector(".mobile-menu-toggle")
      ) {
        const mobileToggle = document.createElement("button");
        mobileToggle.className = "mobile-menu-toggle";
        mobileToggle.innerHTML = "☰";
        mobileToggle.setAttribute("aria-label", "Toggle navigation menu");

        header.appendChild(mobileToggle);

        mobileToggle.addEventListener("click", () => {
          console.log("[EXPLORE DEBUG] Mobile menu toggled");
          headerActions.classList.toggle("show");

          // Update button icon
          mobileToggle.innerHTML = headerActions.classList.contains("show")
            ? "✕"
            : "☰";
        });

        // Close menu when clicking outside
        document.addEventListener("click", (e) => {
          if (
            !header.contains(e.target) &&
            headerActions.classList.contains("show")
          ) {
            headerActions.classList.remove("show");
            mobileToggle.innerHTML = "☰";
          }
        });
      }
    }
  };

  // Initialize mobile menu on load
  createMobileMenuToggle();

  // Re-initialize on resize
  window.addEventListener("resize", () => {
    const mobileToggle = document.querySelector(".mobile-menu-toggle");
    if (mobileToggle && window.innerWidth > 480) {
      mobileToggle.remove();
      document.querySelector(".header-actions").classList.remove("show");
    } else if (window.innerWidth <= 480) {
      createMobileMenuToggle();
    }
  });

  // Initialize lazy loading for better mobile performance
  initializeLazyLoading();
});

// Lazy loading functionality for better mobile performance
function initializeLazyLoading() {
  console.log(
    "[EXPLORE DEBUG] Initializing lazy loading for mobile performance"
  );

  const observerOptions = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
  };

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        if (iframe.dataset.src) {
          iframe.src = iframe.dataset.src;
          iframe.removeAttribute("data-src");
          imageObserver.unobserve(iframe);
        }
      }
    });
  }, observerOptions);

  // Apply lazy loading to widget previews
  document.querySelectorAll(".explore-widget-preview").forEach((iframe) => {
    if (iframe.src) {
      iframe.dataset.src = iframe.src;
      iframe.src =
        'data:text/html,<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#111;color:#888;">Loading...</div>';
      imageObserver.observe(iframe);
    }
  });
}

document.querySelectorAll(".quick-action-btn").forEach((btn) => {
  if (
    btn
      .querySelector(".quick-action-text")
      ?.textContent.includes("Add Project to Showcase")
  ) {
    btn.addEventListener("click", () => {
      // Scroll to the upload widget section
      const uploadSection = document.getElementById(
        "widgetSlotUploadContainer"
      );
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: "smooth", block: "center" });
        // Optionally, highlight it for a moment
        uploadSection.style.boxShadow = "0 0 16px 4px #4caf50";
        setTimeout(() => (uploadSection.style.boxShadow = ""), 1200);
      }
    });
  }
});
