// Home Timeline Display - Random quip showcase for home screen
// This displays 4 random quips from the explore page on the home screen
import { auth, db } from "../core/firebase-core.js";
import {
  collection,
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

let homeTimelineQuips = [];

// Fetch random quips from explore page for home display
async function loadRandomExploreQuips() {
  DEBUG.log("Home Timeline: Loading random quips from explore page");
  try {
    // Fetch all widgets from the widgets collection (same as explore page)
    const widgetsSnapshot = await getDocs(collection(db, "widgets"));
    const allWidgets = [];

    widgetsSnapshot.forEach((doc) => {
      const widget = doc.data();
      DEBUG.log("Home Timeline: Processing explore widget", {
        id: doc.id,
        title: widget.title,
        userId: widget.userId,
        fileCount: widget.files?.length || 0,
      });

      allWidgets.push({
        ...widget,
        id: doc.id,
        userId: widget.userId,
      });
    });

    DEBUG.log("Home Timeline: Total widgets found", {
      count: allWidgets.length,
    });

    // Filter out widgets without HTML files (same logic as explore page)
    const validWidgets = allWidgets.filter((widget) => {
      const htmlFile = findHtmlFile(widget.files);
      return htmlFile && htmlFile.downloadURL;
    });

    DEBUG.log("Home Timeline: Valid widgets with HTML", {
      count: validWidgets.length,
    });

    // Shuffle and select 4 random quips
    const shuffledWidgets = shuffle(validWidgets);
    homeTimelineQuips = shuffledWidgets.slice(0, 4);

    DEBUG.log("Home Timeline: Random quips selected", {
      count: homeTimelineQuips.length,
      quips: homeTimelineQuips.map((q) => ({ id: q.id, title: q.title })),
    });
  } catch (error) {
    DEBUG.error("Home Timeline: Failed to load random quips", error);
    homeTimelineQuips = [];
  }
}

// Helper function to shuffle array (same as explore page)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper function to find HTML file in widget files array (same as explore page)
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

// Render random explore quips for home timeline
async function renderHomeTimelineQuips() {
  DEBUG.log("Home Timeline: Rendering random explore quips");
  await loadRandomExploreQuips();

  // Create or find the timeline container
  let timelineContainer = document.querySelector(".home-timeline-container");
  if (!timelineContainer) {
    // Create timeline container if it doesn't exist
    timelineContainer = document.createElement("div");
    timelineContainer.className = "home-timeline-container";
    timelineContainer.style.cssText = `
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
    `;

    // Insert after the guest CTA section
    const guestSection = document.getElementById("guest-cta-section");
    if (guestSection) {
      guestSection.parentNode.insertBefore(
        timelineContainer,
        guestSection.nextSibling
      );
    }
  }

  // Clear previous content
  timelineContainer.innerHTML = "";

  // Add timeline header
  const timelineHeader = document.createElement("div");
  timelineHeader.style.cssText = `
    text-align: center;
    margin-bottom: 40px;
  `;
  timelineHeader.innerHTML = `
    <h2 style="color: var(--primary-neon); font-family: 'Orbitron', monospace; font-size: 2rem; margin: 0 0 10px 0; text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);">
      🌟 Featured Quips
    </h2>
    <p style="color: var(--text-secondary); font-size: 1.1rem; margin: 0;">
      Discover amazing creations from our community
    </p>
  `;
  timelineContainer.appendChild(timelineHeader);

  // Create timeline events container
  const timelineEventsContainer = document.createElement("div");
  timelineEventsContainer.className = "timeline-events-container";
  timelineEventsContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin-top: 30px;
  `;

  // Render quips
  homeTimelineQuips.forEach((quip, idx) => {
    DEBUG.log("Home Timeline: Rendering explore quip", {
      index: idx,
      quipId: quip.id,
      title: quip.title,
    });

    const timelineEvent = document.createElement("div");
    timelineEvent.className = "timeline-event";
    timelineEvent.style.cssText = `
      background: linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(255, 0, 255, 0.02) 100%);
      border: 1px solid rgba(0, 240, 255, 0.2);
      border-radius: 16px;
      padding: 20px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    `;

    // Add hover effect
    timelineEvent.addEventListener("mouseenter", () => {
      timelineEvent.style.transform = "translateY(-5px)";
      timelineEvent.style.boxShadow = "0 10px 30px rgba(0, 240, 255, 0.2)";
    });
    timelineEvent.addEventListener("mouseleave", () => {
      timelineEvent.style.transform = "translateY(0)";
      timelineEvent.style.boxShadow = "none";
    });

    const card = document.createElement("div");
    card.className = "timeline-event-card";

    // Get HTML file for preview
    const htmlFile = findHtmlFile(quip.files);

    card.innerHTML = `
      <div class="quip-preview" style="margin-bottom:12px;position:relative;">
        <iframe class="quip-iframe webgl-enabled" title="Quip Preview - ${quip.title || "Untitled Quip"}" style="width:100%;height:200px;border:0;border-radius:12px;background:#0a0a0a;"></iframe>
        <div class="quip-overlay" style="position:absolute;top:8px;right:8px;opacity:0.8;">
          <span class="quip-type-badge" style="background:rgba(0,240,255,0.2);color:#00f0ff;padding:4px 8px;border-radius:12px;font-size:0.8rem;font-family:JetBrains Mono;">QUIP</span>
        </div>
      </div>
      <div class="quip-info">
        <h3 style="color:#00f0ff;margin:0 0 8px 0;font-family:JetBrains Mono;font-size:1.1rem;">${quip.title || "Untitled Quip"}</h3>
        <p style="color:#a0a0a0;margin:0 0 12px 0;line-height:1.4;font-size:0.9rem;">by ${quip.userName || "Unknown Creator"}</p>
        <div class="quip-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="quip-interact-btn" style="background:rgba(0,240,255,0.1);border:1px solid #00f0ff;color:#00f0ff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;transition:all 0.3s ease;">🎮 Interact</button>
          <button class="quip-explore-btn" onclick="window.location.href='pages/explore.html'" style="background:rgba(255,107,53,0.1);border:1px solid #ff6b35;color:#ff6b35;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;transition:all 0.3s ease;">🔍 Explore</button>
        </div>
      </div>
    `;

    const iframe = card.querySelector(".quip-iframe");
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-webgl allow-pointer-lock"
    );

    // Load quip into iframe
    if (htmlFile && htmlFile.downloadURL) {
      iframe.src = htmlFile.downloadURL;
    } else {
      iframe.srcdoc = `
        <div style="padding: 20px; text-align: center; color: #888; background: #111; border-radius: 8px; font-family: Arial, sans-serif;">
          <h3>⚠️ Preview Unavailable</h3>
          <p>No preview available for this quip</p>
        </div>
      `;
    }

    // Add interact button handler
    card.querySelector(".quip-interact-btn").addEventListener("click", () => {
      DEBUG.log("Home Timeline: Quip interact button clicked", {
        quipId: quip.id,
      });
      iframe.focus();
      iframe.style.borderColor = "#ffff00";
      setTimeout(() => {
        iframe.style.borderColor = "#00f0ff";
      }, 2000);
    });

    timelineEvent.appendChild(card);
    timelineEventsContainer.appendChild(timelineEvent);
  });

  timelineContainer.appendChild(timelineEventsContainer);

  // Add refresh button
  const refreshButton = document.createElement("div");
  refreshButton.style.cssText = `
    text-align: center;
    margin-top: 30px;
  `;
  refreshButton.innerHTML = `
    <button id="refresh-timeline-btn" style="background: rgba(0,240,255,0.1); border: 1px solid var(--primary-neon); border-radius: 8px; color: var(--primary-neon); padding: 10px 20px; cursor: pointer; font-size: 0.9rem; font-family: 'Inter', sans-serif; font-weight: 500; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(0,240,255,0.2)'" onmouseout="this.style.background='rgba(0,240,255,0.1)'">
      🔄 Refresh Featured Quips
    </button>
  `;
  timelineContainer.appendChild(refreshButton);

  // Add refresh functionality
  document
    .getElementById("refresh-timeline-btn")
    .addEventListener("click", () => {
      DEBUG.log("Home Timeline: Refreshing featured quips");
      console.log(
        "🔄 [FEATURE TRIGGER] Random Explore Quips refresh button clicked"
      );
      renderHomeTimelineQuips();
    });

  DEBUG.log("Home Timeline: Random explore quips rendered successfully");
}

// Initialize home timeline display
async function initializeHomeTimeline() {
  DEBUG.log("Home Timeline: Initializing random explore quips display");

  try {
    // Always render random quips regardless of auth state
    await renderHomeTimelineQuips();

    // Add auth state listener to re-render when auth changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        DEBUG.log(
          "Home Timeline: User authenticated, refreshing featured quips",
          { uid: user.uid }
        );
        renderHomeTimelineQuips();
      } else {
        DEBUG.log("Home Timeline: User signed out, refreshing featured quips");
        renderHomeTimelineQuips();
      }
    });

    DEBUG.log("Home Timeline: Initialization complete");
  } catch (error) {
    DEBUG.error("Home Timeline: Failed to initialize", error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  DEBUG.log(
    "Home Timeline: DOM Content Loaded - Starting random explore quips initialization"
  );
  console.log(
    "🌟 [FEATURE INIT] Random Explore Quips Timeline feature initializing..."
  );
  await initializeHomeTimeline();
  console.log(
    "✅ [FEATURE INIT] Random Explore Quips Timeline feature initialized successfully!"
  );
});

// Export for potential external use
window.homeTimelineManager = {
  renderHomeTimelineQuips: renderHomeTimelineQuips,
  initializeHomeTimeline: initializeHomeTimeline,
  loadRandomExploreQuips: loadRandomExploreQuips,
};

DEBUG.log("Home Timeline: Script loaded successfully");
