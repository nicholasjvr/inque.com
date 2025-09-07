import { auth } from "../../core/firebase-core.js";
class WidgetPreviewManager {
  constructor() {
    this.previewContainer = null;
    this.currentFiles = new Map();
    this.log("Widget Preview Manager initialized");
  }

  log(message, data = null) {
    console.log(`[WIDGET PREVIEW] ${message}`, data || "");
  }

  error(message, error = null) {
    console.error(`[WIDGET PREVIEW ERROR] ${message}`, error || "");
  }

  async init() {
    try {
      this.log("Initializing widget preview system");
      this.setupPreviewContainer();
      this.setupEventListeners();
      return true;
    } catch (error) {
      this.error("Failed to initialize widget preview system", error);
      return false;
    }
  }

  setupPreviewContainer() {
    // Create preview container if it doesn't exist
    this.previewContainer = document.getElementById("widgetPreviewContainer");
    if (!this.previewContainer) {
      this.previewContainer = document.createElement("div");
      this.previewContainer.id = "widgetPreviewContainer";
      this.previewContainer.className = "widget-preview-container";
      this.previewContainer.innerHTML = `
        <div class="preview-header">
          <h3>File Preview</h3>
          <button class="preview-close-btn" id="previewCloseBtn">&times;</button>
        </div>
        <div class="preview-content" id="previewContent">
          <div class="preview-placeholder">
            <span class="preview-icon">👁️</span>
            <p>Select files to preview your widget</p>
          </div>
        </div>
      `;

      // Add to the page
      document.body.appendChild(this.previewContainer);
    }
  }

