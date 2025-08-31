import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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

const listDiv = document.getElementById("exploreWidgetList");
listDiv.innerHTML = '<div style="color:#fff">Loading widgets...</div>';

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
        <a href='/?user=${
          widget.userId
        }' style='color:#4caf50;text-decoration:none;margin-top:0.5rem;'>View Profile</a>
      `;
      listDiv.appendChild(card);
    }
  } catch (e) {
    console.error("[EXPLORE DEBUG] Error loading widgets:", e);
    listDiv.innerHTML = `<div style='color:#f66'>Error loading widgets: ${e.message}</div>`;
  }
})();

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
