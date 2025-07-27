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
  const usersSnapshot = await getDocs(collection(db, "users"));
  const widgets = [];
  usersSnapshot.forEach((doc) => {
    const user = doc.data();
    if (!user.widgets) return;
    for (let slot of Object.keys(user.widgets)) {
      const widget = user.widgets[slot];
      widgets.push({
        ...widget,
        userName: user.name || "Unknown",
        userId: doc.id,
        slot,
      });
    }
  });
  return widgets;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

(async function showWidgets() {
  try {
    let widgets = await fetchAllWidgets();
    if (!widgets.length) {
      listDiv.innerHTML = '<div style="color:#fff">No widgets found yet.</div>';
      return;
    }
    widgets = shuffle(widgets).slice(0, 12); // Show up to 12 random widgets
    listDiv.innerHTML = "";
    for (const widget of widgets) {
      const card = document.createElement("div");
      card.className = "explore-widget-card";
      card.innerHTML = `
        <div class="explore-widget-title">${
          widget.title || "Untitled Widget"
        }</div>
        <div class="explore-widget-user">by ${widget.userName}</div>
        ${
          widget.files && widget.files["index.html"]
            ? `<iframe class='explore-widget-preview' src='${widget.files["index.html"]}' sandbox='allow-scripts allow-same-origin'></iframe>`
            : `<div style='height:200px;display:flex;align-items:center;justify-content:center;background:#111;border-radius:6px;color:#888;'>No Preview</div>`
        }
        <a href='/?user=${
          widget.userId
        }' style='color:#4caf50;text-decoration:none;margin-top:0.5rem;'>View Profile</a>
      `;
      listDiv.appendChild(card);
    }
  } catch (e) {
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
