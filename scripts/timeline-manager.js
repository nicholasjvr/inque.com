// Timeline Manager - Enhanced for Quip Management with WebGL Support
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
import profileDashboardManager from "./widgets/profile-dashboard-manager.js";

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

// Get the target user ID from URL parameters
function getTargetUserId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("user");
}

// Check if we're viewing someone else's profile
function isViewingOtherUserProfile() {
  const targetUserId = getTargetUserId();
  const currentUser = auth.currentUser;
  return targetUserId && currentUser && targetUserId !== currentUser.uid;
}

// Fetch widgets from Firestore
async function loadTimelineProjects(targetUserId = null) {
  DEBUG.log("Timeline Manager: Loading timeline widgets from Firestore");
  try {
    let userIdToLoad = targetUserId;

    // If no target user specified, use current user
    if (!userIdToLoad) {
      const user = auth.currentUser;
      if (!user) {
        DEBUG.log(
          "Timeline Manager: User not authenticated, showing guest state"
        );
        timelineProjects = [];
        return;
      }
      userIdToLoad = user.uid;
    }

    DEBUG.log("Timeline Manager: Loading widgets for user", {
      uid: userIdToLoad,
    });

    // Load widgets from the widgets collection
    const widgetsRef = collection(db, "widgets");
    const q = query(widgetsRef, where("userId", "==", userIdToLoad));
    const querySnapshot = await getDocs(q);

    DEBUG.log("Timeline Manager: Widgets query executed", {
      targetUserId: userIdToLoad,
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
async function renderAllWidgetCards(targetUserId = null) {
  DEBUG.log("Timeline Manager: Rendering all widget cards");
  await loadTimelineProjects(targetUserId);

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
        // Enhanced display mode with WebGL-capable quip iframe using profile dashboard styling
        card.innerHTML = `
          <div class="quip-preview" style="margin-bottom:8px;position:relative;">
            <iframe class="quip-iframe webgl-enabled" title="Quip Preview - ${project.title || "Untitled Quip"}" style="width:100%;height:280px;border:0;border-radius:12px;background:#0a0a0a;"></iframe>
            <div class="quip-overlay" style="position:absolute;top:8px;right:8px;opacity:0.8;">
              <span class="quip-type-badge" style="background:rgba(0,240,255,0.2);color:#00f0ff;padding:4px 8px;border-radius:12px;font-size:0.8rem;font-family:JetBrains Mono;">QUIP</span>
            </div>
          </div>
          <div class="quip-info">
            <h3 style="color:#00f0ff;margin:0 0 8px 0;font-family:JetBrains Mono;">${project.title || "Untitled Quip"}</h3>
            <p style="color:#a0a0a0;margin:0 0 12px 0;line-height:1.4;">${project.desc || "No description available"}</p>
            <div class="quip-actions" style="display:flex;gap:8px;">
              <button class="quip-interact-btn" style="background:rgba(0,240,255,0.1);border:1px solid #00f0ff;color:#00f0ff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.9rem;">🎮 Interact</button>
              <button class="quip-edit-btn" style="background:rgba(255,0,255,0.1);border:1px solid #ff00ff;color:#ff00ff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.9rem;">✏️ Edit</button>
            </div>
          </div>
        `;

        const iframe = card.querySelector(".quip-iframe");
        iframe.setAttribute(
          "sandbox",
          "allow-scripts allow-same-origin allow-forms allow-webgl allow-pointer-lock"
        );

        // Apply custom dashboard styling to the iframe
        if (
          profileDashboardManager &&
          typeof profileDashboardManager.applyDashboardSettings === "function"
        ) {
          profileDashboardManager.applyDashboardSettings(iframe, {
            borderColor: "#00f0ff",
            borderWidth: "2px",
            borderRadius: "12px",
            shadow:
              "0 0 20px rgba(0, 240, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          });
        }

        // Asynchronously load quip HTML with asset URLs rewritten for WebGL support
        loadQuipIntoIframe(project, iframe).catch((error) => {
          DEBUG.error(
            "Timeline Manager: Failed to load quip into iframe",
            error
          );
          iframe.replaceWith(
            Object.assign(document.createElement("div"), {
              className: "quip-preview-error",
              textContent: "Failed to load quip preview",
              style:
                "padding:20px;text-align:center;color:#ff4444;background:rgba(255,68,68,0.1);border-radius:8px;",
            })
          );
        });

        // Add event handlers for quip interaction and editing
        card
          .querySelector(".quip-interact-btn")
          .addEventListener("click", () => {
            DEBUG.log("Timeline Manager: Quip interact button clicked", {
              projectId: project.id,
            });
            // Focus the iframe for interaction
            iframe.focus();
            iframe.style.borderColor = "#ffff00";
            setTimeout(() => {
              iframe.style.borderColor = "#00f0ff";
            }, 2000);
          });

        card.querySelector(".quip-edit-btn").addEventListener("click", () => {
          DEBUG.log("Timeline Manager: Quip edit button clicked", {
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

// Enhanced function to load quip with WebGL support and custom styling
async function loadQuipIntoIframe(project, iframeEl) {
  try {
    const files = Array.isArray(project.files) ? project.files : [];
    if (files.length === 0) {
      DEBUG.warn("Timeline Manager: Quip has no files", {
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

    DEBUG.log("Timeline Manager: Quip file map created", {
      fileCount: Object.keys(fileMap).length,
      files: Object.keys(fileMap),
    });

    // Prefer index.html, else first html file
    const htmlFileName =
      Object.keys(fileMap).find((n) => /index\.html?$/i.test(n)) ||
      Object.keys(fileMap).find((n) => /\.html?$/i.test(n));

    if (!htmlFileName) {
      DEBUG.warn("Timeline Manager: No HTML file found for quip", {
        projectId: project.id,
      });
      return;
    }

    DEBUG.log("Timeline Manager: Loading quip HTML", { htmlFileName });

    // Add error handling for fetch
    let res;
    try {
      res = await fetch(fileMap[htmlFileName]);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (fetchError) {
      DEBUG.error("Timeline Manager: Failed to fetch quip HTML", {
        url: fileMap[htmlFileName],
        error: fetchError.message,
      });

      // Show error in iframe
      iframeEl.srcdoc = `
        <div style="padding: 20px; text-align: center; color: #ff4444; background: rgba(255,68,68,0.1); border-radius: 8px; font-family: Arial, sans-serif;">
          <h3>⚠️ Preview Unavailable</h3>
          <p>Unable to load widget preview</p>
          <small>Error: ${fetchError.message}</small>
        </div>
      `;
      return;
    }

    const originalHtml = await res.text();

    const resolveMappedUrl = (path) => {
      if (!path) return null;
      const cleaned = path.replace(/^\.\//, "").replace(/^\//, "");
      if (fileMap[cleaned]) return fileMap[cleaned];
      const base = cleaned.split("/").pop();
      return fileMap[base] || null;
    };

    // Enhanced HTML processing for WebGL support
    let processedHtml = originalHtml.replace(
      /(href|src)=["']([^"']+)["']/gi,
      (match, attr, value) => {
        const mapped = resolveMappedUrl(value);
        return mapped ? `${attr}="${mapped}"` : match;
      }
    );

    // Add WebGL and performance optimizations to the HTML
    const webglEnhancements = `
      <script>
        // WebGL context optimization
        if (typeof window !== 'undefined') {
          window.addEventListener('load', () => {
            // Enable WebGL context preservation
            const canvas = document.querySelector('canvas');
            if (canvas) {
              canvas.style.imageRendering = 'pixelated';
              canvas.style.imageRendering = 'crisp-edges';
            }
            
            // Performance monitoring for quips
            if (window.performance && window.performance.mark) {
              window.performance.mark('quip-loaded-${project.id}');
            }
          });
        }
      </script>
    `;

    // Insert WebGL enhancements before closing body tag
    processedHtml = processedHtml.replace(
      /<\/body>/i,
      `${webglEnhancements}</body>`
    );

    const blob = new Blob([processedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframeEl.src = url;
    DEBUG.log("Timeline Manager: Quip iframe set with enhanced blob URL");
  } catch (error) {
    DEBUG.error("Timeline Manager: Error preparing quip iframe", error);

    // Show error in iframe instead of throwing
    iframeEl.srcdoc = `
      <div style="padding: 20px; text-align: center; color: #ff4444; background: rgba(255,68,68,0.1); border-radius: 8px; font-family: Arial, sans-serif;">
        <h3>⚠️ Preview Error</h3>
        <p>Unable to load widget preview</p>
        <small>Error: ${error.message}</small>
      </div>
    `;
  }
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
      // Only allow editing if viewing own profile
      if (!isViewingOtherUserProfile()) {
        renderAllWidgetCards();
      } else {
        DEBUG.log("Timeline Manager: Cannot edit other user's widgets");
      }
    });
  } else {
    DEBUG.warn("Timeline Manager: Edit profile button not found");
  }

  // Initial render - check if we're viewing a specific user's profile
  DEBUG.log("Timeline Manager: Performing initial render");
  const targetUserId = getTargetUserId();
  if (targetUserId) {
    DEBUG.log("Timeline Manager: Loading timeline for specific user", {
      targetUserId,
    });

    // Show a message indicating we're viewing another user's profile
    if (isViewingOtherUserProfile()) {
      console.log("👤 [TIMELINE] Viewing another user's widget timeline");
      // You could add a visual indicator here if needed
    }
  }
  renderAllWidgetCards(targetUserId);

  // Add auth state listener to re-render when auth changes
  DEBUG.log("Timeline Manager: Setting up auth state listener");
  onAuthStateChanged(auth, (user) => {
    if (user) {
      DEBUG.log("Timeline Manager: User authenticated, re-rendering timeline", {
        uid: user.uid,
      });
      // Re-check target user on auth change
      const currentTargetUserId = getTargetUserId();
      renderAllWidgetCards(currentTargetUserId);
    } else {
      DEBUG.log("Timeline Manager: User signed out, clearing timeline");
      timelineProjects = [];
      renderAllWidgetCards();
    }
  });

  DEBUG.log("Timeline Manager: Initialization complete");
}

document.addEventListener("DOMContentLoaded", async function () {
  DEBUG.log("Timeline Manager: DOM Content Loaded - Starting initialization");
  await initializeTimeline();
});

// Render a single widget card for a specific timeline event
function renderWidgetCard(eventElement, project, slotIndex) {
  DEBUG.log("Timeline Manager: Rendering widget card", {
    slotIndex,
    projectId: project?.id,
    hasProject: !!project,
  });

  if (!eventElement) {
    DEBUG.warn("Timeline Manager: No event element provided for widget card");
    return;
  }

  // Remove any existing card
  const existingCard = eventElement.querySelector(".timeline-event-card");
  if (existingCard) {
    existingCard.remove();
  }

  const card = document.createElement("div");
  card.className = "timeline-event-card";

  if (project && project.files && project.files.length > 0) {
    // Widget exists - show preview
    const htmlFile = findHtmlFile(project.files);
    if (htmlFile) {
      card.innerHTML = `
        <div class="widget-preview">
          <iframe 
            src="${htmlFile.downloadURL}" 
            frameborder="0"
            loading="lazy"
            style="width: 100%; height: 200px; border-radius: 8px;"
          ></iframe>
        </div>
        <div class="widget-info">
          <h4>${project.title || "Untitled Widget"}</h4>
          <p>${project.description || "No description available"}</p>
          <div class="widget-meta">
            <span class="widget-author">by ${project.author || "Unknown"}</span>
            <span class="widget-date">${new Date(project.createdAt?.toDate?.() || project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      `;
    } else {
      // No HTML file found
      card.innerHTML = `
        <div class="widget-placeholder">
          <div class="placeholder-icon">📦</div>
          <h4>${project.title || "Widget"}</h4>
          <p>No preview available</p>
        </div>
      `;
    }
  } else {
    // No widget - show empty state
    card.innerHTML = `
      <div class="empty-slot">
        <div class="empty-icon">➕</div>
        <h4>Empty Slot ${slotIndex + 1}</h4>
        <p>Upload a widget to fill this slot</p>
      </div>
    `;
  }

  eventElement.appendChild(card);
  DEBUG.log("Timeline Manager: Widget card rendered successfully", {
    slotIndex,
  });
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

// Expose timeline manager to window for testing
window.timelineManager = {
  renderAllWidgetCards: renderAllWidgetCards,
  renderWidgetCard: renderWidgetCard,
  initializeTimeline: initializeTimeline,
};

DEBUG.log("Timeline Manager: Script loaded successfully");