  setupEventListeners() {
    // Close button
    const closeBtn = document.getElementById("previewCloseBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.hidePreview();
      });
    }

    // Close on outside click
    this.previewContainer.addEventListener("click", (e) => {
      if (e.target === this.previewContainer) {
        this.hidePreview();
      }
    });
  }

  showPreview() {
    if (this.previewContainer) {
      this.previewContainer.style.display = "block";
      this.log("Preview shown");
    }
  }

  hidePreview() {
    if (this.previewContainer) {
      this.previewContainer.style.display = "none";
      this.clearPreview();
      this.log("Preview hidden");
    }
  }

  clearPreview() {
    const content = document.getElementById("previewContent");
    if (content) {
      content.innerHTML = `
        <div class="preview-placeholder">
          <span class="preview-icon">👁️</span>
          <p>Select files to preview your widget</p>
        </div>
      `;
    }
    this.currentFiles.clear();
  }

  async handleFiles(files) {
    try {
      this.log("Handling files for preview", { count: files.length });

      const fileArray = Array.from(files);
      this.currentFiles.clear();

      // Store files for later use
      fileArray.forEach((file) => {
        this.currentFiles.set(file.name, file);
      });

      // Detect if it's a project upload (HTML + assets)
      const htmlFiles = fileArray.filter((f) => f.name.match(/\.html?$/i));

      if (htmlFiles.length > 0) {
        await this.showProjectPreview(fileArray, htmlFiles[0]);
      } else {
        // Single file previews
        for (const file of fileArray) {
          await this.showFilePreview(file);
        }
      }

      this.showPreview();
    } catch (error) {
      this.error("Error handling files for preview", error);
      this.showError("Failed to preview files: " + error.message);
    }
  }

  async showFilePreview(file) {
    const content = document.getElementById("previewContent");
    if (!content) return;

    const url = URL.createObjectURL(file);
    let element;

    try {
      if (file.type.startsWith("image/")) {
        element = document.createElement("img");
        element.src = url;
        element.className = "preview-image";
        element.alt = file.name;
      } else if (file.type.startsWith("audio/")) {
        element = document.createElement("audio");
        element.controls = true;
        element.src = url;
        element.className = "preview-audio";
      } else if (file.type.startsWith("video/")) {
        element = document.createElement("video");
        element.controls = true;
        element.src = url;
        element.className = "preview-video";
      } else if (file.name.match(/\.html?$/i)) {
        element = document.createElement("iframe");
        element.src = url;
        element.className = "preview-iframe";
        element.sandbox = "allow-scripts allow-same-origin";
      } else if (file.name.match(/\.(js|css|json|txt)$/i)) {
        // Show code with syntax highlighting
        const text = await this.readFileAsText(file);
        element = this.createCodePreview(text, file.name);
      } else {
        element = document.createElement("div");
        element.className = "preview-unsupported";
        element.innerHTML = `
          <span class="file-icon">📄</span>
          <p>${file.name}</p>
          <small>File type not supported for preview</small>
        `;
      }

      // Add file info
      const fileInfo = document.createElement("div");
      fileInfo.className = "file-info";
      fileInfo.innerHTML = `
        <span class="file-name">${file.name}</span>
        <span class="file-size">${this.formatFileSize(file.size)}</span>
      `;

      const container = document.createElement("div");
      container.className = "preview-item";
      container.appendChild(fileInfo);
      container.appendChild(element);

      content.appendChild(container);
    } catch (error) {
      this.error("Error creating preview for file", {
        fileName: file.name,
        error,
      });
    }
  }

  async showProjectPreview(files, htmlFile) {
    const content = document.getElementById("previewContent");
    if (!content) return;

    try {
      const fileMap = {};
      files.forEach((f) => (fileMap[f.name] = f));

      const htmlText = await this.readFileAsText(htmlFile);
      let processedHtml = htmlText;

      // Inline CSS files
      processedHtml = processedHtml.replace(
        /<link[^>]+href="([^"]+\.css)"[^>]*>/gi,
        async (match, cssFile) => {
          if (fileMap[cssFile]) {
            const cssText = await this.readFileAsText(fileMap[cssFile]);
            return `<style>${cssText}</style>`;
          }
          return match;
        }
      );

      // Inline JS files
      processedHtml = processedHtml.replace(
        /<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/gi,
        async (match, jsFile) => {
          if (fileMap[jsFile]) {
            const jsText = await this.readFileAsText(fileMap[jsFile]);
            return `<script>${jsText}</script>`;
          }
          return match;
        }
      );

      // Create blob and iframe
      const blob = new Blob([processedHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.className = "preview-iframe project-preview";
      iframe.sandbox = "allow-scripts allow-same-origin allow-forms";
      iframe.title = "Widget Preview";

      // Add project info
      const projectInfo = document.createElement("div");
      projectInfo.className = "project-info";
      projectInfo.innerHTML = `
        <h4>Project Preview</h4>
        <p>${files.length} files loaded</p>
        <ul class="file-list">
          ${files
            .map((f) => `<li>${f.name} (${this.formatFileSize(f.size)})</li>`)
            .join("")}
        </ul>
      `;

      const container = document.createElement("div");
      container.className = "preview-item project-preview-item";
      container.appendChild(projectInfo);
      container.appendChild(iframe);

      content.appendChild(container);
    } catch (error) {
      this.error("Error creating project preview", error);
      this.showError("Failed to preview project: " + error.message);
    }
  }

  createCodePreview(text, fileName) {
    const container = document.createElement("div");
    container.className = "code-preview";

    const header = document.createElement("div");
    header.className = "code-header";
    header.innerHTML = `
      <span class="file-name">${fileName}</span>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${text.replace(
        /`/g,
        "\\`"
      )}\`)">📋 Copy</button>
    `;

    const pre = document.createElement("pre");
    pre.className = "code-content";
    pre.textContent = text;

    container.appendChild(header);
    container.appendChild(pre);

    return container;
  }

  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  showError(message) {
    const content = document.getElementById("previewContent");
    if (content) {
      content.innerHTML = `
        <div class="preview-error">
          <span class="error-icon">❌</span>
          <p>${message}</p>
        </div>
      `;
    }
  }

  // Get current files for upload
  getCurrentFiles() {
    return Array.from(this.currentFiles.values());
  }

  // Clear current files
  clearFiles() {
    this.currentFiles.clear();
    this.clearPreview();
  }
}

// Create and export singleton instance
const widgetPreviewManager = new WidgetPreviewManager();
export default widgetPreviewManager;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  widgetPreviewManager.init();
});

// Export for use in other modules
export { WidgetPreviewManager };
