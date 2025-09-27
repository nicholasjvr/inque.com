// Widget Studio Page - Dedicated page for widget management
// This replaces the modal-based approach and fixes z-index and double-prompt issues

import { auth, db } from "../../core/firebase-core.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import cloudUploadManager from "../../scripts/upload/cloud-upload.js";
import profileDashboardManager from "../profile_dashboard/pd_scripts/profile-dashboard-manager.js";

class WidgetStudioManager {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.slots = new Map();
    this.uploadingSlots = new Set();
    this.selectedFiles = new Map();

    console.log("[WIDGET STUDIO] Widget Studio Manager initialized");
  }

  log(message, data = null) {
    console.log(`[WIDGET STUDIO] ${message}`, data || "");
  }

  error(message, error = null) {
    console.error(`[WIDGET STUDIO ERROR] ${message}`, error || "");
  }

  async init() {
    try {
      this.log("Initializing Widget Studio page");

      // Wait for auth to be ready
      await this.waitForAuth();

      // Load user profile
      await this.loadUserProfile();

      // Setup event listeners
      this.setupEventListeners();

      // Load existing widgets
      await this.loadExistingWidgets();

      // Update stats
      this.updateStudioStats();

      // Initialize profile dashboard integration
      await this.initializeProfileIntegration();

      // Test cloud upload connection
      await this.testCloudUploadConnection();

      this.log("Widget Studio page initialization complete");
    } catch (error) {
      this.error("Failed to initialize Widget Studio page", error);
      this.showToast("Failed to initialize Widget Studio", "error");
    }
  }

  async waitForAuth() {
    return new Promise((resolve) => {
      if (auth.currentUser) {
        resolve();
      } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve();
          }
        });
      }
    });
  }

  async loadUserProfile() {
    try {
      this.currentUser = auth.currentUser;
      if (!this.currentUser) {
        throw new Error("No authenticated user");
      }

      this.log("Loading user profile", { uid: this.currentUser.uid });

      const userDoc = await getDoc(doc(db, "users", this.currentUser.uid));
      if (userDoc.exists()) {
        this.userProfile = userDoc.data();
        this.updateUserDisplay();
        this.log("User profile loaded successfully");
      } else {
        throw new Error("User profile not found");
      }
    } catch (error) {
      this.error("Failed to load user profile", error);
      throw error;
    }
  }

  updateUserDisplay() {
    if (!this.userProfile) return;

    // Update user name
    const userNameElement = document.getElementById("userName");
    if (userNameElement) {
      userNameElement.textContent = this.userProfile.name || "User";
    }

    // Update user avatar
    const userAvatarElement = document.getElementById("userAvatar");
    if (userAvatarElement && this.userProfile.photoURL) {
      userAvatarElement.style.backgroundImage = `url(${this.userProfile.photoURL})`;
      userAvatarElement.innerHTML = "";
    }
  }

  async initializeProfileIntegration() {
    try {
      this.log("Initializing profile dashboard integration");

      // Wait for profile dashboard manager to be ready
      if (profileDashboardManager) {
        await profileDashboardManager.init();
        this.log("Profile dashboard manager initialized");

        // Apply current dashboard settings to preview elements
        this.applyDashboardStylingToPreviews();
      } else {
        this.log("Profile dashboard manager not available");
      }
    } catch (error) {
      this.error("Failed to initialize profile integration", error);
    }
  }

  // Check if user has premium features
  isPremiumUser() {
    const userProfile = this.userProfile || {};
    return userProfile.isPremium || userProfile.level >= 3 || false;
  }

  async testCloudUploadConnection() {
    try {
      this.log("Testing cloud upload connection");

      // Check if cloud upload manager is available
      if (!cloudUploadManager) {
        throw new Error("Cloud upload manager not available");
      }

      // Check if Firebase functions are available
      if (!cloudUploadManager.functions) {
        throw new Error("Firebase functions not initialized");
      }

      this.log("Cloud upload connection test passed");
    } catch (error) {
      this.error("Cloud upload connection test failed", error);
      this.showToast("Warning: Cloud upload may not work properly", "warning");
    }
  }

  applyDashboardStylingToPreviews() {
    try {
      if (!profileDashboardManager) return;

      // Apply styling to any existing preview elements
      const previewElements = document.querySelectorAll(
        ".preview-modal .widget-iframe"
      );
      previewElements.forEach((element) => {
        profileDashboardManager.applyDashboardSettings(element);
      });

      this.log("Applied dashboard styling to preview elements", {
        count: previewElements.length,
      });
    } catch (error) {
      this.error("Failed to apply dashboard styling to previews", error);
    }
  }

  setupEventListeners() {
    this.log("Setting up event listeners");

    // File input change events
    for (let i = 1; i <= 3; i++) {
      const fileInput = document.getElementById(`fileInput${i}`);
      const uploadArea = document.getElementById(`uploadArea${i}`);

      this.log(`Looking for elements for slot ${i}`, {
        fileInput: !!fileInput,
        uploadArea: !!uploadArea,
        fileInputElement: fileInput,
        uploadAreaElement: uploadArea,
      });

      if (fileInput && uploadArea) {
        this.setupFileInput(fileInput, uploadArea, i);
        this.setupDragAndDrop(uploadArea, i);
      } else {
        this.error(`Missing elements for slot ${i}`, {
          fileInput: !!fileInput,
          uploadArea: !!uploadArea,
        });
      }
    }

    // Preview buttons
    for (let i = 1; i <= 3; i++) {
      const previewBtn = document.getElementById(`previewBtn${i}`);
      if (previewBtn) {
        previewBtn.addEventListener("click", () => this.handlePreview(i));
      }
    }

    // Upload buttons
    for (let i = 1; i <= 3; i++) {
      const uploadBtn = document.getElementById(`uploadBtn${i}`);
      if (uploadBtn) {
        uploadBtn.addEventListener("click", () => this.handleUpload(i));
      }
    }

    // Clear files buttons
    const clearButtons = document.querySelectorAll(".clear-files-btn");
    clearButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const slot = e.target.dataset.slot;
        this.clearSlotFiles(slot);
      });
    });

    // Studio action buttons
    const saveAllBtn = document.getElementById("saveAllBtn");
    if (saveAllBtn) {
      saveAllBtn.addEventListener("click", () => this.saveAllChanges());
    }

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshStudio());
    }

    // Preview modal close
    const previewModalClose = document.getElementById("previewModalClose");
    if (previewModalClose) {
      previewModalClose.addEventListener("click", () =>
        this.hidePreviewModal()
      );
    }

    // Close preview modal on outside click
    const previewModal = document.getElementById("previewModal");
    if (previewModal) {
      previewModal.addEventListener("click", (e) => {
        if (e.target === previewModal) {
          this.hidePreviewModal();
        }
      });
    }

    this.log("Event listeners setup complete");
  }

  setupFileInput(fileInput, uploadArea, slotNumber) {
    this.log(`Setting up file input for slot ${slotNumber}`, {
      fileInput: !!fileInput,
      uploadArea: !!uploadArea,
      fileInputId: fileInput?.id,
      uploadAreaId: uploadArea?.id,
    });

    fileInput.addEventListener("change", (e) => {
      this.log(`Files selected for slot ${slotNumber}`, {
        count: e.target.files.length,
        files: Array.from(e.target.files).map((f) => f.name),
      });
      this.handleFileSelection(e.target.files, slotNumber);
    });

    // Make upload area clickable - prevent double triggers
    uploadArea.addEventListener("click", (e) => {
      this.log(`Upload area clicked for slot ${slotNumber}`, {
        target: e.target.tagName,
        isFileInput: e.target === fileInput,
      });
      // Only trigger if not clicking on the file input itself
      if (e.target !== fileInput) {
        e.preventDefault();
        this.log(`Triggering file input click for slot ${slotNumber}`);
        fileInput.click();
      }
    });

    // Add mousedown handler to ensure file input gets focus
    uploadArea.addEventListener("mousedown", (e) => {
      if (e.target !== fileInput) {
        e.preventDefault();
        fileInput.focus();
      }
    });

    // Add a test method to verify file input is working
    this.testFileInput = () => {
      this.log(`Testing file input for slot ${slotNumber}`);
      fileInput.click();
    };
  }

  setupDragAndDrop(uploadArea, slotNumber) {
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");

      const files = Array.from(e.dataTransfer.files);
      this.log(`Files dropped on slot ${slotNumber}`, { count: files.length });
      this.handleFileSelection(files, slotNumber);
    });
  }

  handleFileSelection(files, slotNumber) {
    if (!files || files.length === 0) return;

    // Validate that it's a zip file
    const file = files[0]; // Since we're now accepting single zip files
    if (
      !file.name.toLowerCase().endsWith(".zip") &&
      file.type !== "application/zip"
    ) {
      this.showToast("Please select a valid ZIP file", "error");
      return;
    }

    // Store selected zip file for this slot
    this.selectedFiles.set(slotNumber, [file]);

    // Update UI to show selected zip file
    this.updateZipFileDisplay(slotNumber, file);

    // Update slot status
    this.updateSlotStatus(slotNumber, "ZIP Selected");

    // Enable preview and upload buttons
    this.updateSlotButtons(slotNumber, true);

    this.log(`ZIP file selected for slot ${slotNumber}`, {
      fileName: file.name,
      size: file.size,
    });
  }

  updateZipFileDisplay(slotNumber, zipFile) {
    const selectedFilesDiv = document.getElementById(
      `selectedFiles${slotNumber}`
    );
    const filesListDiv = document.getElementById(`filesList${slotNumber}`);
    const placeholderDiv = document.getElementById(`placeholder${slotNumber}`);

    if (!selectedFilesDiv || !filesListDiv || !placeholderDiv) return;

    // Hide placeholder
    placeholderDiv.style.display = "none";

    // Show selected files section
    selectedFilesDiv.style.display = "block";

    // Clear existing file list
    filesListDiv.innerHTML = "";

    // Create zip file item
    const zipFileItem = this.createZipFileItem(zipFile);
    filesListDiv.appendChild(zipFileItem);
  }

  updateFileDisplay(slotNumber, files) {
    // Legacy method for backward compatibility - now delegates to zip method
    if (
      files.length === 1 &&
      (files[0].name.toLowerCase().endsWith(".zip") ||
        files[0].type === "application/zip")
    ) {
      this.updateZipFileDisplay(slotNumber, files[0]);
    }
  }

  updateFileInputDisplay(slotNumber, files) {
    const fileInput = document.getElementById(`fileInput${slotNumber}`);
    if (!fileInput) return;

    // Create a new FileList-like object for the input
    // Note: We can't directly set files on input, but we can show file names
    const fileNames = Array.from(files)
      .map((file) => file.name)
      .join(", ");

    // Add a visual indicator that files are selected
    const uploadArea = document.getElementById(`uploadArea${slotNumber}`);
    if (uploadArea) {
      // Add a class to show files are selected
      uploadArea.classList.add("has-files");

      // Update placeholder text to show file count
      const placeholder = document.getElementById(`placeholder${slotNumber}`);
      if (placeholder) {
        const originalText = placeholder.innerHTML;
        placeholder.innerHTML = `
          <span class="upload-icon">✅</span>
          <p>${files.length} file(s) selected</p>
          <span class="upload-hint">Click to change files</span>
        `;
      }
    }

    this.log(`File input display updated for slot ${slotNumber}`, {
      fileCount: files.length,
      fileNames: fileNames,
    });
  }

  createZipFileItem(zipFile) {
    const zipFileItem = document.createElement("div");
    zipFileItem.className = "zip-file-item";

    const fileSize = this.formatFileSize(zipFile.size);

    zipFileItem.innerHTML = `
      <div class="zip-file-info">
        <span class="zip-file-icon">📦</span>
        <div class="zip-file-details">
          <span class="zip-file-name" title="${zipFile.name}">${zipFile.name}</span>
          <span class="zip-file-size">${fileSize}</span>
          <span class="zip-file-type">ZIP Archive</span>
        </div>
      </div>
      <button class="remove-zip-file" title="Remove zip file">×</button>
    `;

    // Add remove functionality
    const removeBtn = zipFileItem.querySelector(".remove-zip-file");
    removeBtn.addEventListener("click", () => {
      this.removeZipFile(zipFile, zipFileItem);
    });

    return zipFileItem;
  }

  createFileItem(file) {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";

    const fileIcon = this.getFileIcon(file.name);
    const fileSize = this.formatFileSize(file.size);

    fileItem.innerHTML = `
      <div class="file-info">
        <span class="file-icon">${fileIcon}</span>
        <span class="file-name" title="${file.name}">${file.name}</span>
        <span class="file-size">${fileSize}</span>
      </div>
      <button class="remove-file" title="Remove file">×</button>
    `;

    // Add remove functionality
    const removeBtn = fileItem.querySelector(".remove-file");
    removeBtn.addEventListener("click", () => {
      this.removeFile(file, fileItem);
    });

    return fileItem;
  }

  getFileIcon(fileName) {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const iconMap = {
      html: "🌐",
      css: "🎨",
      js: "⚡",
      png: "🖼️",
      jpg: "🖼️",
      jpeg: "🖼️",
      gif: "🖼️",
      svg: "🖼️",
      json: "📄",
      txt: "📝",
      md: "📝",
    };
    return iconMap[extension] || "📄";
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  removeZipFile(zipFile, zipFileItem) {
    zipFileItem.remove();

    // Update the selected files for this slot
    const slotNumber = this.getSlotNumberFromFileItem(zipFileItem);
    if (slotNumber) {
      this.selectedFiles.delete(slotNumber);
      this.clearSlotFiles(slotNumber);
    }
  }

  removeFile(file, fileItem) {
    fileItem.remove();

    // Update the selected files for this slot
    const slotNumber = this.getSlotNumberFromFileItem(fileItem);
    if (slotNumber) {
      const currentFiles = this.selectedFiles.get(slotNumber) || [];
      const updatedFiles = currentFiles.filter((f) => f !== file);
      this.selectedFiles.set(slotNumber, updatedFiles);

      if (updatedFiles.length === 0) {
        this.clearSlotFiles(slotNumber);
      }
    }
  }

  getSlotNumberFromFileItem(fileItem) {
    // Find which slot this file item belongs to
    for (let i = 1; i <= 3; i++) {
      const filesList = document.getElementById(`filesList${i}`);
      if (filesList && filesList.contains(fileItem)) {
        return i;
      }
    }
    return null;
  }

  clearSlotFiles(slotNumber) {
    this.selectedFiles.delete(slotNumber);

    const selectedFilesDiv = document.getElementById(
      `selectedFiles${slotNumber}`
    );
    const placeholderDiv = document.getElementById(`placeholder${slotNumber}`);
    const uploadArea = document.getElementById(`uploadArea${slotNumber}`);
    const fileInput = document.getElementById(`fileInput${slotNumber}`);

    if (selectedFilesDiv) selectedFilesDiv.style.display = "none";
    if (placeholderDiv) {
      placeholderDiv.style.display = "block";
      // Reset placeholder to original state
      placeholderDiv.innerHTML = `
        <span class="upload-icon">📁</span>
        <p>Drop files here or click to upload</p>
        <span class="upload-hint">Supports HTML, CSS, JS, images, and more</span>
      `;
    }

    // Reset upload area styling
    if (uploadArea) {
      uploadArea.classList.remove("has-files");
    }

    // Clear file input
    if (fileInput) {
      fileInput.value = "";
    }

    this.updateSlotStatus(slotNumber, "Available");
    this.updateSlotButtons(slotNumber, false);

    this.log(`Slot ${slotNumber} files cleared`);
  }

  updateSlotStatus(slotNumber, status) {
    const statusElement = document.getElementById(`slot${slotNumber}Status`);
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  updateSlotButtons(slotNumber, enabled) {
    const previewBtn = document.getElementById(`previewBtn${slotNumber}`);
    const uploadBtn = document.getElementById(`uploadBtn${slotNumber}`);

    if (previewBtn) previewBtn.disabled = !enabled;
    if (uploadBtn) uploadBtn.disabled = !enabled;
  }

  async handlePreview(slotNumber) {
    try {
      const files = this.selectedFiles.get(slotNumber);
      if (!files || files.length === 0) {
        this.showToast("No zip file selected for preview", "warning");
        return;
      }

      const zipFile = files[0];
      if (!zipFile.name.toLowerCase().endsWith(".zip")) {
        this.showToast("Please select a zip file to preview", "warning");
        return;
      }

      this.log(`Showing preview for zip file in slot ${slotNumber}`, {
        fileName: zipFile.name,
        size: zipFile.size,
      });

      // Show preview modal
      this.showPreviewModal();

      // Generate preview content for zip file
      const previewContent = await this.generateZipPreviewContent(zipFile);

      // Update modal content
      const previewModalBody = document.getElementById("previewModalBody");
      if (previewModalBody) {
        previewModalBody.innerHTML = previewContent;

        // Apply dashboard styling to preview iframes
        setTimeout(() => {
          this.applyDashboardStylingToPreviews();
        }, 100);
      }
    } catch (error) {
      this.error("Failed to show preview", error);
      this.showToast("Failed to generate preview", "error");
    }
  }

  async generateZipPreviewContent(zipFile) {
    try {
      // For now, show zip file info and indicate it will be processed
      const fileSize = this.formatFileSize(zipFile.size);

      let content = `
        <div class="zip-preview-content">
          <div class="zip-info">
            <div class="zip-icon">📦</div>
            <h3>ZIP File Preview</h3>
            <div class="zip-details">
              <p><strong>Filename:</strong> ${zipFile.name}</p>
              <p><strong>Size:</strong> ${fileSize}</p>
              <p><strong>Type:</strong> ZIP Archive</p>
            </div>
          </div>

          <div class="zip-processing-info">
            <h4>📋 Processing Information</h4>
            <p>This ZIP file will be processed when uploaded:</p>
            <ul>
              <li>✅ Extract all files and validate structure</li>
              <li>🔍 Look for manifest.json (recommended)</li>
              <li>🎯 Find HTML entry point (index.html)</li>
              <li>🎨 Analyze CSS dependencies</li>
              <li>⚡ Optimize assets for performance</li>
              <li>🚀 Generate preview and full-view URLs</li>
            </ul>
          </div>

          <div class="zip-manifest-hint">
            <h4>💡 Pro Tip: Add manifest.json</h4>
            <p>For better processing results, include a manifest.json file in your zip:</p>
            <div class="manifest-example">
              <pre><code>{
  "name": "My Awesome Widget",
  "version": "1.0.0",
  "entry": "index.html",
  "description": "A cool interactive widget"
}</code></pre>
            </div>
          </div>
        </div>
      `;

      return content;
    } catch (error) {
      this.error("Failed to generate zip preview content", error);
      return `
        <div class="preview-error">
          <span class="error-icon">❌</span>
          <p>Failed to preview ZIP file: ${error.message}</p>
        </div>
      `;
    }
  }

  async generatePreviewContent(files) {
    let content = '<div class="preview-content">';

    for (const file of files) {
      const fileIcon = this.getFileIcon(file.name);
      const fileSize = this.formatFileSize(file.size);

      content += `
        <div class="preview-file-item">
          <div class="preview-file-header">
            <span class="preview-file-icon">${fileIcon}</span>
            <span class="preview-file-name">${file.name}</span>
            <span class="preview-file-size">${fileSize}</span>
          </div>
      `;

      // Show file content based on type
      if (file.type.startsWith("image/")) {
        content += `<img src="${URL.createObjectURL(file)}" alt="${
          file.name
        }" style="max-width: 100%; max-height: 300px; border-radius: 8px;">`;
      } else if (
        file.type === "text/html" ||
        file.type === "text/css" ||
        file.type === "text/javascript" ||
        file.type === "text/plain"
      ) {
        const textContent = await this.readFileAsText(file);
        content += `<pre class="preview-code"><code>${this.escapeHtml(
          textContent
        )}</code></pre>`;
      } else {
        content += `<p class="preview-no-preview">Preview not available for this file type</p>`;
      }

      content += "</div>";
    }

    content += "</div>";
    return content;
  }

  async readFileAsText(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsText(file);
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showPreviewModal() {
    const previewModal = document.getElementById("previewModal");
    if (previewModal) {
      previewModal.classList.add("show");
    }
  }

  hidePreviewModal() {
    const previewModal = document.getElementById("previewModal");
    if (previewModal) {
      previewModal.classList.remove("show");
    }
  }

  async handleUpload(slotNumber) {
    try {
      const files = this.selectedFiles.get(slotNumber);
      if (!files || files.length === 0) {
        this.showToast("No zip file selected for upload", "warning");
        return;
      }

      const zipFile = files[0];
      if (!zipFile.name.toLowerCase().endsWith(".zip")) {
        this.showToast("Please select a zip file to upload", "warning");
        return;
      }

      if (this.uploadingSlots.has(slotNumber)) {
        this.showToast("Upload already in progress for this slot", "warning");
        return;
      }

      this.log(`Starting zip upload for slot ${slotNumber}`, {
        fileName: zipFile.name,
        size: zipFile.size,
      });

      // Mark slot as uploading
      this.uploadingSlots.add(slotNumber);
      this.updateSlotStatus(slotNumber, "Processing ZIP...");
      this.updateSlotButtons(slotNumber, false);

      // Show progress
      this.showUploadProgress(slotNumber);

      // Get widget metadata
      const title =
        document.getElementById(`title${slotNumber}`)?.value ||
        `Widget ${slotNumber}`;
      const description =
        document.getElementById(`description${slotNumber}`)?.value || "";
      const tags = document.getElementById(`tags${slotNumber}`)?.value || "";

      // Upload zip file via Cloud Functions with progress tracking
      const result = await cloudUploadManager.uploadWidgetBundle(
        zipFile,
        slotNumber,
        {
          title,
          description,
          tags,
          slot: slotNumber,
        },
        (progress, message) => {
          this.updateUploadProgress(slotNumber, progress, message);
        }
      );

      this.log(`Upload result for slot ${slotNumber}`, result);

      if (result.success) {
        this.log(`Zip upload successful for slot ${slotNumber}`, result);
        this.showToast(
          `Widget uploaded successfully to slot ${slotNumber}!`,
          "success"
        );

        // Update slot status
        this.updateSlotStatus(slotNumber, "Active");

        // Store widget data
        this.slots.set(slotNumber, {
          widgetId: result.widgetId,
          title,
          description,
          tags,
          files: [
            {
              name: zipFile.name,
              size: zipFile.size,
              type: zipFile.type,
            },
          ],
          uploadedAt: new Date(),
          slot: slotNumber,
          isZipUpload: true,
        });

        // Update stats
        this.updateStudioStats();
      } else {
        this.error(`Zip upload failed for slot ${slotNumber}`, result);
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      this.error(`Zip upload failed for slot ${slotNumber}`, error);
      this.showToast(`Upload failed: ${error.message}`, "error");

      // Reset slot status
      this.updateSlotStatus(slotNumber, "Upload Failed");
      this.updateSlotButtons(slotNumber, true);
    } finally {
      // Hide progress
      this.hideUploadProgress(slotNumber);

      // Remove from uploading set
      this.uploadingSlots.delete(slotNumber);
    }
  }

  updateUploadProgress(slotNumber, progress, message) {
    const progressDiv = document.getElementById(`progress${slotNumber}`);
    const progressFill = document.getElementById(`progressFill${slotNumber}`);
    const progressText = document.getElementById(`progressText${slotNumber}`);

    if (progressDiv && progressFill && progressText) {
      progressDiv.style.display = "block";
      progressFill.style.width = `${progress}%`;
      progressText.textContent = message || `${Math.round(progress)}%`;
    }
  }

  showUploadProgress(slotNumber) {
    const progressDiv = document.getElementById(`progress${slotNumber}`);
    if (progressDiv) {
      progressDiv.style.display = "block";

      // Simulate progress (since Cloud Functions don't provide real-time progress)
      let progress = 0;
      const progressFill = document.getElementById(`progressFill${slotNumber}`);
      const progressText = document.getElementById(`progressText${slotNumber}`);

      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) progress = 90;

        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${Math.round(progress)}%`;

        if (progress >= 90) {
          clearInterval(interval);
        }
      }, 200);

      // Store interval for cleanup
      this.progressIntervals = this.progressIntervals || new Map();
      this.progressIntervals.set(slotNumber, interval);
    }
  }

  hideUploadProgress(slotNumber) {
    const progressDiv = document.getElementById(`progress${slotNumber}`);
    if (progressDiv) {
      progressDiv.style.display = "none";
    }

    // Complete progress bar
    const progressFill = document.getElementById(`progressFill${slotNumber}`);
    const progressText = document.getElementById(`progressText${slotNumber}`);

    if (progressFill) progressFill.style.width = "100%";
    if (progressText) progressText.textContent = "100%";

    // Clear progress interval
    if (this.progressIntervals && this.progressIntervals.has(slotNumber)) {
      clearInterval(this.progressIntervals.get(slotNumber));
      this.progressIntervals.delete(slotNumber);
    }
  }

  async loadExistingWidgets() {
    try {
      if (!this.currentUser) return;

      this.log("Loading existing widgets");

      // Query for existing widgets for this user
      const widgetsRef = collection(db, "widgets");
      const q = query(widgetsRef, where("userId", "==", this.currentUser.uid));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const widgetData = doc.data();
        const slot = widgetData.slot;

        if (slot && slot >= 1 && slot <= 3) {
          this.slots.set(slot, widgetData);
          this.updateSlotStatus(slot, "Active");
          this.updateSlotButtons(slot, false);

          // Update form fields
          this.updateSlotForm(slot, widgetData);
        }
      });

      this.log("Existing widgets loaded", { count: this.slots.size });
    } catch (error) {
      this.error("Failed to load existing widgets", error);
    }
  }

  updateSlotForm(slotNumber, widgetData) {
    const titleInput = document.getElementById(`title${slotNumber}`);
    const descriptionInput = document.getElementById(
      `description${slotNumber}`
    );
    const tagsInput = document.getElementById(`tags${slotNumber}`);

    if (titleInput) titleInput.value = widgetData.title || "";
    if (descriptionInput) descriptionInput.value = widgetData.description || "";
    if (tagsInput) tagsInput.value = widgetData.tags || "";
  }

  updateStudioStats() {
    const totalWidgets = this.slots.size;
    const activeSlots = Array.from(this.slots.values()).filter(
      (w) => w.status !== "deleted"
    ).length;
    const totalFiles = Array.from(this.slots.values()).reduce(
      (sum, w) => sum + (w.files?.length || 0),
      0
    );

    const totalWidgetsElement = document.getElementById("totalWidgets");
    const activeSlotsElement = document.getElementById("activeSlots");
    const totalFilesElement = document.getElementById("totalFiles");

    if (totalWidgetsElement) totalWidgetsElement.textContent = totalWidgets;
    if (activeSlotsElement) activeSlotsElement.textContent = activeSlots;
    if (totalFilesElement) totalFilesElement.textContent = totalFiles;
  }

  async saveAllChanges() {
    try {
      this.log("Saving all changes");

      // Collect all form data
      const changes = [];

      for (let i = 1; i <= 3; i++) {
        const title = document.getElementById(`title${i}`)?.value || "";
        const description =
          document.getElementById(`description${i}`)?.value || "";
        const tags = document.getElementById(`tags${i}`)?.value || "";

        if (this.slots.has(i)) {
          const widget = this.slots.get(i);
          if (
            widget.title !== title ||
            widget.description !== description ||
            widget.tags !== tags
          ) {
            changes.push({
              slot: i,
              title,
              description,
              tags,
              widgetId: widget.widgetId,
            });
          }
        }
      }

      if (changes.length === 0) {
        this.showToast("No changes to save", "info");
        return;
      }

      // Update widgets in Firestore
      for (const change of changes) {
        await updateDoc(doc(db, "widgets", change.widgetId), {
          title: change.title,
          description: change.description,
          tags: change.tags,
          updatedAt: new Date(),
        });

        // Update local data
        const widget = this.slots.get(change.slot);
        if (widget) {
          widget.title = change.title;
          widget.description = change.description;
          widget.tags = change.tags;
        }
      }

      this.showToast(
        `Saved ${changes.length} changes successfully!`,
        "success"
      );
      this.log("All changes saved successfully");
    } catch (error) {
      this.error("Failed to save changes", error);
      this.showToast("Failed to save changes", "error");
    }
  }

  async refreshStudio() {
    try {
      this.log("Refreshing studio");

      // Clear current state
      this.slots.clear();
      this.selectedFiles.clear();
      this.uploadingSlots.clear();

      // Reset UI
      for (let i = 1; i <= 3; i++) {
        this.clearSlotFiles(i);
        this.updateSlotForm(i, { title: "", description: "", tags: "" });
      }

      // Reload data
      await this.loadExistingWidgets();
      this.updateStudioStats();

      this.showToast("Studio refreshed successfully!", "success");
      this.log("Studio refresh complete");
    } catch (error) {
      this.error("Failed to refresh studio", error);
      this.showToast("Failed to refresh studio", "error");
    }
  }

  showToast(message, type = "info") {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  // Debug method to test file inputs
  testFileInputs() {
    this.log("Testing all file inputs");
    for (let i = 1; i <= 3; i++) {
      const fileInput = document.getElementById(`fileInput${i}`);
      if (fileInput) {
        this.log(`Testing file input ${i}`, { element: fileInput });
        fileInput.click();
      } else {
        this.error(`File input ${i} not found`);
      }
    }
  }
}

// Initialize Widget Studio when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[WIDGET STUDIO] DOM Content Loaded - Starting initialization");

  try {
    const widgetStudio = new WidgetStudioManager();
    await widgetStudio.init();

    // Expose widget studio to window for debugging
    window.widgetStudio = widgetStudio;

    console.log("[WIDGET STUDIO] Widget Studio page ready");
    console.log(
      "[WIDGET STUDIO] Debug: Use window.widgetStudio.testFileInputs() to test file inputs"
    );
  } catch (error) {
    console.error("[WIDGET STUDIO] Failed to initialize", error);
  }
});
