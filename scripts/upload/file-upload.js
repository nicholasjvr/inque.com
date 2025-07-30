// scripts/upload/file-upload.js
// Enhanced file upload system with proper file type detection and validation

import { storage, auth } from "../firebase/firebase-init.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

// File type definitions
const FILE_TYPES = {
  // Widget files (HTML, CSS, JS bundles)
  WIDGET: {
    extensions: [".html", ".css", ".js"],
    mimeTypes: ["text/html", "text/css", "application/javascript"],
    category: "widget",
    maxSize: 1024 * 1024 * 5, // 5MB
    storagePath: "widgets",
  },

  // Image files
  IMAGE: {
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".bmp"],
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webp",
      "image/bmp",
    ],
    category: "media",
    maxSize: 1024 * 1024 * 10, // 10MB
    storagePath: "media/images",
  },

  // Video files
  VIDEO: {
    extensions: [".mp4", ".webm", ".avi", ".mov", ".mkv", ".flv"],
    mimeTypes: [
      "video/mp4",
      "video/webm",
      "video/avi",
      "video/quicktime",
      "video/x-matroska",
      "video/x-flv",
    ],
    category: "media",
    maxSize: 1024 * 1024 * 100, // 100MB
    storagePath: "media/videos",
  },

  // Audio files
  AUDIO: {
    extensions: [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a"],
    mimeTypes: [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/aac",
      "audio/flac",
      "audio/mp4",
    ],
    category: "media",
    maxSize: 1024 * 1024 * 50, // 50MB
    storagePath: "media/audio",
  },

  // Document files
  DOCUMENT: {
    extensions: [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt"],
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
      "application/vnd.oasis.opendocument.text",
    ],
    category: "document",
    maxSize: 1024 * 1024 * 25, // 25MB
    storagePath: "documents",
  },
};

class FileUploadManager {
  constructor() {
    this.user = null;
    this.currentUploads = new Map();
  }

  // Initialize with current user
  init() {
    this.user = auth.currentUser;
    if (!this.user) {
      throw new Error("User not authenticated");
    }
  }

  // Detect file type based on extension and MIME type
  detectFileType(file) {
    const extension = "." + file.name.split(".").pop().toLowerCase();
    const mimeType = file.type.toLowerCase();

    for (const [type, config] of Object.entries(FILE_TYPES)) {
      if (
        config.extensions.includes(extension) ||
        config.mimeTypes.includes(mimeType)
      ) {
        return {
          type: type,
          category: config.category,
          config: config,
        };
      }
    }

    return {
      type: "UNKNOWN",
      category: "other",
      config: {
        extensions: [],
        mimeTypes: [],
        category: "other",
        maxSize: 1024 * 1024 * 1, // 1MB default
        storagePath: "other",
      },
    };
  }

  // Validate file
  validateFile(file) {
    const fileType = this.detectFileType(file);

    // Check file size
    if (file.size > fileType.config.maxSize) {
      throw new Error(
        `File too large. Maximum size for ${
          fileType.type
        } files is ${this.formatFileSize(fileType.config.maxSize)}`
      );
    }

    // Check if file type is supported
    if (fileType.type === "UNKNOWN") {
      throw new Error(`Unsupported file type: ${file.name}`);
    }

    return fileType;
  }

  // Upload single file
  async uploadFile(file, customPath = null) {
    if (!this.user) {
      this.init();
    }

    const fileType = this.validateFile(file);
    const uploadId = this.generateUploadId();

    try {
      // Determine storage path
      const storagePath =
        customPath ||
        `users/${this.user.uid}/${fileType.config.storagePath}/${file.name}`;

      const storageRef = ref(storage, storagePath);

      // Track upload progress
      this.currentUploads.set(uploadId, {
        file: file,
        progress: 0,
        status: "uploading",
      });

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update upload status
      this.currentUploads.set(uploadId, {
        file: file,
        progress: 100,
        status: "completed",
        downloadURL: downloadURL,
        metadata: {
          name: file.name,
          size: file.size,
          type: fileType.type,
          category: fileType.category,
          path: storagePath,
        },
      });

      console.log(`File ${file.name} uploaded successfully:`, downloadURL);

      return {
        uploadId: uploadId,
        downloadURL: downloadURL,
        metadata: {
          name: file.name,
          size: file.size,
          type: fileType.type,
          category: fileType.category,
          path: storagePath,
        },
      };
    } catch (error) {
      // Update upload status
      this.currentUploads.set(uploadId, {
        file: file,
        progress: 0,
        status: "failed",
        error: error.message,
      });

      console.error(`Upload failed for ${file.name}:`, error);
      throw error;
    }
  }

  // Upload widget bundle (HTML, CSS, JS files)
  async uploadWidgetBundle(files, slotNumber) {
    if (!this.user) {
      this.init();
    }

    // Validate slot number
    if (![1, 2, 3].includes(Number(slotNumber))) {
      throw new Error("Invalid slot number. Must be 1, 2, or 3");
    }

    // Validate files
    const widgetFiles = [];
    const otherFiles = [];

    for (const file of files) {
      const fileType = this.detectFileType(file);
      if (fileType.category === "widget") {
        widgetFiles.push(file);
      } else {
        otherFiles.push(file);
      }
    }

    if (widgetFiles.length === 0) {
      throw new Error(
        "No widget files found. Please include at least one HTML, CSS, or JS file."
      );
    }

    const uploadResults = [];
    const errors = [];

    // Upload widget files
    for (const file of widgetFiles) {
      try {
        const storagePath = `users/${this.user.uid}/widgets/slot-${slotNumber}/${file.name}`;
        const result = await this.uploadFile(file, storagePath);
        uploadResults.push(result);
      } catch (error) {
        errors.push(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    // Upload other files (images, etc.)
    for (const file of otherFiles) {
      try {
        const result = await this.uploadFile(file);
        uploadResults.push(result);
      } catch (error) {
        errors.push(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn("Some files failed to upload:", errors);
    }

    return {
      success: uploadResults,
      errors: errors,
      slotNumber: slotNumber,
    };
  }

  // Upload media files
  async uploadMediaFiles(files, mediaType = null) {
    if (!this.user) {
      this.init();
    }

    const uploadResults = [];
    const errors = [];

    for (const file of files) {
      try {
        const fileType = this.detectFileType(file);

        // If mediaType is specified, validate it matches
        if (mediaType && fileType.type !== mediaType.toUpperCase()) {
          throw new Error(`Expected ${mediaType} file, got ${fileType.type}`);
        }

        const result = await this.uploadFile(file);
        uploadResults.push(result);
      } catch (error) {
        errors.push(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    return {
      success: uploadResults,
      errors: errors,
    };
  }

  // Get upload progress
  getUploadProgress(uploadId) {
    return this.currentUploads.get(uploadId);
  }

  // Get all current uploads
  getAllUploads() {
    return Array.from(this.currentUploads.entries());
  }

  // Clear completed uploads
  clearCompletedUploads() {
    for (const [uploadId, upload] of this.currentUploads.entries()) {
      if (upload.status === "completed" || upload.status === "failed") {
        this.currentUploads.delete(uploadId);
      }
    }
  }

  // Generate unique upload ID
  generateUploadId() {
    return (
      "upload_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Get supported file types
  getSupportedFileTypes() {
    return FILE_TYPES;
  }

  // Check if file type is supported
  isFileTypeSupported(file) {
    const fileType = this.detectFileType(file);
    return fileType.type !== "UNKNOWN";
  }
}

// Export for use in other modules
export default FileUploadManager;

// Create global instance
window.fileUploadManager = new FileUploadManager();
