import { db, auth, storage } from "../core/firebase-core.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  createProject,
  listUserProjects,
  updateProject,
} from "./widgets/project-manager.js";
import { previewWidget } from "./widgets/widget-preview.js";

// Debug logging utility for timeline manager
const DEBUG = {
  log: (message, data = null) => {
    console.log(`[TIMELINE DEBUG] ${message}`, data || "");
  },
  error: (message, error = null) => {
    console.error(`[TIMELINE DEBUG ERROR] ${message}`, error || "");
  },
  warn: (message, data = null) => {
    console.warn(`[TIMELINE DEBUG WARN] ${message}`, data || "");
  },
};

document.addEventListener("DOMContentLoaded", async function () {
  DEBUG.log("Timeline Manager: Starting initialization");

  // --- Firestore-backed Timeline Data ---
  let timelineProjects = [];
  let widgetEditMode = false;
  let currentlyEditingCard = null;

  // Fetch widgets from Firestore
  async function loadTimelineProjects() {
    DEBUG.log("Timeline Manager: Loading timeline widgets from Firestore");
    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        DEBUG.log(
          "Timeline Manager: User not authenticated, showing guest state"
        );
        timelineProjects = [];
        return;
      }

      // Load widgets from the widgets collection instead of projects
      const widgetsRef = collection(db, "widgets");
      const q = query(widgetsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      timelineProjects = querySnapshot.docs.map(doc => {
        const data = doc.data();
        DEBUG.log("Timeline Manager: Processing widget", {
          id: doc.id,
          title: data.title,
          slot: data.slot,
          userId: data.userId
        });
        return {
          id: doc.id,
          title: data.title || "Untitled Widget",
          desc: data.description || "No description available",
          slot: data.slot,
          files: data.files || [],
          createdAt: data.createdAt
        };
      });

      DEBUG.log("Timeline Manager: Widgets loaded successfully", {
        count: timelineProjects.length,
        widgets: timelineProjects.map(w => ({ id: w.id, title: w.title, slot: w.slot }))
      });
    } catch (error) {
      DEBUG.error("Timeline Manager: Failed to load widgets", error);
      // Don't show error for unauthenticated users
      if (error.message !== "Not logged in.") {
        console.error("Timeline Manager: Widget loading error", error);
      }
      timelineProjects = [];
    }
  }

  // Render timeline from Firestore data
  async function renderAllWidgetCards() {
    DEBUG.log("Timeline Manager: Rendering all widget cards");
    await loadTimelineProjects();
    
    const timelineEvents = document.querySelectorAll(".timeline-event");
    DEBUG.log("Timeline Manager: Found timeline events", {
      count: timelineEvents.length,
    });
    
    if (timelineEvents.length === 0) {
      DEBUG.warn("Timeline Manager: No timeline events found in DOM");
      return;
    }

    timelineEvents.forEach((event, idx) => {
      // Remove any previous card
      const oldCard = event.querySelector(".timeline-event-card");
      if (oldCard) {
        DEBUG.log("Timeline Manager: Removing old card", { index: idx });
        oldCard.remove();
      }

      // Get project data for this slot (if any)
      const project = timelineProjects[idx];
      const card = document.createElement("div");
      card.className = "timeline-event-card";

      if (project) {
        DEBUG.log("Timeline Manager: Rendering project card", {
          index: idx,
          projectId: project.id,
          title: project.title,
        });

        if (currentlyEditingCard === project.id) {
          // Edit mode for this card
          DEBUG.log("Timeline Manager: Rendering edit mode for card", {
            projectId: project.id,
          });
          card.innerHTML = `
            <input class="widget-edit-title" value="${
              project.title || ""
            }" style="width:100%;margin-bottom:8px;" />
            <textarea class="widget-edit-desc" style="width:100%;margin-bottom:8px;">${
              project.desc || ""
            }</textarea>
            <button class="widget-save-btn">💾 Save</button>
            <button class="widget-cancel-btn">Cancel</button>
          `;
          card
            .querySelector(".widget-save-btn")
            .addEventListener("click", async () => {
              DEBUG.log("Timeline Manager: Save button clicked", {
                projectId: project.id,
              });
              const newTitle = card.querySelector(".widget-edit-title").value;
              const newDesc = card.querySelector(".widget-edit-desc").value;
              try {
                // Update widget in Firestore
                const widgetRef = doc(db, "widgets", project.id);
                await updateDoc(widgetRef, {
                  title: newTitle,
                  description: newDesc,
                  updatedAt: new Date()
                });
                DEBUG.log("Timeline Manager: Widget updated successfully", {
                  projectId: project.id,
                });
                currentlyEditingCard = null;
                renderAllWidgetCards();
              } catch (error) {
                DEBUG.error(
                  "Timeline Manager: Failed to update widget",
                  error
                );
                alert("Failed to update widget: " + error.message);
              }
            });
          card
            .querySelector(".widget-cancel-btn")
            .addEventListener("click", () => {
              DEBUG.log("Timeline Manager: Cancel button clicked");
              currentlyEditingCard = null;
              renderAllWidgetCards();
            });
        } else {
          // Normal display mode
          card.innerHTML = `
            <h3>${project.title || "Untitled Widget"}</h3>
            <p>${project.desc || "No description available"}</p>
            <button class="widget-edit-btn">✏️ Edit</button>
          `;
          card
            .querySelector(".widget-edit-btn")
            .addEventListener("click", () => {
              DEBUG.log("Timeline Manager: Edit button clicked", {
                projectId: project.id,
              });
              currentlyEditingCard = project.id;
              renderAllWidgetCards();
            });
        }
      } else {
        // Empty slot
        DEBUG.log("Timeline Manager: Rendering empty slot", { index: idx });
        card.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 3rem; margin-bottom: 10px;">+</div>
            <p style="color: #aaa; margin: 0;">Empty Slot</p>
          </div>
        `;
      }

      event.appendChild(card);
    });

    DEBUG.log("Timeline Manager: All widget cards rendered");
  }

  // Listen for Edit Profile button (assume it has id 'editProfileQuickBtn')
  const editProfileBtn = document.getElementById("editProfileQuickBtn");
  if (editProfileBtn) {
    DEBUG.log("Timeline Manager: Setting up edit profile button handler");
    editProfileBtn.addEventListener("click", async () => {
      DEBUG.log(
        "Timeline Manager: Edit profile button clicked, toggling widget edit mode"
      );

      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        DEBUG.log(
          "Timeline Manager: User not authenticated, showing login prompt"
        );
        alert("Please log in to edit your profile and manage your widgets.");
        return;
      }

      widgetEditMode = !widgetEditMode;
      DEBUG.log("Timeline Manager: Widget edit mode toggled", {
        widgetEditMode,
      });
      renderAllWidgetCards();
    });
  } else {
    DEBUG.warn("Timeline Manager: Edit profile button not found");
  }

  // Initial render
  DEBUG.log("Timeline Manager: Performing initial render");
  renderAllWidgetCards();

  // Widget Modal Function
  function openWidgetModal(widgetPath, widgetTitle) {
    DEBUG.log("Timeline Manager: Opening widget modal", {
      widgetPath,
      widgetTitle,
    });
    const modal = document.getElementById("widgetModal");
    const widgetFrame = document.getElementById("widgetFrame");
    const modalTitle = document.querySelector(".modal-title");

    if (modal && widgetFrame) {
      // Add loading state
      modal.classList.add("loading");

      // Set modal title if available
      if (modalTitle) {
        modalTitle.textContent = widgetTitle || "Widget Preview";
      }

      // Load widget
      widgetFrame.src = widgetPath;
      modal.style.display = "block";

      // Remove loading state when iframe loads
      widgetFrame.onload = function () {
        DEBUG.log("Timeline Manager: Widget iframe loaded successfully");
        modal.classList.remove("loading");
      };

      // Handle iframe load errors
      widgetFrame.onerror = function () {
        DEBUG.error("Timeline Manager: Failed to load widget iframe", {
          widgetPath,
        });
        modal.classList.remove("loading");
        console.error("Failed to load widget:", widgetPath);
      };
    } else {
      DEBUG.error("Timeline Manager: Widget modal elements not found", {
        modal: !!modal,
        widgetFrame: !!widgetFrame,
      });
    }
  }

  // Ensure close button always works for widget modal
  const widgetModal = document.getElementById("widgetModal");
  const widgetFrame = document.getElementById("widgetFrame");
  const closeButton = document.querySelector(".close-button");
  if (closeButton && widgetModal && widgetFrame) {
    DEBUG.log("Timeline Manager: Setting up widget modal close button");
    closeButton.addEventListener("click", function () {
      DEBUG.log("Timeline Manager: Widget modal close button clicked");
      widgetModal.style.display = "none";
      widgetFrame.src = "";
    });
  } else {
    DEBUG.warn("Timeline Manager: Widget modal close elements not found");
  }

  // --- Category Modal Logic ---
  const categoryModal = document.getElementById("categoryModal");
  const categoryModalBody = document.getElementById("categoryModalBody");
  const categoryModalClose = document.querySelector(".category-modal-close");

  const widgetPaths = [
    "widgets/app-widget-1/widget.html",
    "widgets/widget2/index.html",
    "widgets/widget3/index.html",
    "widgets/widget4/index.html",
    "widgets/widget5/index.html",
  ];

  if (categoryModalClose) {
    DEBUG.log("Timeline Manager: Setting up category modal close button");
    categoryModalClose.addEventListener("click", function () {
      DEBUG.log("Timeline Manager: Category modal close button clicked");
      categoryModal.classList.remove("show");
      categoryModalBody.innerHTML = "";
    });
  }
  // Close modal if clicking outside content
  if (categoryModal) {
    categoryModal.addEventListener("click", function (e) {
      if (e.target === categoryModal) {
        DEBUG.log("Timeline Manager: Category modal clicked outside content");
        categoryModal.classList.remove("show");
        categoryModalBody.innerHTML = "";
      }
    });
  }
  // --- END Category Modal Logic ------

  // --- Timeline Track Scroll Carousel Feature ---
  const initTimelineScroll = () => {
    DEBUG.log("Timeline Manager: Initializing timeline scroll functionality");
    const timelineTrack = document.querySelector(".timeline-track");
    const topRow = document.querySelector(".timeline-row.top");
    const bottomRow = document.querySelector(".timeline-row.bottom");
    const scrollbar = document.querySelector(".timeline-scrollbar");
    const handle = document.querySelector(".timeline-scrollbar-handle");

    // Hide scrollbar on mobile
    if (window.innerWidth <= 768) {
      DEBUG.log("Timeline Manager: Hiding scrollbar on mobile");
      if (scrollbar) scrollbar.style.display = "none";
      return;
    } else {
      if (scrollbar) scrollbar.style.display = "block";
    }

    if (timelineTrack && topRow && bottomRow && scrollbar && handle) {
      DEBUG.log(
        "Timeline Manager: All timeline scroll elements found, setting up functionality"
      );
      let topOffset = 0;
      let bottomOffset = 0;
      let maxOffset = 0;
      let isLocked = false;
      let isDragging = false;

      const getScrollLimits = () => {
        const containerWidth = topRow.parentElement.clientWidth;
        const contentWidth = topRow.scrollWidth;
        const maxScroll = Math.max(0, contentWidth - containerWidth);
        maxOffset = maxScroll / 2; // Allow scrolling half left, half right from center
        DEBUG.log("Timeline Manager: Scroll limits calculated", { maxOffset });
      };

      const updatePositions = (smooth = false) => {
        topRow.style.transition = smooth
          ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          : "none";
        bottomRow.style.transition = smooth
          ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          : "none";

        topOffset = Math.max(-maxOffset, Math.min(maxOffset, topOffset));
        bottomOffset = -topOffset;

        topRow.style.transform = `translateX(${topOffset}px)`;
        bottomRow.style.transform = `translateX(${bottomOffset}px)`;

        const scrollPercentage =
          maxOffset > 0 ? (topOffset + maxOffset) / (2 * maxOffset) : 0.5;
        const handleMaxMove = scrollbar.clientWidth - handle.clientWidth;
        handle.style.left = `${scrollPercentage * handleMaxMove}px`;
      };

      // Initial calculation
      getScrollLimits();
      updatePositions();

      // Double-click to lock/unlock
      handle.addEventListener("dblclick", () => {
        isLocked = !isLocked;
        handle.classList.toggle("locked", isLocked);
        DEBUG.log("Timeline Manager: Timeline scroll lock toggled", {
          isLocked,
        });
        if (isLocked) {
          showNotification("Timeline scroll is now LOCKED.");
        } else {
          showNotification("Timeline scroll is UNLOCKED.");
        }
      });

      timelineTrack.addEventListener(
        "wheel",
        (e) => {
          if (isLocked) return;
          e.preventDefault();
          const delta = e.deltaY || e.detail || e.wheelDelta;
          topOffset -= delta > 0 ? 40 : -40;
          updatePositions(true);
        },
        { passive: false }
      );

      handle.addEventListener("mousedown", (e) => {
        if (isLocked) return;
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        handle.style.cursor = "grabbing";
        DEBUG.log("Timeline Manager: Scroll handle drag started");
      });

      window.addEventListener("mouseup", (e) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
        }
        isDragging = false;
        handle.style.cursor = "grab";
        DEBUG.log("Timeline Manager: Scroll handle drag ended");
      });

      window.addEventListener("mousemove", (e) => {
        if (!isDragging || isLocked) return;
        e.preventDefault();
        e.stopPropagation();
        const scrollbarRect = scrollbar.getBoundingClientRect();
        const handleMaxMove = scrollbarRect.width - handle.clientWidth;
        let newLeft = e.clientX - scrollbarRect.left - handle.clientWidth / 2;
        newLeft = Math.max(0, Math.min(handleMaxMove, newLeft));

        const scrollPercentage = newLeft / handleMaxMove;
        topOffset = scrollPercentage * 2 * maxOffset - maxOffset;
        updatePositions();
      });

      window.addEventListener("resize", () => {
        DEBUG.log(
          "Timeline Manager: Window resized, recalculating scroll limits"
        );
        getScrollLimits();
        updatePositions();
      });
    } else {
      DEBUG.warn("Timeline Manager: Missing timeline scroll elements", {
        timelineTrack: !!timelineTrack,
        topRow: !!topRow,
        bottomRow: !!bottomRow,
        scrollbar: !!scrollbar,
        handle: !!handle,
      });
    }
  };

  initTimelineScroll();
  window.addEventListener("resize", initTimelineScroll);

  // --- Notification Modal Logic ---
  const notificationModal = document.getElementById("notificationModal");
  const notificationMessage = document.getElementById("notificationMessage");
  const notificationCloseBtn = document.querySelector(
    ".notification-close-btn"
  );
  const testNotificationBtn = document.getElementById("testNotificationBtn");

  let notificationTimer;

  function showNotification(message) {
    DEBUG.log("Timeline Manager: Showing notification", { message });
    if (notificationTimer) clearTimeout(notificationTimer);

    notificationMessage.textContent = message;
    notificationModal.classList.add("show");

    notificationTimer = setTimeout(() => {
      hideNotification();
    }, 5000);
  }

  function hideNotification() {
    DEBUG.log("Timeline Manager: Hiding notification");
    notificationModal.classList.remove("show");
  }

  if (notificationCloseBtn) {
    DEBUG.log("Timeline Manager: Setting up notification close button");
    notificationCloseBtn.addEventListener("click", hideNotification);
  }

  if (testNotificationBtn) {
    DEBUG.log("Timeline Manager: Setting up test notification button");
    testNotificationBtn.addEventListener("click", () => {
      DEBUG.log("Timeline Manager: Test notification button clicked");
      showNotification("This is a test notification!");
    });
  }

  // Attach event listener for the 'Find Users' link if you want custom behavior
  const findUsersBtn = document.getElementById("findUsersBtn");
  if (findUsersBtn) {
    DEBUG.log("Timeline Manager: Setting up find users button");
    findUsersBtn.addEventListener("click", (e) => {
      DEBUG.log("Timeline Manager: Find users button clicked");
      e.preventDefault();
      console.log("findUsers button clicked");
      // You can navigate or perform any custom action here:
      window.location.href = findUsersBtn.href;
    });
  }

  // Event for the other nav buttons using the common class "nav-action"
  const navActions = document.querySelectorAll(".nav-action");
  DEBUG.log("Timeline Manager: Setting up nav action buttons", {
    count: navActions.length,
  });
  navActions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      DEBUG.log("Timeline Manager: Nav action button clicked", { action });
      console.log(`${action} button clicked`);
      // Perform actions based on the button clicked
      if (action === "leaveNote") {
        // Open Leave Note modal or page
        alert("Opening Leave Note modal...");
      } else if (action === "explore") {
        // Navigate or reveal Explore section
        alert("Navigating to Explore section...");
      } else if (action === "tutorial") {
        // Open Tutorial modal or navigate accordingly
        alert("Opening Tutorial content...");
      }
    });
  });

  const uploadProjectBtn = document.getElementById("uploadProjectBtn");
  if (uploadProjectBtn) {
    DEBUG.log("Timeline Manager: Setting up upload project button");
    uploadProjectBtn.onclick = async () => {
      DEBUG.log("Timeline Manager: Upload project button clicked");
      const files = document.getElementById("projectFiles").files;
      const projectId = Date.now().toString();
      const fileURLs = await uploadProjectFiles(files, projectId);
      await createProject(projectId, {
        files: fileURLs,
        name: "My Widget Project",
      });
      alert("Project uploaded!");
      // Optionally refresh project list
    };
  }

  async function showProjects() {
    DEBUG.log("Timeline Manager: Showing projects");
    const projects = await listUserProjects();
    const listDiv = document.getElementById("projectList");
    listDiv.innerHTML = projects
      .map(
        (p) => `
      <div>
        <strong>${p.name}</strong>
        <button onclick="previewWidget('${p.files["index.html"]}', 'widgetPreview')">Preview</button>
      </div>
    `
      )
      .join("");
  }

  DEBUG.log("Timeline Manager: Initialization complete");
});
