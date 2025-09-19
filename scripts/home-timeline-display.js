// Home Timeline Display - Read-only widget showcase for home screen
// This provides a clean, edit-free widget display for the home screen
import { auth, db } from "../core/firebase-core.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const DEBUG = {
  log: (message, data = null) => {
    console.log(`[HOME TIMELINE] ${message}`, data || "");
  },
  error: (message, error = null) => {
    console.error(`[HOME TIMELINE ERROR] ${message}`, error || "");
  },
};

let homeTimelineProjects = [];

// Fetch widgets for home display (read-only)
async function loadHomeTimelineProjects() {
  DEBUG.log("Home Timeline: Loading widgets for display");
  try {
    const user = auth.currentUser;
    if (!user) {
      DEBUG.log("Home Timeline: User not authenticated, showing guest state");
      homeTimelineProjects = [];
      return;
    }

    const widgetsRef = collection(db, "widgets");
    const q = query(widgetsRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    homeTimelineProjects = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      DEBUG.log("Home Timeline: Processing widget", {
        id: doc.id,
        title: data.title,
        slot: data.slot,
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

    DEBUG.log("Home Timeline: Widgets loaded successfully", {
      count: homeTimelineProjects.length,
    });
  } catch (error) {
    DEBUG.error("Home Timeline: Failed to load widgets", error);
    homeTimelineProjects = [];
  }
}

// Render read-only widget cards for home screen
async function renderHomeWidgetCards() {
  DEBUG.log("Home Timeline: Rendering home widget cards");
  await loadHomeTimelineProjects();

  const timelineEvents = document.querySelectorAll(".timeline-event");
  if (timelineEvents.length === 0) {
    DEBUG.log("Home Timeline: No timeline events found in DOM");
    return;
  }

  timelineEvents.forEach((event, idx) => {
    // Remove any previous card
    const oldCard = event.querySelector(".timeline-event-card");
    if (oldCard) oldCard.remove();

    const project = homeTimelineProjects[idx];
    const card = document.createElement("div");
    card.className = "timeline-event-card";

    if (project) {
      DEBUG.log("Home Timeline: Rendering project card", {
        index: idx,
        projectId: project.id,
        title: project.title,
      });

      // Read-only display mode - no edit buttons, just interact and dashboard link
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
            <button class="quip-dashboard-btn" onclick="window.location.href='pages/profile_dashboard/my-projects.html'" style="background:rgba(255,107,53,0.1);border:1px solid #ff6b35;color:#ff6b35;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.9rem;">📊 Dashboard</button>
          </div>
        </div>
      `;

      const iframe = card.querySelector(".quip-iframe");
      iframe.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-forms allow-webgl allow-pointer-lock"
      );

      // Load quip into iframe (simplified version)
      loadHomeQuipIntoIframe(project, iframe).catch((error) => {
        DEBUG.error("Home Timeline: Failed to load quip into iframe", error);
        iframe.replaceWith(
          Object.assign(document.createElement("div"), {
            className: "quip-preview-error",
            textContent: "Failed to load quip preview",
            style:
              "padding:20px;text-align:center;color:#ff4444;background:rgba(255,68,68,0.1);border-radius:8px;",
          })
        );
      });

      // Add interact button handler
      card.querySelector(".quip-interact-btn").addEventListener("click", () => {
        DEBUG.log("Home Timeline: Quip interact button clicked", {
          projectId: project.id,
        });
        iframe.focus();
        iframe.style.borderColor = "#ffff00";
        setTimeout(() => {
          iframe.style.borderColor = "#00f0ff";
        }, 2000);
      });
    } else {
      // Empty slot - show create widget button
      DEBUG.log("Home Timeline: Rendering empty slot", { index: idx });
      card.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 3rem; margin-bottom: 10px; color: #666;">+</div>
          <p style="color: #aaa; margin: 0 0 15px 0;">Empty Slot</p>
          <button onclick="window.location.href='pages/profile_dashboard/my-projects.html'" style="background: rgba(0,240,255,0.1); border: 1px solid #00f0ff; color: #00f0ff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(0,240,255,0.2)'" onmouseout="this.style.background='rgba(0,240,255,0.1)'">Create Widget</button>
        </div>
      `;
    }

    event.appendChild(card);
  });

  DEBUG.log("Home Timeline: All home widget cards rendered");
}

// Simplified quip loading for home display
async function loadHomeQuipIntoIframe(project, iframeEl) {
  try {
    const files = Array.isArray(project.files) ? project.files : [];
    if (files.length === 0) {
      DEBUG.warn("Home Timeline: Quip has no files", { projectId: project.id });
      return;
    }

    const fileMap = {};
    files.forEach((f) => {
      if (f && f.fileName && f.downloadURL) {
        fileMap[f.fileName] = f.downloadURL;
      }
    });

    DEBUG.log("Home Timeline: Quip file map created", {
      fileCount: Object.keys(fileMap).length,
      files: Object.keys(fileMap),
    });

    // Prefer index.html, else first html file
    const htmlFileName =
      Object.keys(fileMap).find((n) => /index\.html?$/i.test(n)) ||
      Object.keys(fileMap).find((n) => /\.html?$/i.test(n));

    if (!htmlFileName) {
      DEBUG.warn("Home Timeline: No HTML file found for quip", {
        projectId: project.id,
      });
      return;
    }

    DEBUG.log("Home Timeline: Loading quip HTML", { htmlFileName });

    // Add error handling for fetch
    let res;
    try {
      res = await fetch(fileMap[htmlFileName]);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (fetchError) {
      DEBUG.error("Home Timeline: Failed to fetch quip HTML", {
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
              window.performance.mark('home-quip-loaded-${project.id}');
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
    DEBUG.log("Home Timeline: Quip iframe set with enhanced blob URL");
  } catch (error) {
    DEBUG.error("Home Timeline: Error preparing quip iframe", error);

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

// Initialize home timeline display
async function initializeHomeTimeline() {
  DEBUG.log("Home Timeline: Initializing home timeline display");

  try {
    renderHomeWidgetCards();

    // Add auth state listener to re-render when auth changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        DEBUG.log(
          "Home Timeline: User authenticated, re-rendering home timeline",
          { uid: user.uid }
        );
        renderHomeWidgetCards();
      } else {
        DEBUG.log("Home Timeline: User signed out, clearing home timeline");
        homeTimelineProjects = [];
        renderHomeWidgetCards();
      }
    });

    DEBUG.log("Home Timeline: Initialization complete");
  } catch (error) {
    DEBUG.error("Home Timeline: Failed to initialize", error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  DEBUG.log(
    "Home Timeline: DOM Content Loaded - Starting home timeline initialization"
  );
  await initializeHomeTimeline();
});

// Export for potential external use
window.homeTimelineManager = {
  renderHomeWidgetCards: renderHomeWidgetCards,
  initializeHomeTimeline: initializeHomeTimeline,
  loadHomeTimelineProjects: loadHomeTimelineProjects,
};

DEBUG.log("Home Timeline: Script loaded successfully");
