// Enhanced Widget Display System with Quip Management and WebGL Support
import { db, auth, storage } from "../../../../core/firebase-core.js";
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
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import profileDashboardManager from "../profile-dashboard-manager.js";

/**
 * Widget Display System
 * Handles displaying user widgets in iframes and managing widget metadata
 * Updated to work with new widget data model
 */

export class WidgetDisplay {
  constructor() {
    this.currentUser = null;
    this.userWidgets = []; // Array of widget IDs (legacy)
    this.widgetData = {}; // Cache for widget metadata (legacy)
    this.userWidgetBundles = []; // Array of widget bundle IDs (new)
    this.widgetBundleData = {}; // Cache for widget bundle metadata (new)
    this.userQuips = []; // Array of quip IDs
    this.quipData = {}; // Cache for quip metadata
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
   * Initialize the widget display system with quip support
   */
  async init() {
    this.currentUser = auth.currentUser;
    if (!this.currentUser) {
      this.log("No user logged in for widget display");
      return;
    }

    this.log("Initializing enhanced widget display system with quip support");
    await this.loadUserWidgets();
    await this.loadUserQuips();
    this.setupWidgetSlots();
    this.setupQuipSlots();
    this.setupProfileMenuIntegration();
  }

  /**
   * Load user's widget data from Firestore (supports both old and new formats)
   */
  async loadUserWidgets() {
    try {
      const userDoc = await getDoc(doc(db, "users", this.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Load both old widgets and new widget bundles
        this.userWidgets = userData.widgets || [];
        this.userWidgetBundles = userData.widgetBundles || [];

        this.log("Loaded user widgets and bundles", {
          widgetCount: this.userWidgets.length,
          bundleCount: this.userWidgetBundles.length,
        });

        // Load metadata for both types
        await this.loadWidgetMetadata();
        await this.loadWidgetBundleMetadata();
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
   * Load metadata for all user widget bundles
   */
  async loadWidgetBundleMetadata() {
    try {
      for (const bundleId of this.userWidgetBundles) {
        const bundleDoc = await getDoc(doc(db, "widgetBundles", bundleId));
        if (bundleDoc.exists()) {
          this.widgetBundleData[bundleId] = bundleDoc.data();
        }
      }
      this.log("Loaded widget bundle metadata", {
        bundleCount: Object.keys(this.widgetBundleData).length,
      });
    } catch (error) {
      this.error("Error loading widget bundle metadata", error);
    }
  }

  /**
   * Load user's quip data from Firestore
   */
  async loadUserQuips() {
    try {
      this.log("Loading user quips for user:", this.currentUser.uid);

      const quipsRef = collection(db, "quips");
      const q = query(quipsRef, where("userId", "==", this.currentUser.uid));
      const querySnapshot = await getDocs(q);

      this.userQuips = querySnapshot.docs.map((doc) => doc.id);
      this.log("Loaded user quips", {
        quipCount: this.userQuips.length,
        quipIds: this.userQuips,
      });

      // Load quip metadata
      await this.loadQuipMetadata();
    } catch (error) {
      this.error("Error loading user quips", error);

      // Check if it's a permissions error
      if (error.code === "permission-denied") {
        this.log("Permission denied - user may not be authenticated properly");
        // Try to reload auth state
        if (window.socialAuth && window.socialAuth.currentUser) {
          this.log("Retrying with current auth user");
          this.currentUser = window.socialAuth.currentUser;
          // Retry once
          try {
            const quipsRef = collection(db, "quips");
            const q = query(
              quipsRef,
              where("userId", "==", this.currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            this.userQuips = querySnapshot.docs.map((doc) => doc.id);
            this.log("Retry successful - loaded user quips", {
              quipCount: this.userQuips.length,
            });
            await this.loadQuipMetadata();
          } catch (retryError) {
            this.error("Retry also failed", retryError);
          }
        }
      }
    }
  }

  /**
   * Load metadata for all user quips
   */
  async loadQuipMetadata() {
    try {
      for (const quipId of this.userQuips) {
        const quipDoc = await getDoc(doc(db, "quips", quipId));
        if (quipDoc.exists()) {
          this.quipData[quipId] = quipDoc.data();
        }
      }
      this.log("Loaded quip metadata", {
        quipCount: Object.keys(this.quipData).length,
      });
    } catch (error) {
      this.error("Error loading quip metadata", error);
    }
  }

  /**
   * Helper function to find HTML file in widget files array
   */
  findHtmlFile(files) {
    if (!Array.isArray(files) || files.length === 0) return null;

    // First try to find index.html
    const indexFile = files.find(
      (f) => f.fileName && /index\.html?$/i.test(f.fileName)
    );
    if (indexFile) return indexFile;

    // Fallback to any HTML file
    return files.find((f) => f.fileName && /\.html?$/i.test(f.fileName));
  }

  /**
   * Setup widget slots in the UI (supports both legacy widgets and new bundles)
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
   * Setup quip slots for enhanced WebGL rendering
   */
  setupQuipSlots() {
    const quipContainers = document.querySelectorAll(
      ".quip-slot, .quip-preview, .timeline-event-card"
    );
    quipContainers.forEach((container, index) => {
      this.renderQuipSlot(container, index + 1);
    });
  }

  /**
   * Render a specific quip slot with WebGL support
   */
  async renderQuipSlot(container, slotNumber) {
    // Find quip for this slot
    const quipForSlot = Object.values(this.quipData).find(
      (quip) => quip.slot === parseInt(slotNumber)
    );

    if (
      quipForSlot &&
      quipForSlot.files &&
      this.findHtmlFile(quipForSlot.files)
    ) {
      // Quip exists - show WebGL-enhanced iframe
      const htmlFile = this.findHtmlFile(quipForSlot.files);
      this.showQuipIframe(container, htmlFile.downloadURL, quipForSlot);
    } else {
      // No quip - show empty state
      this.showEmptyQuipSlot(container, slotNumber);
    }
  }

  /**
   * Render a specific widget slot (supports both legacy widgets and new bundles)
   */
  async renderWidgetSlot(container, slotNumber) {
    // First check for new widget bundles
    const bundleForSlot = Object.values(this.widgetBundleData).find(
      (bundle) =>
        bundle.slot === parseInt(slotNumber) && bundle.status === "ready"
    );

    if (bundleForSlot && bundleForSlot.entrypoints?.previewUrl) {
      // Widget bundle exists - show enhanced iframe
      this.showWidgetBundleIframe(container, bundleForSlot);
      return;
    }

    // Fallback to legacy widgets
    const widgetForSlot = Object.values(this.widgetData).find(
      (widget) => widget.slot === parseInt(slotNumber)
    );

    if (
      widgetForSlot &&
      widgetForSlot.files &&
      this.findHtmlFile(widgetForSlot.files)
    ) {
      // Legacy widget exists - show iframe
      const htmlFile = this.findHtmlFile(widgetForSlot.files);
      this.showWidgetIframe(container, htmlFile.downloadURL, widgetForSlot);
    } else {
      // No widget or bundle - show upload interface
      this.showUploadInterface(container, slotNumber);
    }
  }

  /**
   * Show widget bundle in enhanced iframe
   */
  showWidgetBundleIframe(container, bundleData) {
    const manifest = bundleData.manifest || {};
    const entrypoints = bundleData.entrypoints || {};

    container.innerHTML = `
      <div class="widget-bundle-container">
        <div class="widget-bundle-header">
          <h3>${manifest.name || bundleData.title || "Untitled Widget"}</h3>
          <div class="widget-bundle-badges">
            <span class="bundle-badge" style="background: rgba(0,240,255,0.2); color: #00f0ff; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">BUNDLE</span>
            ${manifest.version ? `<span class="version-badge" style="background: rgba(255,255,255,0.1); color: #fff; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">v${manifest.version}</span>` : ""}
          </div>
          <div class="widget-bundle-actions">
            <button class="btn btn-secondary edit-bundle-btn" data-bundle-id="${bundleData.id || bundleData.bundleId}">
              <span class="material-icons">edit</span>
              Edit
            </button>
            <button class="btn btn-secondary preview-bundle-btn" data-bundle-id="${bundleData.id || bundleData.bundleId}">
              <span class="material-icons">open_in_new</span>
              Full View
            </button>
            <button class="btn btn-danger delete-bundle-btn" data-bundle-id="${bundleData.id || bundleData.bundleId}">
              <span class="material-icons">delete</span>
              Delete
            </button>
          </div>
        </div>
        <div class="widget-bundle-frame-container">
          <iframe
            src="${entrypoints.previewUrl}"
            class="widget-bundle-iframe"
            frameborder="0"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Widget Bundle: ${manifest.name || "Preview"}"
            style="width: 100%; height: 300px; border-radius: 12px; border: 2px solid #00f0ff; background: #0a0a0a;"
          ></iframe>
        </div>
        <div class="widget-bundle-info">
          <p><strong>Description:</strong> ${manifest.description || bundleData.description || "No description"}</p>
          <div class="widget-bundle-stats">
            <span class="stat">📁 ${bundleData.fileCount || 0} files</span>
            <span class="stat">💾 ${(bundleData.totalSize / 1024 / 1024).toFixed(1)} MB</span>
            <span class="stat">📅 ${new Date(bundleData.createdAt?.toDate() || bundleData.createdAt).toLocaleDateString()}</span>
          </div>
          ${manifest.entry ? `<p><strong>Entry Point:</strong> ${manifest.entry}</p>` : ""}
        </div>
      </div>
    `;

    this.setupWidgetBundleActionHandlers(container);
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
   * Show quip in WebGL-enhanced iframe
   */
  showQuipIframe(container, htmlUrl, quipData) {
    container.innerHTML = `
      <div class="quip-container">
        <div class="quip-header">
          <h3 style="color: #00f0ff; font-family: JetBrains Mono;">${quipData.title || "Untitled Quip"}</h3>
          <div class="quip-badges">
            <span class="quip-type-badge" style="background: rgba(0,240,255,0.2); color: #00f0ff; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">QUIP</span>
            ${quipData.webglEnabled ? '<span class="webgl-badge" style="background: rgba(255,0,255,0.2); color: #ff00ff; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">WebGL</span>' : ""}
          </div>
          <div class="quip-actions">
            <button class="btn btn-primary interact-quip-btn" data-quip-id="${quipData.id}">
              <span>🎮</span>
              Interact
            </button>
            <button class="btn btn-secondary edit-quip-btn" data-quip-id="${quipData.id}">
              <span>✏️</span>
              Edit
            </button>
            <button class="btn btn-secondary preview-quip-btn" data-quip-id="${quipData.id}">
              <span>👁️</span>
              Full View
            </button>
            <button class="btn btn-danger delete-quip-btn" data-quip-id="${quipData.id}">
              <span>🗑️</span>
              Delete
            </button>
          </div>
        </div>
        <div class="quip-frame-container">
          <iframe 
            src="${htmlUrl}" 
            class="quip-iframe webgl-enabled"
            frameborder="0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-webgl allow-pointer-lock"
            style="width: 100%; height: 300px; border-radius: 12px; border: 2px solid #00f0ff; background: #0a0a0a;"
            title="Quip Preview - ${quipData.title || "Untitled Quip"}"
          ></iframe>
        </div>
        <div class="quip-info">
          <p style="color: #a0a0a0; margin: 8px 0;">${quipData.description || "No description available"}</p>
          <div class="quip-meta">
            <span class="quip-interactions" style="color: #00f0ff;">Interactions: ${quipData.interactionCount || 0}</span>
            <span class="quip-category" style="color: #ff00ff;">Category: ${quipData.category || "general"}</span>
          </div>
        </div>
      </div>
    `;

    // Apply custom dashboard styling if available
    const iframe = container.querySelector(".quip-iframe");
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

    this.setupQuipActionHandlers(container);
  }

  /**
   * Show empty quip slot
   */
  showEmptyQuipSlot(container, slotNumber) {
    container.innerHTML = `
      <div class="empty-quip-slot" style="text-align: center; padding: 40px; border: 2px dashed #333; border-radius: 12px; background: rgba(0,240,255,0.05);">
        <div style="font-size: 3rem; margin-bottom: 16px; color: #00f0ff;">🎮</div>
        <h3 style="color: #00f0ff; margin-bottom: 8px; font-family: JetBrains Mono;">Empty Quip Slot ${slotNumber}</h3>
        <p style="color: #a0a0a0; margin-bottom: 16px;">Create an interactive WebGL quip to fill this slot</p>
        <button class="btn btn-primary create-quip-btn" data-slot="${slotNumber}" style="background: rgba(0,240,255,0.1); border: 1px solid #00f0ff; color: #00f0ff; padding: 8px 16px; border-radius: 6px;">
          <span>➕</span>
          Create Quip
        </button>
      </div>
    `;

    this.setupEmptyQuipHandlers(container);
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
    uploadForm.querySelector(".upload-placeholder p").textContent =
      `Selected: ${fileList}`;
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
   * Setup widget bundle action handlers
   */
  setupWidgetBundleActionHandlers(container) {
    // Edit bundle
    const editBtn = container.querySelector(".edit-bundle-btn");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        const bundleId = e.target.closest(".edit-bundle-btn").dataset.bundleId;
        this.editWidgetBundle(bundleId);
      });
    }

    // Preview bundle
    const previewBtn = container.querySelector(".preview-bundle-btn");
    if (previewBtn) {
      previewBtn.addEventListener("click", (e) => {
        const bundleId = e.target.closest(".preview-bundle-btn").dataset
          .bundleId;
        this.previewWidgetBundle(bundleId);
      });
    }

    // Delete bundle
    const deleteBtn = container.querySelector(".delete-bundle-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        const bundleId =
          e.target.closest(".delete-bundle-btn").dataset.bundleId;
        this.deleteWidgetBundle(bundleId);
      });
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
   * Setup quip action handlers
   */
  setupQuipActionHandlers(container) {
    // Interact with quip
    const interactBtn = container.querySelector(".interact-quip-btn");
    if (interactBtn) {
      interactBtn.addEventListener("click", (e) => {
        const quipId = e.target.closest(".interact-quip-btn").dataset.quipId;
        this.interactWithQuip(quipId);
      });
    }

    // Edit quip
    const editBtn = container.querySelector(".edit-quip-btn");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        const quipId = e.target.closest(".edit-quip-btn").dataset.quipId;
        this.editQuip(quipId);
      });
    }

    // Preview quip
    const previewBtn = container.querySelector(".preview-quip-btn");
    if (previewBtn) {
      previewBtn.addEventListener("click", (e) => {
        const quipId = e.target.closest(".preview-quip-btn").dataset.quipId;
        this.previewQuip(quipId);
      });
    }

    // Delete quip
    const deleteBtn = container.querySelector(".delete-quip-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        const quipId = e.target.closest(".delete-quip-btn").dataset.quipId;
        this.deleteQuip(quipId);
      });
    }
  }

  /**
   * Setup empty quip slot handlers
   */
  setupEmptyQuipHandlers(container) {
    const createBtn = container.querySelector(".create-quip-btn");
    if (createBtn) {
      createBtn.addEventListener("click", (e) => {
        const slotNumber = e.target.closest(".create-quip-btn").dataset.slot;
        this.createNewQuip(slotNumber);
      });
    }
  }

  /**
   * Preview widget in modal
   */
  previewWidget(widgetId) {
    const widgetData = this.widgetData[widgetId];
    if (!widgetData) {
      this.showToast("Widget not found", "error");
      return;
    }

    const htmlFile = this.findHtmlFile(widgetData.files);
    if (!htmlFile || !htmlFile.downloadURL) {
      this.showToast("Widget HTML file not found", "error");
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
              src="${htmlFile.downloadURL}" 
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
    modal.querySelector("iframe").src = htmlFile.downloadURL;
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
   * Interact with quip (focus iframe and track interaction)
   */
  async interactWithQuip(quipId) {
    const quipData = this.quipData[quipId];
    if (!quipData) {
      this.showToast("Quip not found", "error");
      return;
    }

    // Focus the quip iframe
    const iframe = document.querySelector(
      `[data-quip-id="${quipId}"] .quip-iframe`
    );
    if (iframe) {
      iframe.focus();
      iframe.style.borderColor = "#ffff00";
      setTimeout(() => {
        iframe.style.borderColor = "#00f0ff";
      }, 2000);
    }

    // Track interaction
    try {
      await updateDoc(doc(db, "quips", quipId), {
        interactionCount: (quipData.interactionCount || 0) + 1,
        lastInteracted: serverTimestamp(),
      });
      this.log("Quip interaction tracked", { quipId });
    } catch (error) {
      this.error("Failed to track quip interaction", error);
    }
  }

  /**
   * Edit quip
   */
  editQuip(quipId) {
    const quipData = this.quipData[quipId];
    if (!quipData) {
      this.showToast("Quip not found", "error");
      return;
    }

    // Navigate to widget studio with quip data
    const editUrl = `pages/widget_studio.html?edit=${quipId}`;
    window.location.href = editUrl;
  }

  /**
   * Preview quip in modal
   */
  previewQuip(quipId) {
    const quipData = this.quipData[quipId];
    if (!quipData) {
      this.showToast("Quip not found", "error");
      return;
    }

    const htmlFile = this.findHtmlFile(quipData.files);
    if (!htmlFile || !htmlFile.downloadURL) {
      this.showToast("Quip HTML file not found", "error");
      return;
    }

    // Create modal if it doesn't exist
    let modal = document.getElementById("quipPreviewModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "quipPreviewModal";
      modal.className = "modal";
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
          <div class="modal-header">
            <h3>Quip Preview</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <iframe 
              src="${htmlFile.downloadURL}" 
              style="width: 100%; height: 70vh; border: none; border-radius: 8px;"
              sandbox="allow-scripts allow-same-origin allow-forms allow-webgl allow-pointer-lock"
            ></iframe>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Update modal content
    const iframe = modal.querySelector("iframe");
    iframe.src = htmlFile.downloadURL;
    modal.querySelector("h3").textContent =
      `Quip Preview - ${quipData.title || "Untitled Quip"}`;

    // Show modal
    modal.style.display = "flex";

    // Close modal handlers
    modal.querySelector(".modal-close").onclick = () => {
      modal.style.display = "none";
    };
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    };
  }

  /**
   * Delete quip
   */
  async deleteQuip(quipId) {
    const quipData = this.quipData[quipId];
    if (!quipData) {
      this.showToast("Quip not found", "error");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${quipData.title || "Untitled Quip"}"?`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "quips", quipId));

      // Remove from local data
      delete this.quipData[quipId];
      this.userQuips = this.userQuips.filter((id) => id !== quipId);

      this.showToast("Quip deleted successfully", "success");
      this.log("Quip deleted", { quipId });

      // Refresh the display
      this.setupQuipSlots();
    } catch (error) {
      this.error("Failed to delete quip", error);
      this.showToast("Failed to delete quip", "error");
    }
  }

  /**
   * Create new quip
   */
  createNewQuip(slotNumber) {
    // Navigate to widget studio with slot information
    const createUrl = `pages/widget_studio.html?slot=${slotNumber}&type=quip`;
    window.location.href = createUrl;
  }

  /**
   * Edit widget bundle
   */
  editWidgetBundle(bundleId) {
    const bundleData = this.widgetBundleData[bundleId];
    if (!bundleData) {
      this.showToast("Widget bundle not found", "error");
      return;
    }

    // Navigate to widget studio with bundle data
    const editUrl = `../widget_studio.html?editBundle=${bundleId}`;
    window.location.href = editUrl;
  }

  /**
   * Preview widget bundle in modal
   */
  previewWidgetBundle(bundleId) {
    const bundleData = this.widgetBundleData[bundleId];
    if (!bundleData) {
      this.showToast("Widget bundle not found", "error");
      return;
    }

    const entrypoints = bundleData.entrypoints || {};
    if (!entrypoints.fullUrl) {
      this.showToast("Widget bundle preview not available", "error");
      return;
    }

    // Create modal if it doesn't exist
    let modal = document.getElementById("widgetBundlePreviewModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "widgetBundlePreviewModal";
      modal.className = "modal";
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
          <div class="modal-header">
            <h3>Widget Bundle Preview</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <iframe
              src="${entrypoints.fullUrl}"
              style="width: 100%; height: 70vh; border: none; border-radius: 8px;"
              sandbox="allow-scripts allow-same-origin allow-forms"
            ></iframe>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Update modal content
    const iframe = modal.querySelector("iframe");
    iframe.src = entrypoints.fullUrl;
    modal.querySelector("h3").textContent =
      `Widget Bundle Preview - ${bundleData.manifest?.name || bundleData.title || "Untitled"}`;

    // Show modal
    modal.style.display = "flex";

    // Close modal handlers
    modal.querySelector(".modal-close").onclick = () => {
      modal.style.display = "none";
    };
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    };
  }

  /**
   * Delete widget bundle
   */
  async deleteWidgetBundle(bundleId) {
    const bundleData = this.widgetBundleData[bundleId];
    if (!bundleData) {
      this.showToast("Widget bundle not found", "error");
      return;
    }

    const bundleName =
      bundleData.manifest?.name || bundleData.title || "Untitled Widget";
    if (!confirm(`Are you sure you want to delete "${bundleName}"?`)) {
      return;
    }

    try {
      // Delete bundle document
      await deleteDoc(doc(db, "widgetBundles", bundleId));

      // Remove bundle ID from user's profile
      await updateDoc(doc(db, "users", this.currentUser.uid), {
        widgetBundles: arrayRemove(bundleId),
      });

      // Remove from local data
      delete this.widgetBundleData[bundleId];
      this.userWidgetBundles = this.userWidgetBundles.filter(
        (id) => id !== bundleId
      );

      this.showToast("Widget bundle deleted successfully", "success");
      this.log("Widget bundle deleted", { bundleId });

      // Refresh the display
      this.setupWidgetSlots();
    } catch (error) {
      this.error("Failed to delete widget bundle", error);
      this.showToast("Failed to delete widget bundle", "error");
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
