// Widget Upload Manager - Updated to use Cloud Functions
// This module now uses serverless functions for better performance and reliability

import cloudUploadManager from "../../../../scripts/upload/cloud-upload.js";
import widgetPreviewManager from "./widget-preview.js";
import CSSAnalyzer from "../../../../scripts/ai-agents/css-analyzer.js";

class WidgetUploadManager {
  constructor() {
    this.uploadingSlots = new Set(); // Track active uploads per slot
    this.cssAnalyzer = null; // CSS analysis - only for premium users
    this.isPremium = false; // Track premium status
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

      // Check if user is premium for CSS analysis
      await this.checkPremiumStatus();

      this.log("Widget upload system initialized");
      this.setupEventListeners();
      return true;
    } catch (error) {
      this.error("Failed to initialize widget upload system", error);
      return false;
    }
  }

  async checkPremiumStatus() {
    try {
      // Check if user has premium features enabled
      // This could check localStorage, user profile, or API
      const userProfile = window.userProfile || {};
      this.isPremium = userProfile.isPremium || userProfile.level >= 3 || false;

      if (this.isPremium) {
        this.log("Premium user detected - CSS analysis enabled");
        this.cssAnalyzer = new CSSAnalyzer();
      } else {
        this.log("Standard user - CSS analysis disabled (premium feature)");
      }
    } catch (error) {
      this.log(
        "Could not determine premium status - defaulting to standard",
        error
      );
      this.isPremium = false;
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

  async handleFileInputChange(fileInput) {
    const files = fileInput.files;
    if (files.length > 0) {
      this.log("Files selected", { count: files.length });
      this.updateFileList(fileInput, files);

      // Analyze CSS dependencies and issues (premium feature only)
      if (this.isPremium && this.cssAnalyzer) {
        await this.analyzeWidgetFiles(files, fileInput);
      } else {
        this.log("Skipping CSS analysis - premium feature");
        this.showPremiumNotice(fileInput);
      }

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
          <span class="file-type ${this.getFileTypeClass(file.name)}">${this.getFileTypeLabel(file.name)}</span>
        `;
        fileList.appendChild(fileItem);
      });

      // Add CSS analysis indicator if CSS files are present
      this.addCSSAnalysisIndicator(uploadArea, files);
    }
  }

  getFileTypeClass(fileName) {
    if (fileName.match(/\.css$/i)) return "css-file";
    if (fileName.match(/\.html?$/i)) return "html-file";
    if (fileName.match(/\.js$/i)) return "js-file";
    if (fileName.match(/\.(png|jpg|jpeg|gif|svg)$/i)) return "image-file";
    return "other-file";
  }

  getFileTypeLabel(fileName) {
    if (fileName.match(/\.css$/i)) return "CSS";
    if (fileName.match(/\.html?$/i)) return "HTML";
    if (fileName.match(/\.js$/i)) return "JS";
    if (fileName.match(/\.(png|jpg|jpeg|gif|svg)$/i)) return "IMG";
    return "FILE";
  }

  addCSSAnalysisIndicator(uploadArea, files) {
    const cssFiles = Array.from(files).filter((f) => f.name.match(/\.css$/i));
    const htmlFiles = Array.from(files).filter((f) =>
      f.name.match(/\.html?$/i)
    );

    if (cssFiles.length > 0 || htmlFiles.length > 0) {
      let analysisIndicator = uploadArea.querySelector(
        ".css-analysis-indicator"
      );
      if (!analysisIndicator) {
        analysisIndicator = document.createElement("div");
        analysisIndicator.className = "css-analysis-indicator";

        if (this.isPremium) {
          analysisIndicator.innerHTML = `
            <div class="analysis-status" id="analysisStatus">
              <span class="analysis-icon">🔍</span>
              <span class="analysis-text">Analyzing CSS...</span>
            </div>
            <div class="analysis-results" id="analysisResults" style="display: none;">
              <div class="css-issues" id="cssIssues"></div>
              <div class="css-recommendations" id="cssRecommendations"></div>
            </div>
          `;
        } else {
          analysisIndicator.innerHTML = `
            <div class="premium-notice">
              <span class="premium-icon">⭐</span>
              <span class="premium-text">CSS Analysis - Premium Feature</span>
              <button class="upgrade-btn" onclick="this.showUpgradeModal()">Upgrade</button>
            </div>
          `;
        }
        uploadArea.appendChild(analysisIndicator);
      }
    }
  }

  showPremiumNotice(fileInput) {
    const uploadArea = fileInput.closest(".widget-upload-area");
    const cssFiles = Array.from(fileInput.files).filter((f) =>
      f.name.match(/\.css$/i)
    );

    if (cssFiles.length > 0) {
      this.addCSSAnalysisIndicator(uploadArea, fileInput.files);
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

      // Process CSS files for optimization (premium feature only)
      let filesToUpload = fileInput.files;
      let cssProcessingResult = {
        processedFiles: filesToUpload,
        issues: [],
        recommendations: [],
      };

      if (this.isPremium && this.cssAnalyzer) {
        cssProcessingResult = await this.processCSSForUpload(filesToUpload);

        // Show CSS processing feedback
        if (cssProcessingResult.issues.length > 0) {
          const highPriorityIssues = cssProcessingResult.issues.filter(
            (i) => i.severity === "high"
          ).length;
          if (highPriorityIssues > 0) {
            this.showToast(
              `CSS processing found ${highPriorityIssues} issues. Consider reviewing before upload.`,
              "warning"
            );
          }
        }

        // Use processed files for upload
        if (cssProcessingResult.processedFiles.length > 0) {
          filesToUpload = cssProcessingResult.processedFiles;
        }
      } else {
        this.log("Skipping CSS processing - premium feature");
      }

      // Use Cloud Functions for upload
      const result = await cloudUploadManager.uploadWithProgress(
        filesToUpload,
        slot,
        {
          title,
          description: desc,
          cssAnalysis: cssProcessingResult,
          originalFileCount: fileInput.files.length,
        },
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

  async analyzeWidgetFiles(files, fileInput) {
    try {
      const uploadArea = fileInput.closest(".widget-upload-area");
      const analysisStatus = uploadArea.querySelector("#analysisStatus");
      const analysisResults = uploadArea.querySelector("#analysisResults");

      if (analysisStatus) {
        analysisStatus.style.display = "block";
        analysisResults.style.display = "none";
      }

      // Find HTML file for analysis
      const htmlFiles = Array.from(files).filter((f) =>
        f.name.match(/\.html?$/i)
      );
      const htmlFile = htmlFiles.length > 0 ? htmlFiles[0] : null;

      // Analyze CSS dependencies and issues
      const analysis = await this.cssAnalyzer.analyzeWidgetFiles(
        files,
        htmlFile
      );

      // Display results
      this.displayCSSAnalysisResults(analysis, uploadArea);

      // Show toast with summary
      const highPriorityIssues = analysis.issues.filter(
        (i) => i.severity === "high"
      ).length;
      const mediumPriorityIssues = analysis.issues.filter(
        (i) => i.severity === "medium"
      ).length;

      if (highPriorityIssues > 0) {
        this.showToast(
          `Found ${highPriorityIssues} high-priority CSS issues. Please review before uploading.`,
          "warning"
        );
      } else if (mediumPriorityIssues > 0) {
        this.showToast(
          `Found ${mediumPriorityIssues} CSS issues. Consider reviewing for optimal styling.`,
          "info"
        );
      } else {
        this.showToast(
          "CSS analysis complete! Your styles look good.",
          "success"
        );
      }
    } catch (error) {
      this.error("CSS analysis failed", error);
      this.showToast(
        "CSS analysis failed. Upload will still work but optimization may be limited.",
        "warning"
      );
    }
  }

  displayCSSAnalysisResults(analysis, uploadArea) {
    const analysisStatus = uploadArea.querySelector("#analysisStatus");
    const analysisResults = uploadArea.querySelector("#analysisResults");
    const cssIssues = uploadArea.querySelector("#cssIssues");
    const cssRecommendations = uploadArea.querySelector("#cssRecommendations");

    // Hide status, show results
    if (analysisStatus) analysisStatus.style.display = "none";
    if (analysisResults) analysisResults.style.display = "block";

    // Display issues
    if (cssIssues) {
      if (analysis.issues.length > 0) {
        cssIssues.innerHTML = `
          <h4>CSS Issues (${analysis.issues.length})</h4>
          ${analysis.issues
            .map(
              (issue) => `
            <div class="css-issue ${issue.severity}">
              <span class="issue-severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
              <span class="issue-message">${issue.message}</span>
              ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ""}
            </div>
          `
            )
            .join("")}
        `;
      } else {
        cssIssues.innerHTML = `
          <h4>CSS Issues</h4>
          <div class="css-issue-success">✅ No CSS issues found!</div>
        `;
      }
    }

    // Display recommendations
    if (cssRecommendations) {
      if (analysis.recommendations.length > 0) {
        cssRecommendations.innerHTML = `
          <h4>Recommendations</h4>
          ${analysis.recommendations
            .map(
              (rec) => `
            <div class="css-recommendation ${rec.priority}">
              <span class="rec-priority ${rec.priority}">${rec.priority.toUpperCase()}</span>
              <span class="rec-message">${rec.message}</span>
              ${rec.details ? `<div class="rec-details">${rec.details}</div>` : ""}
            </div>
          `
            )
            .join("")}
        `;
      } else {
        cssRecommendations.innerHTML = `
          <h4>Recommendations</h4>
          <div class="css-recommendation-success">✨ Your CSS is well-optimized!</div>
        `;
      }
    }

    // Add expand/collapse functionality
    this.addAnalysisToggleFunctionality(uploadArea);
  }

  addAnalysisToggleFunctionality(uploadArea) {
    const analysisResults = uploadArea.querySelector("#analysisResults");
    const analysisStatus = uploadArea.querySelector("#analysisStatus");

    if (analysisResults && analysisStatus) {
      // Make status clickable to show/hide results
      analysisStatus.style.cursor = "pointer";
      analysisStatus.title = "Click to view CSS analysis results";

      let isExpanded = false;

      analysisStatus.addEventListener("click", () => {
        isExpanded = !isExpanded;

        if (isExpanded) {
          analysisResults.style.display = "block";
          analysisStatus.innerHTML = `
            <span class="analysis-icon">📊</span>
            <span class="analysis-text">Hide Analysis</span>
          `;
        } else {
          analysisResults.style.display = "none";
          analysisStatus.innerHTML = `
            <span class="analysis-icon">🔍</span>
            <span class="analysis-text">Show Analysis</span>
          `;
        }
      });
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

  async processCSSForUpload(files) {
    try {
      this.log("Processing CSS files for upload", { fileCount: files.length });

      // Use CSS analyzer to process files
      const result = await this.cssAnalyzer.processCSSForUpload(files, {
        inlineCSS: false, // Keep CSS files separate for now
        optimize: true,
      });

      this.log("CSS processing completed", {
        originalFiles: files.length,
        processedFiles: result.processedFiles.length,
      });

      return result;
    } catch (error) {
      this.error("CSS processing failed", error);
      return {
        processedFiles: files, // Fallback to original files
        inlinedCSS: "",
        issues: [],
        recommendations: [],
      };
    }
  }

  // Handle widget upload from other modules (for backward compatibility)
  async handleWidgetUpload(widgetData) {
    try {
      this.log("Handling widget upload from auth module", {
        title: widgetData.title,
      });

      // Process CSS if files are provided
      let filesToUpload = widgetData.files;
      if (filesToUpload) {
        const cssProcessingResult =
          await this.processCSSForUpload(filesToUpload);
        if (cssProcessingResult.processedFiles.length > 0) {
          filesToUpload = cssProcessingResult.processedFiles;
        }
      }

      // Use Cloud Functions for upload
      const result = await cloudUploadManager.uploadWidgetFiles(
        filesToUpload,
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
