// Enhanced Widget Upload System
class WidgetUploadManager {
  constructor() {
    this.currentUploads = new Map();
    this.uploadingSlots = new Set(); // Track uploading slots
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedTypes = [
      "text/html",
      "text/css",
      "application/javascript",
      "application/json",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/svg+xml",
      "text/javascript",
    ];
    this.allowedExtensions = [
      ".html",
      ".css",
      ".js",
      ".json",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
    ];
    this.debugMode = true;
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[WIDGET UPLOAD] ${message}`, data || "");
    }
  }

  error(message, error = null) {
    console.error(`[WIDGET UPLOAD ERROR] ${message}`, error || "");
  }

  // Initialize the upload system
  init() {
    this.log("Initializing Widget Upload Manager");
    this.setupDragAndDrop();
    this.setupEventListeners();
    this.log("Widget Upload Manager initialized");
  }

  // Setup drag and drop functionality
  setupDragAndDrop() {
    const uploadAreas = document.querySelectorAll(".widget-upload-area");

    uploadAreas.forEach((area) => {
      area.addEventListener("dragover", (e) => {
        e.preventDefault();
        area.classList.add("drag-over");
        this.log("Drag over upload area");
      });

      area.addEventListener("dragleave", (e) => {
        e.preventDefault();
        area.classList.remove("drag-over");
        this.log("Drag leave upload area");
      });

      area.addEventListener("drop", (e) => {
        e.preventDefault();
        area.classList.remove("drag-over");

        const files = Array.from(e.dataTransfer.files);
        this.log("Files dropped", { count: files.length });

        this.handleFiles(files, area);
      });

      // Click to upload - prevent multiple triggers
      area.addEventListener("click", (e) => {
        // Don't trigger if clicking on file list or buttons
        if (
          e.target.closest(".file-list") ||
          e.target.closest(".widget-actions")
        ) {
          return;
        }

        const fileInput = area.querySelector('input[type="file"]');
        if (fileInput) {
          // Reset the file input to allow selecting the same file again
          fileInput.value = "";
          fileInput.click();
        }
      });
    });
  }

  // Handle file selection
  handleFiles(files, uploadArea) {
    const slot = uploadArea.closest(".widget-slot").dataset.slot;
    this.log("Handling files for slot", { slot, fileCount: files.length });

    // Prevent multiple simultaneous uploads for the same slot
    if (this.uploadingSlots.has(slot)) {
      this.log("Upload already in progress for slot", { slot });
      return;
    }

    // Validate files
    const validFiles = this.validateFiles(files);
    if (validFiles.length === 0) {
      this.showError(
        "No valid files selected. Please select HTML, CSS, JS, or image files."
      );
      return;
    }

    // Update UI to show selected files
    this.updateUploadArea(uploadArea, validFiles);

    // Start upload process
    this.uploadWidgetFiles(validFiles, slot);
  }

  // Validate files
  validateFiles(files) {
    const validFiles = [];

    for (const file of files) {
      // Check file size
      if (file.size > this.maxFileSize) {
        this.showError(`File ${file.name} is too large. Maximum size is 50MB.`);
        continue;
      }

      // Check file type
      const isValidType =
        this.allowedTypes.includes(file.type) ||
        this.allowedExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

      if (!isValidType) {
        this.showError(`File ${file.name} is not a supported type.`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }

  // Update upload area UI
  updateUploadArea(uploadArea, files) {
    const placeholder = uploadArea.querySelector(".upload-placeholder");
    const fileList =
      uploadArea.querySelector(".file-list") || this.createFileList(uploadArea);

    if (placeholder) {
      placeholder.style.display = "none";
    }

    // Clear existing file list
    fileList.innerHTML = "";

    // Add files to list
    files.forEach((file, index) => {
      const fileItem = this.createFileItem(file, index);
      fileList.appendChild(fileItem);
    });

    fileList.style.display = "block";
  }

  // Create file list element
  createFileList(uploadArea) {
    const fileList = document.createElement("div");
    fileList.className = "file-list";
    fileList.style.display = "none";
    uploadArea.appendChild(fileList);
    return fileList;
  }

  // Create file item element
  createFileItem(file, index) {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";
    fileItem.innerHTML = `
      <div class="file-info">
        <span class="file-icon">${this.getFileIcon(file.name)}</span>
        <span class="file-name">${file.name}</span>
        <span class="file-size">${this.formatFileSize(file.size)}</span>
      </div>
      <div class="file-status">
        <span class="status-text">Ready to upload</span>
        <button class="remove-file" data-index="${index}">×</button>
      </div>
    `;

    // Add remove file functionality
    const removeBtn = fileItem.querySelector(".remove-file");
    removeBtn.addEventListener("click", () => {
      fileItem.remove();
      this.log("File removed from upload queue", { fileName: file.name });
    });

    return fileItem;
  }

  // Get file icon based on extension
  getFileIcon(fileName) {
    const ext = fileName.toLowerCase().split(".").pop();
    const icons = {
      html: "🌐",
      css: "🎨",
      js: "⚡",
      json: "📄",
      png: "🖼️",
      jpg: "🖼️",
      jpeg: "🖼️",
      gif: "🖼️",
      svg: "🖼️",
    };
    return icons[ext] || "📁";
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Upload widget files
  async uploadWidgetFiles(files, slot) {
    const uploadId = `upload_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    this.log("Starting widget upload", {
      uploadId,
      slot,
      fileCount: files.length,
    });

    // Mark slot as uploading
    this.uploadingSlots.add(slot);

    try {
      // Get widget metadata
      const title =
        document.querySelector(`.widget-title-input[data-slot="${slot}"]`)
          ?.value || "Untitled Widget";
      const description =
        document.querySelector(`.widget-desc-input[data-slot="${slot}"]`)
          ?.value || "";
      const category =
        document.querySelector(`.widget-category-input[data-slot="${slot}"]`)
          ?.value || "general";
      const tags =
        document
          .querySelector(`.widget-tags-input[data-slot="${slot}"]`)
          ?.value?.split(",")
          .map((tag) => tag.trim()) || [];

      // Create upload progress UI
      const progressContainer = this.createProgressContainer(uploadId);
      document.body.appendChild(progressContainer);

      // Upload files with progress tracking
      const fileUrls = await this.uploadFilesWithProgress(
        files,
        uploadId,
        progressContainer
      );

      // Create widget document
      const widgetData = {
        title,
        description,
        category,
        tags,
        files: fileUrls,
        slot: parseInt(slot),
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database
      const result = await this.saveWidgetToDatabase(widgetData);

      if (result.success) {
        this.showSuccess(`Widget "${title}" uploaded successfully!`);
        this.updateWidgetSlot(slot, widgetData);
        this.log("Widget upload completed successfully", {
          widgetId: result.widgetId,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.error("Widget upload failed", error);
      this.showError(`Upload failed: ${error.message}`);
    } finally {
      // Clean up progress UI
      const progressContainer = document.getElementById(`progress-${uploadId}`);
      if (progressContainer) {
        progressContainer.remove();
      }

      // Mark slot as no longer uploading
      this.uploadingSlots.delete(slot);
    }
  }

  // Upload files with progress tracking
  async uploadFilesWithProgress(files, uploadId, progressContainer) {
    const fileUrls = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = ((i + 1) / totalFiles) * 100;

      // Update progress UI
      this.updateProgress(progressContainer, {
        current: i + 1,
        total: totalFiles,
        fileName: file.name,
        progress: progress,
      });

      try {
        // Upload file to storage
        const fileUrl = await this.uploadFileToStorage(file, uploadId);
        fileUrls.push(fileUrl);

        this.log("File uploaded successfully", {
          fileName: file.name,
          fileUrl,
        });
      } catch (error) {
        this.error("File upload failed", { fileName: file.name, error });
        throw error;
      }
    }

    return fileUrls;
  }

  // Upload single file to storage
  async uploadFileToStorage(file, uploadId) {
    try {
      this.log("Importing Firebase Storage modules");
      const { ref, uploadBytes, getDownloadURL } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js"
      );
      this.log("Importing Firebase Core");
      const { storage } = await import("../../../core/firebase-core.js");
      this.log("Firebase imports successful", { storage: !!storage });

      const fileRef = ref(storage, `uploads/${uploadId}/${file.name}`);
      await uploadBytes(fileRef, file);
      return await getDownloadURL(fileRef);
    } catch (error) {
      this.error("Failed to import Firebase modules", error);
      throw error;
    }
  }

  // Save widget to database
  async saveWidgetToDatabase(widgetData) {
    try {
      this.log("Importing Firebase Firestore modules");
      const { db, auth } = await import("../../../core/firebase-core.js");
      this.log("Firebase imports successful", { db: !!db, auth: !!auth });
      const { doc, setDoc, serverTimestamp, updateDoc, arrayUnion } =
        await import(
          "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
        );

      const widgetId = `widget_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const widgetDoc = {
        id: widgetId,
        ...widgetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          views: 0,
          likes: 0,
          shares: 0,
          downloads: 0,
        },
      };

      // Save widget to widgets collection
      await setDoc(doc(db, "widgets", widgetId), widgetDoc);

      // Add widget ID to user profile
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          widgets: arrayUnion(widgetId),
        });
        this.log("Widget ID added to user profile", { widgetId });
      }

      return { success: true, widgetId };
    } catch (error) {
      this.error("Failed to save widget to database", error);
      return { success: false, error: error.message };
    }
  }

  // Create progress container
  createProgressContainer(uploadId) {
    const container = document.createElement("div");
    container.id = `progress-${uploadId}`;
    container.className = "upload-progress-container";
    container.innerHTML = `
      <div class="upload-progress">
        <div class="progress-header">
          <h3>Uploading Widget</h3>
          <button class="close-progress">×</button>
        </div>
        <div class="progress-content">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">
            <span class="file-info">Preparing upload...</span>
            <span class="progress-percentage">0%</span>
          </div>
        </div>
      </div>
    `;

    // Add close functionality
    const closeBtn = container.querySelector(".close-progress");
    closeBtn.addEventListener("click", () => {
      container.remove();
    });

    return container;
  }

  // Update progress UI
  updateProgress(container, data) {
    const progressFill = container.querySelector(".progress-fill");
    const fileInfo = container.querySelector(".file-info");
    const progressPercentage = container.querySelector(".progress-percentage");

    progressFill.style.width = `${data.progress}%`;
    fileInfo.textContent = `Uploading ${data.fileName} (${data.current}/${data.total})`;
    progressPercentage.textContent = `${Math.round(data.progress)}%`;
  }

  // Update widget slot
  updateWidgetSlot(slot, widgetData) {
    const slotElement = document.querySelector(
      `.widget-slot[data-slot="${slot}"]`
    );
    if (!slotElement) return;

    // Update slot status
    const statusElement = slotElement.querySelector(".slot-status");
    if (statusElement) {
      statusElement.textContent = "Widget Uploaded";
      statusElement.className = "slot-status uploaded";
    }

    // Update slot content
    const contentElement = slotElement.querySelector(".widget-slot-content");
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="widget-preview">
          <h4>${widgetData.title}</h4>
          <p>${widgetData.description}</p>
          <div class="widget-actions">
            <button class="preview-widget-btn" data-widget-id="${widgetData.id}">Preview</button>
            <button class="edit-widget-btn" data-widget-id="${widgetData.id}">Edit</button>
            <button class="delete-widget-btn" data-widget-id="${widgetData.id}">Delete</button>
          </div>
        </div>
      `;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // File input change handlers
    const fileInputs = document.querySelectorAll(".widget-file-input");
    fileInputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        const uploadArea = input.closest(".widget-upload-area");

        // Prevent processing if no files selected
        if (files.length === 0) {
          return;
        }

        this.log("File input change detected", { fileCount: files.length });
        this.handleFiles(files, uploadArea);
      });
    });

    // Upload button handlers
    const uploadButtons = document.querySelectorAll(".upload-widget-btn");
    uploadButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const slot = btn.dataset.slot;
        const fileInput = document.querySelector(
          `.widget-file-input[data-slot="${slot}"]`
        );

        if (fileInput.files.length > 0) {
          this.handleFiles(
            Array.from(fileInput.files),
            fileInput.closest(".widget-upload-area")
          );
        } else {
          this.showError("Please select files to upload.");
        }
      });
    });
  }

  // Show success message
  showSuccess(message) {
    this.showToast(message, "success");
  }

  // Show error message
  showError(message) {
    this.showToast(message, "error");
  }

  // Show toast notification
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    const container =
      document.getElementById("toast-container") || document.body;
    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);

    // Manual close
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      toast.remove();
    });
  }
}

// Initialize the widget upload system
const widgetUpload = new WidgetUploadManager();

document.addEventListener("DOMContentLoaded", () => {
  widgetUpload.init();
});

export { WidgetUploadManager };
