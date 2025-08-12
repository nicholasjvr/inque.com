// Widget Upload Manager - Updated to use Cloud Functions
// This module now uses serverless functions for better performance and reliability

import cloudUploadManager from "../upload/cloud-upload.js";
import widgetPreviewManager from "./widget-preview.js";

class WidgetUploadManager {
  constructor() {
    this.uploadingSlots = new Set(); // Track active uploads per slot
    this.log("Widget Upload Manager initialized with Cloud Functions");
  }

  log(message, data = null) {
    console.log(`[WIDGET UPLOAD] ${message}`, data || "");
  }

  error(message, error = null) {
    console.error(`[WIDGET UPLOAD ERROR] ${message}`, error || "");
  }

  async init() {
    try {
      this.log("Initializing widget upload system");

      // Initialize without connection test
      this.log("Widget upload system initialized");
      this.setupEventListeners();
      return true;
    } catch (error) {
      this.error("Failed to initialize widget upload system", error);
      return false;
    }
  }

  setupEventListeners() {
    this.log("Setting up event listeners");

    // Widget upload buttons
    const uploadButtons = document.querySelectorAll(".upload-widget-btn");
    uploadButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleUploadButtonClick(btn);
      });
    });

    // Preview buttons
    const previewButtons = document.querySelectorAll(".preview-widget-btn");
    previewButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handlePreviewButtonClick(btn);
      });
    });

    // File input change events
    const fileInputs = document.querySelectorAll(".widget-file-input");
    fileInputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        this.handleFileInputChange(e.target);
      });
    });

    // Drag and drop events
    const uploadAreas = document.querySelectorAll(".widget-upload-area");
    uploadAreas.forEach((area) => {
      this.setupDragAndDrop(area);
    });

    this.log("Event listeners setup complete");
  }

  setupDragAndDrop(uploadArea) {
    const fileInput = uploadArea.querySelector(".widget-file-input");

    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "var(--primary-color)";
      uploadArea.style.background = "rgba(0, 240, 255, 0.1)";
    });

    uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#555";
      uploadArea.style.background = "#0f0f0f";
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#555";
      uploadArea.style.background = "#0f0f0f";

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        this.handleFileInputChange(fileInput);
      }
    });

    // Click to upload
    uploadArea.addEventListener("click", (e) => {
      // Prevent triggering if clicking on file list or action buttons
      if (
        e.target.closest(".file-list") ||
        e.target.closest(".action-buttons")
      ) {
        return;
      }

      fileInput.value = ""; // Reset to allow re-selecting same file
      fileInput.click();
    });
  }

  handleFileInputChange(fileInput) {
    const files = fileInput.files;
    if (files.length > 0) {
      this.log("Files selected", { count: files.length });
      this.updateFileList(fileInput, files);

      // Show preview of selected files
      widgetPreviewManager.handleFiles(files);
    }
  }

  updateFileList(fileInput, files) {
    const uploadArea = fileInput.closest(".widget-upload-area");
    const placeholder = uploadArea.querySelector(".upload-placeholder p");

    if (files.length > 0) {
      placeholder.textContent = `${files.length} file(s) selected`;

      // Create file list display
      let fileList = uploadArea.querySelector(".file-list");
      if (!fileList) {
        fileList = document.createElement("div");
        fileList.className = "file-list";
        uploadArea.appendChild(fileList);
      }

      fileList.innerHTML = "";
      Array.from(files).forEach((file) => {
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.innerHTML = `
          <span class="file-name">${file.name}</span>
          <span class="file-size">${this.formatFileSize(file.size)}</span>
        `;
        fileList.appendChild(fileItem);
      });
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async handlePreviewButtonClick(button) {
    const slot = button.getAttribute("data-slot");
    const fileInput = document.querySelector(
      `.widget-file-input[data-slot="${slot}"]`
    );

    if (!fileInput.files.length) {
      this.showToast("Please select files to preview.", "warning");
      return;
    }

    this.log("Showing preview for slot", { slot });
    await widgetPreviewManager.handleFiles(fileInput.files);
  }

  async handleUploadButtonClick(button) {
    const slot = button.getAttribute("data-slot");

    if (this.uploadingSlots.has(slot)) {
      this.log("Upload already in progress for slot", { slot });
      return;
    }

    const fileInput = document.querySelector(
      `.widget-file-input[data-slot="${slot}"]`
    );
    const titleInput = document.querySelector(
      `.widget-title-input[data-slot="${slot}"]`
    );
    const descInput = document.querySelector(
      `.widget-desc-input[data-slot="${slot}"]`
    );

    if (!fileInput.files.length) {
      this.showToast("Please select files to upload.", "warning");
      return;
    }

    // Validate files
    if (!cloudUploadManager.validateFiles(fileInput.files)) {
      this.showToast(
        "Invalid file type selected. Allowed: html, js, css, png, jpg, jpeg, gif, svg, json.",
        "error"
      );
      return;
    }

    const title = titleInput.value.trim() || "Untitled Widget";
    const desc = descInput.value.trim() || "";

    this.uploadingSlots.add(slot);
    button.textContent = "Uploading...";
    button.disabled = true;

    try {
      this.log("Starting widget upload", {
        slot,
        fileCount: fileInput.files.length,
      });

      // Use Cloud Functions for upload
      const result = await cloudUploadManager.uploadWithProgress(
        fileInput.files,
        slot,
        { title, description: desc },
        (progress, message) => {
          button.textContent = `${message} (${progress}%)`;
        }
      );

      this.log("Widget upload successful", result);

      button.textContent = `Uploaded to Slot ${slot}!`;
      button.style.background = "linear-gradient(45deg, #4caf50, #45a049)";

      this.showToast(
        `Successfully uploaded ${result.files.length} files! 🎉`,
        "success"
      );

      // Refresh widget display to show the new widget
      if (window.widgetDisplay) {
        this.log("Refreshing widget display...");
        await window.widgetDisplay.loadUserWidgets();
        window.widgetDisplay.setupWidgetSlots();
        this.log("Widget display refreshed.");
      }

      // Reset form after successful upload
      setTimeout(() => {
        button.textContent = `Upload to Slot ${slot}`;
        button.disabled = false;
        button.style.background = "linear-gradient(45deg, #4caf50, #45a049)";
        fileInput.value = "";
        titleInput.value = "";
        descInput.value = "";

        // Clear file list
        const uploadArea = fileInput.closest(".widget-upload-area");
        const fileList = uploadArea.querySelector(".file-list");
        if (fileList) fileList.remove();

        const placeholder = uploadArea.querySelector(".upload-placeholder p");
        placeholder.textContent = "Drop files here or click to upload";
      }, 2000);
    } catch (error) {
      this.error("Widget upload failed", error);

      button.textContent = "Upload Failed";
      button.style.background = "linear-gradient(45deg, #f44336, #d32f2f)";

      this.showToast(`Upload failed: ${error.message}`, "error");

      setTimeout(() => {
        button.textContent = `Upload to Slot ${slot}`;
        button.disabled = false;
        button.style.background = "linear-gradient(45deg, #4caf50, #45a049)";
      }, 2000);
    } finally {
      this.uploadingSlots.delete(slot);
    }
  }

  showToast(message, type = "info") {
    // Use existing toast system if available
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[TOAST ${type.toUpperCase()}] ${message}`);
    }
  }

  // Delete widget using Cloud Functions
  async deleteWidget(widgetId) {
    try {
      this.log("Deleting widget", { widgetId });
      const result = await cloudUploadManager.deleteWidget(widgetId);
      this.log("Widget deleted successfully", result);
      return result;
    } catch (error) {
      this.error("Widget deletion failed", error);
      throw error;
    }
  }

  // Get widget download URLs using Cloud Functions
  async getWidgetDownloadUrls(widgetId) {
    try {
      this.log("Getting widget download URLs", { widgetId });
      const result = await cloudUploadManager.getWidgetDownloadUrls(widgetId);
      this.log("Download URLs retrieved", result);
      return result;
    } catch (error) {
      this.error("Failed to get download URLs", error);
      throw error;
    }
  }

  // Handle widget upload from other modules (for backward compatibility)
  async handleWidgetUpload(widgetData) {
    try {
      this.log("Handling widget upload from auth module", {
        title: widgetData.title,
      });

      // Use Cloud Functions for upload
      const result = await cloudUploadManager.uploadWidgetFiles(
        widgetData.files,
        "slot-upload", // Generic slot for programmatic uploads
        {
          title: widgetData.title,
          description: widgetData.description || "",
          category: widgetData.category || "general",
          tags: widgetData.tags || [],
        }
      );

      this.log("Widget upload completed successfully", result);
      return { success: true, widgetId: result.widgetId, widget: result };
    } catch (error) {
      this.error("Widget upload failed", error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const widgetUploadManager = new WidgetUploadManager();
export default widgetUploadManager;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  widgetUploadManager.init();
});

// Export for use in other modules
export { WidgetUploadManager };
