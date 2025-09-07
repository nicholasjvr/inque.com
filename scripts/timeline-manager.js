// Timeline Manager - Clean Implementation
import {
  db,
  auth,
  storage,
  onAuthStateChanged,
} from "../core/firebase-core.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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

// Global variables
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

    DEBUG.log("Timeline Manager: User authenticated", { uid: user.uid });

    // Load widgets from the widgets collection
    const widgetsRef = collection(db, "widgets");
    const q = query(widgetsRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    DEBUG.log("Timeline Manager: Widgets query executed", {
      querySnapshotSize: querySnapshot.size,
    });

    timelineProjects = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      DEBUG.log("Timeline Manager: Processing widget", {
        id: doc.id,
        title: data.title,
        slot: data.slot,
        userId: data.userId,
        fileCount: data.files?.length || 0,
      });
      return {
        id: doc.id,
        title: data.title || "Untitled Widget",
        desc: data.description || "No description available",
        slot: data.slot,
        files: data.files || [],
        createdAt: data.createdAt,
      };
    });

    DEBUG.log("Timeline Manager: Widgets loaded successfully", {
      count: timelineProjects.length,
      widgets: timelineProjects.map((w) => ({
        id: w.id,
        title: w.title,
        slot: w.slot,
      })),
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
                updatedAt: new Date(),
              });
              DEBUG.log("Timeline Manager: Widget updated successfully", {
                projectId: project.id,
              });
              currentlyEditingCard = null;
              renderAllWidgetCards();
            } catch (error) {
              DEBUG.error("Timeline Manager: Failed to update widget", error);
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
        // Normal display mode with live widget iframe using custom styling
        card.innerHTML = `
          <div class="widget-preview" style="margin-bottom:8px;">
            <iframe class="widget-iframe custom-styled" title="Widget Preview" style="width:100%;height:240px;border:0;border-radius:8px;background:#0b0b0b"></iframe>
          </div>
          <h3>${project.title || "Untitled Widget"}</h3>
          <p>${project.desc || "No description available"}</p>
          <button class="widget-edit-btn">✏️ Edit</button>
        `;

        const iframe = card.querySelector(".widget-iframe");
        iframe.setAttribute(
          "sandbox",
          "allow-scripts allow-same-origin allow-forms"
        );

        // Asynchronously load widget HTML with asset URLs rewritten
        loadWidgetIntoIframe(project, iframe).catch((error) => {
          DEBUG.error(
            "Timeline Manager: Failed to load widget into iframe",
            error
          );
          iframe.replaceWith(
            Object.assign(document.createElement("div"), {
              className: "widget-preview-error",
              textContent: "Failed to load widget preview",
            })
          );
        });

        card.querySelector(".widget-edit-btn").addEventListener("click", () => {
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

// Create a blob URL for widget's HTML with asset paths rewritten to Firebase download URLs
async function loadWidgetIntoIframe(project, iframeEl) {
  try {
    const files = Array.isArray(project.files) ? project.files : [];
    if (files.length === 0) {
      DEBUG.warn("Timeline Manager: Project has no files", {
        projectId: project.id,
      });
      return;
    }

    const fileMap = {};
    files.forEach((f) => {
      if (f && f.fileName && f.downloadURL) {
        fileMap[f.fileName] = f.downloadURL;
      }
    });

    DEBUG.log("Timeline Manager: File map created", {
      fileCount: Object.keys(fileMap).length,
      files: Object.keys(fileMap),
    });

    // Prefer index.html, else first html file
    const htmlFileName =
      Object.keys(fileMap).find((n) => /index\.html?$/i.test(n)) ||
      Object.keys(fileMap).find((n) => /\.html?$/i.test(n));

    if (!htmlFileName) {
      DEBUG.warn("Timeline Manager: No HTML file found for widget", {
        projectId: project.id,
      });
      return;
    }

    DEBUG.log("Timeline Manager: Loading widget HTML", { htmlFileName });
    const res = await fetch(fileMap[htmlFileName]);
    const originalHtml = await res.text();

    const resolveMappedUrl = (path) => {
      if (!path) return null;
      const cleaned = path.replace(/^\.\//, "").replace(/^\//, "");
      if (fileMap[cleaned]) return fileMap[cleaned];
      const base = cleaned.split("/").pop();
      return fileMap[base] || null;
    };

    // Rewrite src/href for local asset references to their Firebase download URLs
    const processedHtml = originalHtml.replace(
      /(href|src)=["']([^"']+)["']/gi,
      (match, attr, value) => {
        const mapped = resolveMappedUrl(value);
        return mapped ? `${attr}="${mapped}"` : match;
      }
    );

    const blob = new Blob([processedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframeEl.src = url;
    DEBUG.log("Timeline Manager: Widget iframe set with blob URL");
  } catch (error) {
    DEBUG.error("Timeline Manager: Error preparing widget iframe", error);
    throw error;
  }
}

// Initialize timeline functionality
async function initializeTimeline() {
  DEBUG.log("Timeline Manager: Initializing timeline functionality");

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

  // Add auth state listener to re-render when auth changes
  DEBUG.log("Timeline Manager: Setting up auth state listener");
  onAuthStateChanged(auth, (user) => {
    if (user) {
      DEBUG.log("Timeline Manager: User authenticated, re-rendering timeline", {
        uid: user.uid,
      });
      renderAllWidgetCards();
    } else {
      DEBUG.log("Timeline Manager: User signed out, clearing timeline");
      timelineProjects = [];
      renderAllWidgetCards();
    }
  });

  DEBUG.log("Timeline Manager: Initialization complete");
}

// Initialize timeline manager when DOM is ready
document.addEventListener("DOMContentLoaded", async function () {
  DEBUG.log("Timeline Manager: DOM Content Loaded - Starting initialization");

  // Initialize the timeline functionality
  await initializeTimeline();
});

// Expose timeline manager to window for testing
window.timelineManager = {
  renderAllWidgetCards: renderAllWidgetCards,
  renderWidgetCard: renderWidgetCard,
  initializeTimeline: initializeTimeline,
  // Add other public methods as needed
};

DEBUG.log("Timeline Manager: Script loaded successfully");
