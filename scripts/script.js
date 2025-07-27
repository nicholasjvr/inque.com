import { db, auth, storage } from "./scripts/firebase-init.js";
import {
  createProject,
  listUserProjects,
  updateProject,
} from "./scripts/project-manager.js";
import { previewWidget } from "./scripts/widget-preview.js";

document.addEventListener("DOMContentLoaded", async function () {
  // --- Firestore-backed Timeline Data ---
  let timelineProjects = [];
  let widgetEditMode = false;
  let currentlyEditingCard = null;

  // Fetch projects from Firestore
  async function loadTimelineProjects() {
    timelineProjects = await listUserProjects();
  }

  // Render timeline from Firestore data
  async function renderAllWidgetCards() {
    await loadTimelineProjects();
    const timelineEvents = document.querySelectorAll(".timeline-event");
    timelineEvents.forEach((event, idx) => {
      // Remove any previous card
      const oldCard = event.querySelector(".timeline-event-card");
      if (oldCard) oldCard.remove();

      // Get project data for this slot (if any)
      const project = timelineProjects[idx];
      const card = document.createElement("div");
      card.className = "timeline-event-card";

      if (project) {
        if (currentlyEditingCard === project.id) {
          // Edit mode for this card
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
              const newTitle = card.querySelector(".widget-edit-title").value;
              const newDesc = card.querySelector(".widget-edit-desc").value;
              try {
                await updateProject(project.id, {
                  title: newTitle,
                  desc: newDesc,
                });
                currentlyEditingCard = null;
                card.classList.add("refreshing");
                setTimeout(() => {
                  card.classList.remove("refreshing");
                  renderAllWidgetCards();
                }, 600);
              } catch (e) {
                alert("Failed to update project: " + e.message);
              }
            });
          card
            .querySelector(".widget-cancel-btn")
            .addEventListener("click", () => {
              currentlyEditingCard = null;
              renderAllWidgetCards();
            });
        } else {
          // Normal view mode
          card.innerHTML = `
            <h3>${project.title || "Untitled Widget"}</h3>
            <p>${project.desc || ""}</p>
            <div class="widget-preview-container">
              <div class="portal-overlay"></div>
              <img src="assets/imgs/portal_placeholder.gif" class="widget-placeholder-img" />
            </div>
            ${
              project.files && project.files["index.html"]
                ? `<button class="widget-preview-btn" data-widget-path="${project.files["index.html"]}">Open Full View</button>`
                : ""
            }
            ${
              widgetEditMode
                ? '<button class="widget-edit-btn" title="Edit">✏️</button>'
                : ""
            }
          `;
          // Edit button
          if (widgetEditMode) {
            card
              .querySelector(".widget-edit-btn")
              .addEventListener("click", () => {
                currentlyEditingCard = project.id;
                renderAllWidgetCards();
              });
          }
          // Preview button
          const previewBtn = card.querySelector(".widget-preview-btn");
          if (previewBtn && !previewBtn.disabled) {
            previewBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              const widgetPath = this.dataset.widgetPath;
              if (widgetPath) {
                openWidgetModal(widgetPath, project.title);
              }
            });
          }
        }
      } else {
        // Placeholder for an empty slot
        card.innerHTML = `
          <div class="empty-widget-slot">
            <button class="add-widget-btn">+</button>
          </div>
        `;
      }
      event.appendChild(card);
    });
  }

  // Listen for Edit Profile button (assume it has id 'editProfileQuickBtn')
  document
    .getElementById("editProfileQuickBtn")
    ?.addEventListener("click", () => {
      widgetEditMode = !widgetEditMode;
      renderAllWidgetCards();
    });

  // Initial render
  renderAllWidgetCards();

  // Widget Modal Function
  function openWidgetModal(widgetPath, widgetTitle) {
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
        modal.classList.remove("loading");
      };

      // Handle iframe load errors
      widgetFrame.onerror = function () {
        modal.classList.remove("loading");
        console.error("Failed to load widget:", widgetPath);
      };
    }
  }

  // Ensure close button always works for widget modal
  const widgetModal = document.getElementById("widgetModal");
  const widgetFrame = document.getElementById("widgetFrame");
  const closeButton = document.querySelector(".close-button");
  if (closeButton && widgetModal && widgetFrame) {
    closeButton.addEventListener("click", function () {
      widgetModal.style.display = "none";
      widgetFrame.src = "";
    });
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
    categoryModalClose.addEventListener("click", function () {
      categoryModal.classList.remove("show");
      categoryModalBody.innerHTML = "";
    });
  }
  // Close modal if clicking outside content
  if (categoryModal) {
    categoryModal.addEventListener("click", function (e) {
      if (e.target === categoryModal) {
        categoryModal.classList.remove("show");
        categoryModalBody.innerHTML = "";
      }
    });
  }
  // --- END Category Modal Logic ------

  // --- Timeline Track Scroll Carousel Feature ---
  const initTimelineScroll = () => {
    if (window.innerWidth <= 768) return; // Don't run on mobile

    const timelineTrack = document.querySelector(".timeline-track");
    const topRow = document.querySelector(".timeline-row.top");
    const bottomRow = document.querySelector(".timeline-row.bottom");
    const scrollbar = document.querySelector(".timeline-scrollbar");
    const handle = document.querySelector(".timeline-scrollbar-handle");

    if (timelineTrack && topRow && bottomRow && scrollbar && handle) {
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

      handle.addEventListener("mousedown", () => {
        if (isLocked) return;
        isDragging = true;
        handle.style.cursor = "grabbing";
      });

      window.addEventListener("mouseup", () => {
        isDragging = false;
        handle.style.cursor = "grab";
      });

      window.addEventListener("mousemove", (e) => {
        if (!isDragging || isLocked) return;
        const scrollbarRect = scrollbar.getBoundingClientRect();
        const handleMaxMove = scrollbarRect.width - handle.clientWidth;
        let newLeft = e.clientX - scrollbarRect.left - handle.clientWidth / 2;
        newLeft = Math.max(0, Math.min(handleMaxMove, newLeft));

        const scrollPercentage = newLeft / handleMaxMove;
        topOffset = scrollPercentage * 2 * maxOffset - maxOffset;
        updatePositions();
      });

      window.addEventListener("resize", () => {
        getScrollLimits();
        updatePositions();
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
    if (notificationTimer) clearTimeout(notificationTimer);

    notificationMessage.textContent = message;
    notificationModal.classList.add("show");

    notificationTimer = setTimeout(() => {
      hideNotification();
    }, 5000);
  }

  function hideNotification() {
    notificationModal.classList.remove("show");
  }

  if (notificationCloseBtn) {
    notificationCloseBtn.addEventListener("click", hideNotification);
  }

  if (testNotificationBtn) {
    testNotificationBtn.addEventListener("click", () => {
      showNotification("This is a test notification!");
    });
  }

  // Attach event listener for the 'Find Users' link if you want custom behavior
  const findUsersBtn = document.getElementById("findUsersBtn");
  if (findUsersBtn) {
    findUsersBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("findUsers button clicked");
      // You can navigate or perform any custom action here:
      window.location.href = findUsersBtn.href;
    });
  }

  // Event for the other nav buttons using the common class "nav-action"
  const navActions = document.querySelectorAll(".nav-action");
  navActions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
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

  document.getElementById("uploadProjectBtn").onclick = async () => {
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

  async function showProjects() {
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
});
