// scripts/widget-display.js
import { db, auth, storage } from "./firebase-init.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

/**
 * Widget Display System
 * Handles displaying user widgets in iframes and managing widget metadata
 */

export class WidgetDisplay {
  constructor() {
    this.currentUser = null;
    this.widgetSlots = {};
  }

  /**
   * Initialize the widget display system
   */
  async init() {
    this.currentUser = auth.currentUser;
    if (!this.currentUser) {
      console.log("No user logged in for widget display");
      return;
    }

    await this.loadUserWidgets();
    this.setupWidgetSlots();
  }

  /**
   * Load user's widget data from Firestore
   */
  async loadUserWidgets() {
    try {
      const userDoc = await getDoc(doc(db, "users", this.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.widgetSlots = userData.widgets || {};
        console.log("Loaded widget slots:", this.widgetSlots);
      }
    } catch (error) {
      console.error("Error loading user widgets:", error);
    }
  }

  /**
   * Setup widget slots in the UI
   */
  setupWidgetSlots() {
    // Find widget slot containers
    const slotContainers = document.querySelectorAll("[data-widget-slot]");

    slotContainers.forEach((container) => {
      const slotNumber = container.dataset.widgetSlot;
      this.renderWidgetSlot(container, slotNumber);
    });
  }

  /**
   * Render a specific widget slot
   */
  async renderWidgetSlot(container, slotNumber) {
    const slotKey = `app-widget-${slotNumber}`;
    const widgetData = this.widgetSlots[slotKey];

    if (widgetData && widgetData.files && widgetData.files["index.html"]) {
      // Widget exists - show iframe
      this.showWidgetIframe(
        container,
        widgetData.files["index.html"],
        widgetData
      );
    } else {
      // No widget - show upload interface
      this.showUploadInterface(container, slotNumber);
    }
  }

  /**
   * Show widget in iframe
   */
  showWidgetIframe(container, htmlUrl, widgetData) {
    container.innerHTML = `
      <div class="widget-container">
        <div class="widget-header">
          <h3>${widgetData.title || "Untitled Widget"}</h3>
          <div class="widget-actions">
            <button class="btn btn-secondary" onclick="editWidget(${
              widgetData.slot
            })">
              <span class="material-icons">edit</span>
              Edit
            </button>
            <button class="btn btn-secondary" onclick="previewWidget('${htmlUrl}')">
              <span class="material-icons">open_in_new</span>
              Full View
            </button>
          </div>
        </div>
        <div class="widget-frame-container">
          <iframe 
            src="${htmlUrl}" 
            class="widget-iframe"
            frameborder="0"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Widget ${widgetData.slot}"
          ></iframe>
        </div>
        <div class="widget-info">
          <p><strong>Description:</strong> ${
            widgetData.desc || "No description"
          }</p>
          <p><strong>Last Updated:</strong> ${new Date(
            widgetData.updated
          ).toLocaleDateString()}</p>
        </div>
      </div>
    `;
  }

  /**
   * Show upload interface for empty slot
   */
  showUploadInterface(container, slotNumber) {
    container.innerHTML = `
      <div class="widget-upload-container">
        <h3>Widget Slot ${slotNumber}</h3>
        <p>Upload your widget files to get started</p>
        <div class="upload-area" data-slot="${slotNumber}">
          <input type="file" id="widgetFiles${slotNumber}" multiple accept=".html,.js,.css,.png,.jpg,.jpeg,.gif,.svg,.json,.mp3,.mp4,.wav,.ogg" style="display: none;">
          <div class="upload-placeholder">
            <span class="material-icons">cloud_upload</span>
            <p>Drop files here or click to upload</p>
            <p class="upload-hint">Supports: HTML, CSS, JS, Images, Audio, Video</p>
          </div>
        </div>
        <div class="upload-form" style="display: none;">
          <input type="text" placeholder="Widget Title" class="widget-title-input">
          <textarea placeholder="Widget Description" class="widget-desc-input" rows="3"></textarea>
          <button class="btn btn-primary" onclick="uploadWidget(${slotNumber})">
            <span class="material-icons">upload</span>
            Upload Widget
          </button>
        </div>
      </div>
    `;

    this.setupUploadHandlers(container, slotNumber);
  }

  /**
   * Setup drag and drop and file selection handlers
   */
  setupUploadHandlers(container, slotNumber) {
    const uploadArea = container.querySelector(".upload-area");
    const fileInput = container.querySelector(`#widgetFiles${slotNumber}`);
    const uploadForm = container.querySelector(".upload-form");

    // File input change
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelection(e.target.files, uploadForm);
      }
    });

    // Drag and drop
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("drag-over");
    });

    uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("drag-over");
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        this.handleFileSelection(files, uploadForm);
      }
    });

    // Click to upload
    uploadArea.addEventListener("click", () => {
      fileInput.click();
    });
  }

  /**
   * Handle file selection
   */
  handleFileSelection(files, uploadForm) {
    uploadForm.style.display = "block";

    // Show selected files
    const fileList = Array.from(files)
      .map((file) => file.name)
      .join(", ");
    uploadForm.querySelector(
      ".upload-placeholder p"
    ).textContent = `Selected: ${fileList}`;
  }

  /**
   * Upload widget files to storage
   */
  async uploadWidget(slotNumber) {
    const container = document.querySelector(
      `[data-widget-slot="${slotNumber}"]`
    );
    const fileInput = container.querySelector(`#widgetFiles${slotNumber}`);
    const titleInput = container.querySelector(".widget-title-input");
    const descInput = container.querySelector(".widget-desc-input");

    if (!fileInput.files.length) {
      alert("Please select files to upload");
      return;
    }

    const title = titleInput.value.trim() || "Untitled Widget";
    const desc = descInput.value.trim() || "";

    try {
      // Upload files to storage
      const fileURLs = await this.uploadFilesToStorage(
        fileInput.files,
        slotNumber
      );

      // Save widget metadata to Firestore
      await this.saveWidgetMetadata(slotNumber, {
        title,
        desc,
        files: fileURLs,
        updated: new Date(),
        slot: slotNumber,
      });

      // Refresh the widget display
      await this.loadUserWidgets();
      this.renderWidgetSlot(container, slotNumber);

      console.log(`Widget uploaded successfully to slot ${slotNumber}`);
    } catch (error) {
      console.error("Error uploading widget:", error);
      alert("Upload failed: " + error.message);
    }
  }

  /**
   * Upload files to Firebase Storage
   */
  async uploadFilesToStorage(files, slotNumber) {
    const fileURLs = {};
    const slotKey = `app-widget-${slotNumber}`;

    for (const file of files) {
      const storageRef = ref(
        storage,
        `users/${this.currentUser.uid}/${slotKey}/${file.name}`
      );

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      fileURLs[file.name] = downloadURL;

      console.log(`Uploaded ${file.name} to ${slotKey}`);
    }

    return fileURLs;
  }

  /**
   * Save widget metadata to Firestore
   */
  async saveWidgetMetadata(slotNumber, metadata) {
    const slotKey = `app-widget-${slotNumber}`;

    await updateDoc(doc(db, "users", this.currentUser.uid), {
      [`widgets.${slotKey}`]: metadata,
    });
  }

  /**
   * Preview widget in modal
   */
  previewWidget(htmlUrl) {
    const modal = document.getElementById("widgetModal");
    const iframe = document.getElementById("widgetFrame");

    if (modal && iframe) {
      iframe.src = htmlUrl;
      modal.style.display = "block";
    }
  }

  /**
   * Edit widget
   */
  editWidget(slotNumber) {
    // Open edit interface
    const container = document.querySelector(
      `[data-widget-slot="${slotNumber}"]`
    );
    this.showUploadInterface(container, slotNumber);
  }
}

// Global functions for HTML onclick handlers
window.previewWidget = function (htmlUrl) {
  const widgetDisplay = new WidgetDisplay();
  widgetDisplay.previewWidget(htmlUrl);
};

window.uploadWidget = function (slotNumber) {
  const widgetDisplay = new WidgetDisplay();
  widgetDisplay.uploadWidget(slotNumber);
};

window.editWidget = function (slotNumber) {
  const widgetDisplay = new WidgetDisplay();
  widgetDisplay.editWidget(slotNumber);
};

// Initialize widget display when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const widgetDisplay = new WidgetDisplay();
  widgetDisplay.init();
});
