// Cloud Upload Manager - Serverless File Upload Functions
// This module handles all file uploads through Firebase Cloud Functions

import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
import { auth } from "../../core/firebase-core.js";

class CloudUploadManager {
  constructor() {
    // Initialize with the correct region
    this.functions = getFunctions(undefined, "us-central1");
    this.log("Cloud Upload Manager initialized with region: us-central1");
  }

  log(message, data = null) {
    console.log(`[CLOUD UPLOAD] ${message}`, data || "");
  }

  error(message, error = null) {
    console.error(`[CLOUD UPLOAD ERROR] ${message}`, error || "");
  }

  // Convert File objects to base64 for Cloud Functions
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1]; // Remove data URL prefix
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Upload widget files using Cloud Functions
  async uploadWidgetFiles(files, slot, widgetData = {}) {
    try {
      this.log("Starting widget upload via Cloud Functions", {
        fileCount: files.length,
        slot: slot,
      });

      // Check authentication
      if (!auth.currentUser) {
        throw new Error("User must be authenticated to upload files");
      }

      // Convert files to base64
      const filePromises = Array.from(files).map((file) =>
        this.fileToBase64(file)
      );
      const base64Files = await Promise.all(filePromises);

      this.log("Files converted to base64", { count: base64Files.length });

      // Call Cloud Function
      const uploadWidgetFiles = httpsCallable(
        this.functions,
        "uploadWidgetFiles"
      );
      const result = await uploadWidgetFiles({
        files: base64Files,
        slot: slot,
        widgetData: widgetData,
      });

      this.log("Widget upload successful", result.data);
      return result.data;
    } catch (error) {
      this.error("Widget upload failed", error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Upload profile photo using Cloud Functions
  async uploadProfilePhoto(file) {
    try {
      this.log("Starting profile photo upload via Cloud Functions");

      // Check authentication
      if (!auth.currentUser) {
        throw new Error("User must be authenticated to upload profile photo");
      }

      // Convert file to base64
      const base64File = await this.fileToBase64(file);

      this.log("Profile photo converted to base64");

      // Call Cloud Function
      const uploadProfilePhoto = httpsCallable(
        this.functions,
        "uploadProfilePhoto"
      );
      const result = await uploadProfilePhoto({
        file: base64File,
      });

      this.log("Profile photo upload successful", result.data);
      return result.data;
    } catch (error) {
      this.error("Profile photo upload failed", error);
      throw new Error(`Profile photo upload failed: ${error.message}`);
    }
  }

  // Delete widget using Cloud Functions
  async deleteWidget(widgetId) {
    try {
      this.log("Starting widget deletion via Cloud Functions", { widgetId });

      // Check authentication
      if (!auth.currentUser) {
        throw new Error("User must be authenticated to delete widgets");
      }

      // Call Cloud Function
      const deleteWidget = httpsCallable(this.functions, "deleteWidget");
      const result = await deleteWidget({ widgetId });

      this.log("Widget deletion successful", result.data);
      return result.data;
    } catch (error) {
      this.error("Widget deletion failed", error);
      throw new Error(`Widget deletion failed: ${error.message}`);
    }
  }

  // Get widget download URLs using Cloud Functions
  async getWidgetDownloadUrls(widgetId) {
    try {
      this.log("Getting widget download URLs via Cloud Functions", {
        widgetId,
      });

      // Check authentication
      if (!auth.currentUser) {
        throw new Error("User must be authenticated to access widget URLs");
      }

      // Call Cloud Function
      const getWidgetDownloadUrls = httpsCallable(
        this.functions,
        "getWidgetDownloadUrls"
      );
      const result = await getWidgetDownloadUrls({ widgetId });

      this.log("Download URLs retrieved successfully", result.data);
      return result.data;
    } catch (error) {
      this.error("Failed to get download URLs", error);
      throw new Error(`Failed to get download URLs: ${error.message}`);
    }
  }

  // Reupload files for an existing widget (replace files, keep metadata)
  async reuploadWidgetFiles(widgetId, files) {
    try {
      this.log("Starting widget reupload via Cloud Functions", {
        widgetId,
        fileCount: files.length,
      });

      if (!auth.currentUser) {
        throw new Error("User must be authenticated to reupload files");
      }

      const filePromises = Array.from(files).map((file) =>
        this.fileToBase64(file)
      );
      const base64Files = await Promise.all(filePromises);

      const reupload = httpsCallable(this.functions, "reuploadWidgetFiles");
      const result = await reupload({ widgetId, files: base64Files });

      this.log("Widget reupload successful", result.data);
      return result.data;
    } catch (error) {
      this.error("Widget reupload failed", error);
      throw new Error(`Reupload failed: ${error.message}`);
    }
  }

  // Validate files before upload
  validateFiles(files) {
    const allowedTypes = [
      "text/html",
      "text/css",
      "application/javascript",
      "application/json",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/svg+xml",
      "text/javascript",
      "application/x-javascript",
    ];

    const allowedExtensions = [
      ".html",
      ".js",
      ".css",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".json",
    ];

    for (const file of files) {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (
        !allowedExtensions.includes(ext) ||
        (file.type && !allowedTypes.includes(file.type))
      ) {
        this.error("Invalid file type", {
          fileName: file.name,
          fileType: file.type,
        });
        return false;
      }
    }

    return true;
  }

  // Get upload progress (simulated for Cloud Functions)
  async uploadWithProgress(
    files,
    slot,
    widgetData = {},
    progressCallback = null
  ) {
    try {
      if (progressCallback) {
        progressCallback(0, "Preparing files...");
      }

      // Validate files
      if (!this.validateFiles(files)) {
        throw new Error("Invalid file types detected");
      }

      if (progressCallback) {
        progressCallback(25, "Converting files...");
      }

      // Convert files to base64
      const filePromises = Array.from(files).map((file) =>
        this.fileToBase64(file)
      );
      const base64Files = await Promise.all(filePromises);

      if (progressCallback) {
        progressCallback(50, "Uploading to server...");
      }

      // Upload via Cloud Functions
      const result = await this.uploadWidgetFiles(files, slot, widgetData);

      if (progressCallback) {
        progressCallback(100, "Upload complete!");
      }

      return result;
    } catch (error) {
      this.error("Upload with progress failed", error);
      throw error;
    }
  }
}

// Create and export singleton instance
const cloudUploadManager = new CloudUploadManager();

// Expose to window for testing
window.cloudUploadManager = cloudUploadManager;

export default cloudUploadManager;

// Export individual functions for backward compatibility
export const uploadWidgetFiles = (files, slot, widgetData) =>
  cloudUploadManager.uploadWidgetFiles(files, slot, widgetData);

export const uploadProfilePhoto = (file) =>
  cloudUploadManager.uploadProfilePhoto(file);

export const deleteWidget = (widgetId) =>
  cloudUploadManager.deleteWidget(widgetId);

export const getWidgetDownloadUrls = (widgetId) =>
  cloudUploadManager.getWidgetDownloadUrls(widgetId);

export const validateFiles = (files) => cloudUploadManager.validateFiles(files);

export const uploadWithProgress = (files, slot, widgetData, progressCallback) =>
  cloudUploadManager.uploadWithProgress(
    files,
    slot,
    widgetData,
    progressCallback
  );

export const reuploadWidgetFiles = (widgetId, files) =>
  cloudUploadManager.reuploadWidgetFiles(widgetId, files);
