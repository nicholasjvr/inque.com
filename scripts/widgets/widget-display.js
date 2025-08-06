// scripts/widget-display.js
import { db, auth, storage } from "../firebase/firebase-init.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  setDoc,
  deleteDoc,
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
 * Updated to work with new widget data model
 */

export class WidgetDisplay {
  constructor() {
    this.currentUser = null;
    this.userWidgets = []; // Array of widget IDs
    this.widgetData = {}; // Cache for widget metadata
    this.debugMode = true;
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[WidgetDisplay] ${message}`, data);
    }
  }

  error(message, error = null) {
    console.error(`[WidgetDisplay] ${message}`, error);
  }

  /**
   * Initialize the widget display system
   */
  async init() {
    this.currentUser = auth.currentUser;
    if (!this.currentUser) {
      this.log("No user logged in for widget display");
      return;
    }

    this.log("Initializing widget display system");
    await this.loadUserWidgets();
    this.setupWidgetSlots();
    this.setupProfileMenuIntegration();
  }

  /**
   * Load user's widget data from Firestore
   */
  async loadUserWidgets() {
    try {
      const userDoc = await getDoc(doc(db, "users", this.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userWidgets = userData.widgets || [];
        this.log("Loaded user widgets", {
          widgetCount: this.userWidgets.length,
        });

        // Load widget metadata for all user widgets
        await this.loadWidgetMetadata();
      }
    } catch (error) {
      this.error("Error loading user widgets", error);
    }
  }

  /**
   * Load metadata for all user widgets
   */
  async loadWidgetMetadata() {
    try {
      for (const widgetId of this.userWidgets) {
        const widgetDoc = await getDoc(doc(db, "widgets", widgetId));
        if (widgetDoc.exists()) {
          this.widgetData[widgetId] = widgetDoc.data();
        }
      }
      this.log("Loaded widget metadata", {
        widgetCount: Object.keys(this.widgetData).length,
      });
    } catch (error) {
      this.error("Error loading widget metadata", error);
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
    // Find widget for this slot
    const widgetForSlot = Object.values(this.widgetData).find(
      (widget) => widget.slot === parseInt(slotNumber)
    );

    if (
      widgetForSlot &&
      widgetForSlot.files &&
      widgetForSlot.files["index.html"]
    ) {
      // Widget exists - show iframe
      this.showWidgetIframe(
        container,
        widgetForSlot.files["index.html"],
        widgetForSlot
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
            <button class="btn btn-secondary edit-widget-btn" data-widget-id="${
              widgetData.id
            }">
              <span class="material-icons">edit</span>
              Edit
            </button>
            <button class="btn btn-secondary preview-widget-btn" data-widget-id="${
              widgetData.id
            }">
              <span class="material-icons">open_in_new</span>
              Full View
            </button>
            <button class="btn btn-danger delete-widget-btn" data-widget-id="${
              widgetData.id
            }">
              <span class="material-icons">delete</span>
              Delete
            </button>
          </div>
        </div>
        <div class="widget-frame-container">
          <iframe 
            src="${htmlUrl}" 
            class="widget-iframe"
            frameborder="0"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Widget ${widgetData.title}"
          ></iframe>
        </div>
        <div class="widget-info">
          <p><strong>Description:</strong> ${
            widgetData.description || "No description"
          }</p>
          <p><strong>Category:</strong> ${widgetData.category || "General"}</p>
          <p><strong>Tags:</strong> ${
            widgetData.tags?.join(", ") || "No tags"
          }</p>
          <p><strong>Last Updated:</strong> ${new Date(
            widgetData.updatedAt?.toDate() || widgetData.updatedAt
          ).toLocaleDateString()}</p>
          <div class="widget-stats">
            <span class="stat">👁️ ${widgetData.stats?.views || 0} views</span>
            <span class="stat">❤️ ${widgetData.stats?.likes || 0} likes</span>
            <span class="stat">📤 ${widgetData.stats?.shares || 0} shares</span>
          </div>
        </div>
      </div>
    `;

    this.setupWidgetActionHandlers(container);
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
          <input type="text" placeholder="Widget Title" class="widget-title-input" data-slot="${slotNumber}">
          <textarea placeholder="Widget Description" class="widget-desc-input" data-slot="${slotNumber}" rows="3"></textarea>
          <input type="text" placeholder="Category (e.g., game, tool, art)" class="widget-category-input" data-slot="${slotNumber}">
          <input type="text" placeholder="Tags (comma separated)" class="widget-tags-input" data-slot="${slotNumber}">
          <button class="btn btn-primary upload-widget-btn" data-slot="${slotNumber}">
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

    // Upload button
    const uploadBtn = container.querySelector(".upload-widget-btn");
    uploadBtn.addEventListener("click", () => {
      this.uploadWidget(slotNumber);
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
   * Upload functionality is now handled by WidgetUploadManager
   * This method is kept for backward compatibility but delegates to the upload manager
   */
  async uploadWidget(slotNumber) {
    this.log("Widget upload requested, delegating to WidgetUploadManager");

    // Import the upload manager if not already available
    if (!window.widgetUploadManager) {
      const { default: widgetUploadManager } = await import(
        "./widget-upload.js"
      );
      window.widgetUploadManager = widgetUploadManager;
    }

    // Trigger upload through the upload manager
    const button = document.querySelector(
      `.upload-widget-btn[data-slot="${slotNumber}"]`
    );
    if (button) {
      await window.widgetUploadManager.handleUploadButtonClick(button);
    } else {
      this.error("Upload button not found for slot", { slotNumber });
    }
  }

  /**
   * Setup widget action handlers
   */
  setupWidgetActionHandlers(container) {
    // Edit widget
    const editBtn = container.querySelector(".edit-widget-btn");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        const widgetId = e.target.closest(".edit-widget-btn").dataset.widgetId;
        this.editWidget(widgetId);
      });
    }

    // Preview widget
    const previewBtn = container.querySelector(".preview-widget-btn");
    if (previewBtn) {
      previewBtn.addEventListener("click", (e) => {
        const widgetId = e.target.closest(".preview-widget-btn").dataset
          .widgetId;
        this.previewWidget(widgetId);
      });
    }

    // Delete widget
    const deleteBtn = container.querySelector(".delete-widget-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        const widgetId =
          e.target.closest(".delete-widget-btn").dataset.widgetId;
        this.deleteWidget(widgetId);
      });
    }
  }

  /**
   * Preview widget in modal
   */
  previewWidget(widgetId) {
    const widgetData = this.widgetData[widgetId];
    if (!widgetData || !widgetData.files["index.html"]) {
      this.showToast("Widget not found or invalid", "error");
      return;
    }

    // Create modal if it doesn't exist
    let modal = document.getElementById("widgetPreviewModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "widgetPreviewModal";
      modal.className = "modal";
      modal.innerHTML = `
        <div class="modal-content widget-preview-modal">
          <div class="modal-header">
            <h3>${widgetData.title}</h3>
            <button class="close-modal">×</button>
          </div>
          <div class="modal-body">
            <iframe 
              src="${widgetData.files["index.html"]}" 
              class="widget-preview-iframe"
              frameborder="0"
              sandbox="allow-scripts allow-same-origin allow-forms"
              title="Widget Preview"
            ></iframe>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Setup close functionality
      const closeBtn = modal.querySelector(".close-modal");
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });

      // Close on outside click
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
        }
      });
    }

    // Update modal content
    modal.querySelector("h3").textContent = widgetData.title;
    modal.querySelector("iframe").src = widgetData.files["index.html"];
    modal.style.display = "block";
  }

  /**
   * Edit widget
   */
  editWidget(widgetId) {
    const widgetData = this.widgetData[widgetId];
    if (!widgetData) {
      this.showToast("Widget not found", "error");
      return;
    }

    // Open edit interface
    const container = document.querySelector(
      `[data-widget-slot="${widgetData.slot}"]`
    );
    if (container) {
      this.showUploadInterface(container, widgetData.slot);

      // Pre-fill form with existing data
      const titleInput = container.querySelector(".widget-title-input");
      const descInput = container.querySelector(".widget-desc-input");
      const categoryInput = container.querySelector(".widget-category-input");
      const tagsInput = container.querySelector(".widget-tags-input");

      if (titleInput) titleInput.value = widgetData.title || "";
      if (descInput) descInput.value = widgetData.description || "";
      if (categoryInput) categoryInput.value = widgetData.category || "";
      if (tagsInput) tagsInput.value = widgetData.tags?.join(", ") || "";
    }
  }

  /**
   * Delete widget
   */
  async deleteWidget(widgetId) {
    const widgetData = this.widgetData[widgetId];
    if (!widgetData) {
      this.showToast("Widget not found", "error");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${widgetData.title}"?`)) {
      return;
    }

    try {
      // Remove from widgets collection
      await deleteDoc(doc(db, "widgets", widgetId));

      // Remove from user profile
      await updateDoc(doc(db, "users", this.currentUser.uid), {
        widgets: arrayRemove(widgetId),
      });

      // Refresh display
      await this.loadUserWidgets();
      this.setupWidgetSlots();

      this.showToast(
        `Widget "${widgetData.title}" deleted successfully`,
        "success"
      );
      this.log("Widget deleted successfully", { widgetId });
    } catch (error) {
      this.error("Error deleting widget", error);
      this.showToast("Failed to delete widget: " + error.message, "error");
    }
  }

  /**
   * Setup profile menu integration
   */
  setupProfileMenuIntegration() {
    // Update profile menu to show widget count
    this.updateProfileMenuWidgetCount();

    // Add widget management to profile menu
    this.addWidgetManagementToProfile();
  }

  /**
   * Update profile menu widget count
   */
  updateProfileMenuWidgetCount() {
    const profileMenu = document.querySelector(".profile-menu");
    if (profileMenu) {
      const widgetCountElement = profileMenu.querySelector(".widget-count");
      if (widgetCountElement) {
        widgetCountElement.textContent = this.userWidgets.length;
      } else {
        // Create widget count element if it doesn't exist
        const countElement = document.createElement("div");
        countElement.className = "widget-count";
        countElement.textContent = this.userWidgets.length;
        profileMenu.appendChild(countElement);
      }
    }
  }

  /**
   * Add widget management to profile menu
   */
  addWidgetManagementToProfile() {
    const profileMenu = document.querySelector(".profile-menu");
    if (profileMenu && !profileMenu.querySelector(".widget-management")) {
      const widgetSection = document.createElement("div");
      widgetSection.className = "widget-management";
      widgetSection.innerHTML = `
        <h4>My Widgets (${this.userWidgets.length})</h4>
        <div class="widget-list">
          ${
            this.userWidgets.length === 0
              ? '<p>No widgets yet. <a href="#" class="upload-widget-link">Upload your first widget!</a></p>'
              : this.userWidgets
                  .map((widgetId) => {
                    const widget = this.widgetData[widgetId];
                    return widget
                      ? `
                <div class="widget-item" data-widget-id="${widgetId}">
                  <div class="widget-info">
                    <h5>${widget.title}</h5>
                    <p>${widget.description || "No description"}</p>
                    <span class="widget-category">${widget.category}</span>
                  </div>
                  <div class="widget-actions">
                    <button class="btn btn-sm preview-widget-btn" data-widget-id="${widgetId}">Preview</button>
                    <button class="btn btn-sm edit-widget-btn" data-widget-id="${widgetId}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-widget-btn" data-widget-id="${widgetId}">Delete</button>
                  </div>
                </div>
              `
                      : "";
                  })
                  .join("")
          }
        </div>
      `;
      profileMenu.appendChild(widgetSection);

      // Setup event listeners for profile menu widgets
      this.setupProfileMenuEventListeners(widgetSection);
    }
  }

  /**
   * Setup event listeners for profile menu widgets
   */
  setupProfileMenuEventListeners(widgetSection) {
    // Preview buttons
    widgetSection.querySelectorAll(".preview-widget-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const widgetId = e.target.dataset.widgetId;
        this.previewWidget(widgetId);
      });
    });

    // Edit buttons
    widgetSection.querySelectorAll(".edit-widget-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const widgetId = e.target.dataset.widgetId;
        this.editWidget(widgetId);
      });
    });

    // Delete buttons
    widgetSection.querySelectorAll(".delete-widget-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const widgetId = e.target.dataset.widgetId;
        this.deleteWidget(widgetId);
      });
    });

    // Upload widget link
    const uploadLink = widgetSection.querySelector(".upload-widget-link");
    if (uploadLink) {
      uploadLink.addEventListener("click", (e) => {
        e.preventDefault();
        // Scroll to first empty widget slot
        const emptySlot = document.querySelector("[data-widget-slot]");
        if (emptySlot) {
          emptySlot.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = "info") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
}

// Global functions for HTML onclick handlers (for backward compatibility)
window.previewWidget = function (widgetId) {
  if (window.widgetDisplay) {
    window.widgetDisplay.previewWidget(widgetId);
  }
};

window.uploadWidget = function (slotNumber) {
  if (window.widgetDisplay) {
    window.widgetDisplay.uploadWidget(slotNumber);
  }
};

window.editWidget = function (widgetId) {
  if (window.widgetDisplay) {
    window.widgetDisplay.editWidget(widgetId);
  }
};

window.deleteWidget = function (widgetId) {
  if (window.widgetDisplay) {
    window.widgetDisplay.deleteWidget(widgetId);
  }
};

// Initialize widget display when user is authenticated
let widgetDisplay = null;

// Wait for authentication before initializing
auth.onAuthStateChanged((user) => {
  if (user) {
    if (!widgetDisplay) {
      widgetDisplay = new WidgetDisplay();
      widgetDisplay.init();
      window.widgetDisplay = widgetDisplay; // Make globally accessible
    }
  } else {
    widgetDisplay = null;
    window.widgetDisplay = null;
  }
});
