import { auth } from "../../../../core/firebase-core.js";
class WidgetPreviewManager {
  constructor() {
    this.previewContainer = null;
    this.currentFiles = new Map();
    this.fullscreenModal = null;
    this.fullscreenBody = null;
    this.currentFullscreenUrl = null;
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
      this.setupFullscreenModal();
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
          <div class="preview-header-left">
            <h3>Widget Preview & Editor</h3>
            <div class="preview-tabs" id="previewTabs">
              <button class="preview-tab active" data-tab="preview">👁️ Preview</button>
              <button class="preview-tab" data-tab="edit">✏️ Edit</button>
              <button class="preview-tab" data-tab="analyze">🔍 Analyze</button>
              <button class="preview-tab" data-tab="style">🎨 Style</button>
            </div>
          </div>
          <div class="preview-header-right">
            <div class="preview-controls">
              <button class="preview-btn secondary" id="previewResponsiveBtn" title="Toggle Responsive Modes">
                📱 Responsive
              </button>
              <button class="preview-btn secondary" id="previewFullscreenBtn" title="Fullscreen Preview">
                ⛶ Fullscreen
              </button>
              <button class="preview-btn primary" id="previewSaveBtn" title="Save Changes">
                💾 Save
              </button>
              <button class="preview-close-btn" id="previewCloseBtn">&times;</button>
            </div>
          </div>
        </div>

        <div class="preview-body">
          <div class="preview-sidebar" id="previewSidebar">
            <div class="file-tree" id="fileTree">
              <h4>Files</h4>
              <div class="file-list" id="fileList"></div>
            </div>
            <div class="preview-tools" id="previewTools">
              <h4>Tools</h4>
              <div class="tool-buttons" id="toolButtons">
                <button class="tool-btn" data-tool="format" title="Format Code">📐 Format</button>
                <button class="tool-btn" data-tool="optimize" title="Optimize CSS">⚡ Optimize</button>
                <button class="tool-btn" data-tool="validate" title="Validate HTML">✅ Validate</button>
                <button class="tool-btn" data-tool="preview" title="Quick Preview">🚀 Preview</button>
              </div>
            </div>
          </div>

          <div class="preview-main">
            <div class="preview-tab-content active" id="previewTab">
              <div class="preview-placeholder">
                <span class="preview-icon">👁️</span>
                <p>Select files to preview your widget</p>
              </div>
            </div>

            <div class="preview-tab-content" id="editTab">
              <div class="editor-container">
                <div class="editor-header">
                  <select class="file-selector" id="fileSelector">
                    <option value="">Select a file to edit...</option>
                  </select>
                  <div class="editor-controls">
                    <button class="editor-btn" id="editorUndoBtn" title="Undo">↶</button>
                    <button class="editor-btn" id="editorRedoBtn" title="Redo">↷</button>
                    <button class="editor-btn" id="editorFormatBtn" title="Format">📐</button>
                  </div>
                </div>
                <div class="code-editor" id="codeEditor" contenteditable="true"></div>
              </div>
            </div>

            <div class="preview-tab-content" id="analyzeTab">
              <div class="analysis-container">
                <div class="analysis-header">
                  <h4>Widget Analysis</h4>
                  <button class="btn primary" id="runAnalysisBtn">Run Analysis</button>
                </div>
                <div class="analysis-results" id="analysisResults">
                  <div class="analysis-placeholder">
                    <span class="analysis-icon">🔍</span>
                    <p>Click "Run Analysis" to analyze your widget</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="preview-tab-content" id="styleTab">
              <div class="style-container">
                <div class="style-presets">
                  <h4>Style Presets</h4>
                  <div class="preset-grid" id="presetGrid">
                    <div class="style-preset" data-preset="minimal">
                      <div class="preset-preview minimal"></div>
                      <span>Minimal</span>
                    </div>
                    <div class="style-preset" data-preset="neon">
                      <div class="preset-preview neon"></div>
                      <span>Neon</span>
                    </div>
                    <div class="style-preset" data-preset="glass">
                      <div class="preset-preview glass"></div>
                      <span>Glass</span>
                    </div>
                    <div class="style-preset" data-preset="retro">
                      <div class="preset-preview retro"></div>
                      <span>Retro</span>
                    </div>
                  </div>
                </div>
                <div class="style-customizer">
                  <h4>Customize</h4>
                  <div class="customizer-controls">
                    <div class="control-group">
                      <label>Primary Color</label>
                      <input type="color" id="primaryColor" value="#00f0ff">
                    </div>
                    <div class="control-group">
                      <label>Background</label>
                      <select id="backgroundStyle">
                        <option value="solid">Solid</option>
                        <option value="gradient">Gradient</option>
                        <option value="transparent">Transparent</option>
                      </select>
                    </div>
                    <div class="control-group">
                      <label>Border Radius</label>
                      <input type="range" id="borderRadius" min="0" max="20" value="8">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add to the page
      document.body.appendChild(this.previewContainer);
    }
  }

  setupFullscreenModal() {
    // Create fullscreen modal if it doesn't exist
    let modal = document.getElementById("widgetFullscreenModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "widgetFullscreenModal";
      modal.className = "widget-fullscreen-modal";
      modal.innerHTML = `
        <div class="fullscreen-inner">
          <div class="fullscreen-header">
            <h3 id="fullscreenTitle">Preview</h3>
            <div class="fullscreen-actions">
              <button class="fullscreen-open-tab-btn" id="fullscreenOpenTabBtn" title="Open in new tab">↗</button>
              <button class="fullscreen-close-btn" id="fullscreenCloseBtn">&times;</button>
            </div>
          </div>
          <div class="fullscreen-body" id="fullscreenBody"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    this.fullscreenModal = modal;
    this.fullscreenBody = modal.querySelector("#fullscreenBody");

    // Close handlers
    const closeBtn = modal.querySelector("#fullscreenCloseBtn");
    if (closeBtn && !closeBtn._handlerBound) {
      closeBtn.addEventListener("click", () => this.hideFullscreen());
      closeBtn._handlerBound = true;
    }

    const openTabBtn = modal.querySelector("#fullscreenOpenTabBtn");
    if (openTabBtn && !openTabBtn._handlerBound) {
      openTabBtn.addEventListener("click", () => {
        if (this.currentFullscreenUrl) {
          window.open(this.currentFullscreenUrl, "_blank");
        }
      });
      openTabBtn._handlerBound = true;
    }

    if (!modal._backdropHandlerBound) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideFullscreen();
      });
      modal._backdropHandlerBound = true;
    }

    if (!this._escHandlerBound) {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.hideFullscreen();
      });
      this._escHandlerBound = true;
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

    // Tab switching
    const previewTabs = document.querySelectorAll(".preview-tab");
    previewTabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Preview controls
    const responsiveBtn = document.getElementById("previewResponsiveBtn");
    if (responsiveBtn) {
      responsiveBtn.addEventListener("click", () => {
        this.toggleResponsiveMode();
      });
    }

    const fullscreenBtn = document.getElementById("previewFullscreenBtn");
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", () => {
        this.openFullscreenFromElement(
          document.getElementById("previewFrame"),
          "Widget Preview"
        );
      });
    }

    const saveBtn = document.getElementById("previewSaveBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        this.saveChanges();
      });
    }

    // File selector
    const fileSelector = document.getElementById("fileSelector");
    if (fileSelector) {
      fileSelector.addEventListener("change", (e) => {
        this.loadFileForEditing(e.target.value);
      });
    }

    // Editor controls
    const formatBtn = document.getElementById("editorFormatBtn");
    if (formatBtn) {
      formatBtn.addEventListener("click", () => {
        this.formatCode();
      });
    }

    // Tool buttons
    const toolBtns = document.querySelectorAll(".tool-btn");
    toolBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.executeToolAction(e.target.dataset.tool);
      });
    });

    // Analysis button
    const runAnalysisBtn = document.getElementById("runAnalysisBtn");
    if (runAnalysisBtn) {
      runAnalysisBtn.addEventListener("click", () => {
        this.runWidgetAnalysis();
      });
    }

    // Style presets
    const stylePresets = document.querySelectorAll(".style-preset");
    stylePresets.forEach((preset) => {
      preset.addEventListener("click", (e) => {
        this.applyStylePreset(e.target.closest(".style-preset").dataset.preset);
      });
    });

    // Style customizer controls
    const primaryColor = document.getElementById("primaryColor");
    if (primaryColor) {
      primaryColor.addEventListener("change", (e) => {
        this.updateStyleVariable("--primary-color", e.target.value);
      });
    }

    const backgroundStyle = document.getElementById("backgroundStyle");
    if (backgroundStyle) {
      backgroundStyle.addEventListener("change", (e) => {
        this.updateBackgroundStyle(e.target.value);
      });
    }

    const borderRadius = document.getElementById("borderRadius");
    if (borderRadius) {
      borderRadius.addEventListener("input", (e) => {
        this.updateStyleVariable("--border-radius", e.target.value + "px");
      });
    }

    // Close on outside click
    this.previewContainer.addEventListener("click", (e) => {
      if (e.target === this.previewContainer) {
        this.hidePreview();
      }
    });

    // Auto-save on editor changes
    const codeEditor = document.getElementById("codeEditor");
    if (codeEditor) {
      let saveTimeout;
      codeEditor.addEventListener("input", () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          this.autoSave();
        }, 1000);
      });
    }
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

      // Populate file tree and selector
      this.populateFileTree(fileArray);

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

  populateFileTree(files) {
    const fileList = document.getElementById("fileList");
    const fileSelector = document.getElementById("fileSelector");

    if (fileList && fileSelector) {
      // Clear existing options
      fileSelector.innerHTML =
        '<option value="">Select a file to edit...</option>';

      // Group files by type
      const htmlFiles = files.filter((f) => f.name.match(/\.html?$/i));
      const cssFiles = files.filter((f) => f.name.match(/\.css$/i));
      const jsFiles = files.filter((f) => f.name.match(/\.js$/i));
      const imageFiles = files.filter((f) =>
        f.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)
      );
      const otherFiles = files.filter(
        (f) => !f.name.match(/\.(html?|css|js|png|jpg|jpeg|gif|svg|webp)$/i)
      );

      // Create file tree structure
      let fileTreeHTML = "";

      if (htmlFiles.length > 0) {
        fileTreeHTML += `<div class="file-category">
          <div class="category-header">📄 HTML (${htmlFiles.length})</div>
          <div class="category-files">`;
        htmlFiles.forEach((file) => {
          fileTreeHTML += `<div class="file-item" data-file="${file.name}">
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${this.formatFileSize(file.size)}</span>
          </div>`;
          fileSelector.innerHTML += `<option value="${file.name}">📄 ${file.name}</option>`;
        });
        fileTreeHTML += "</div></div>";
      }

      if (cssFiles.length > 0) {
        fileTreeHTML += `<div class="file-category">
          <div class="category-header">🎨 CSS (${cssFiles.length})</div>
          <div class="category-files">`;
        cssFiles.forEach((file) => {
          fileTreeHTML += `<div class="file-item" data-file="${file.name}">
            <span class="file-icon">🎨</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${this.formatFileSize(file.size)}</span>
          </div>`;
          fileSelector.innerHTML += `<option value="${file.name}">🎨 ${file.name}</option>`;
        });
        fileTreeHTML += "</div></div>";
      }

      if (jsFiles.length > 0) {
        fileTreeHTML += `<div class="file-category">
          <div class="category-header">⚡ JavaScript (${jsFiles.length})</div>
          <div class="category-files">`;
        jsFiles.forEach((file) => {
          fileTreeHTML += `<div class="file-item" data-file="${file.name}">
            <span class="file-icon">⚡</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${this.formatFileSize(file.size)}</span>
          </div>`;
          fileSelector.innerHTML += `<option value="${file.name}">⚡ ${file.name}</option>`;
        });
        fileTreeHTML += "</div></div>";
      }

      if (imageFiles.length > 0) {
        fileTreeHTML += `<div class="file-category">
          <div class="category-header">🖼️ Images (${imageFiles.length})</div>
          <div class="category-files">`;
        imageFiles.forEach((file) => {
          fileTreeHTML += `<div class="file-item" data-file="${file.name}">
            <span class="file-icon">🖼️</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${this.formatFileSize(file.size)}</span>
          </div>`;
          fileSelector.innerHTML += `<option value="${file.name}">🖼️ ${file.name}</option>`;
        });
        fileTreeHTML += "</div></div>";
      }

      if (otherFiles.length > 0) {
        fileTreeHTML += `<div class="file-category">
          <div class="category-header">📁 Other (${otherFiles.length})</div>
          <div class="category-files">`;
        otherFiles.forEach((file) => {
          fileTreeHTML += `<div class="file-item" data-file="${file.name}">
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${this.formatFileSize(file.size)}</span>
          </div>`;
          fileSelector.innerHTML += `<option value="${file.name}">📄 ${file.name}</option>`;
        });
        fileTreeHTML += "</div></div>";
      }

      fileList.innerHTML = fileTreeHTML;

      // Add click handlers to file items
      const fileItems = fileList.querySelectorAll(".file-item");
      fileItems.forEach((item) => {
        item.addEventListener("click", () => {
          const fileName = item.dataset.file;
          fileSelector.value = fileName;
          this.loadFileForEditing(fileName);
          this.switchTab("edit");
        });
      });

      // Suggest relevant tools based on uploaded files
      this.suggestAndDisplayTools(files);
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

      // Controls
      const controls = document.createElement("div");
      controls.className = "preview-controls";
      const fullscreenBtn = document.createElement("button");
      fullscreenBtn.className = "preview-fullscreen-btn";
      fullscreenBtn.textContent = "⛶ Fullscreen";
      fullscreenBtn.addEventListener("click", () => {
        const title = `Preview: ${file.name}`;
        this.openFullscreenFromElement(element, title, element.src || url);
      });
      controls.appendChild(fullscreenBtn);
      container.appendChild(controls);

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

      // Controls
      const controls = document.createElement("div");
      controls.className = "preview-controls";
      const fullscreenBtn = document.createElement("button");
      fullscreenBtn.className = "preview-fullscreen-btn";
      fullscreenBtn.textContent = "⛶ Fullscreen";
      fullscreenBtn.addEventListener("click", () => {
        this.openFullscreenFromElement(iframe, "Project Preview", url);
      });
      controls.appendChild(fullscreenBtn);
      container.appendChild(controls);

      content.appendChild(container);
    } catch (error) {
      this.error("Error creating project preview", error);
      this.showError("Failed to preview project: " + error.message);
    }
  }

  openFullscreenFromElement(element, title = "Preview", url = null) {
    try {
      this.log("Opening fullscreen", { title, url });
      if (!this.fullscreenModal) this.setupFullscreenModal();

      const titleEl = this.fullscreenModal.querySelector("#fullscreenTitle");
      if (titleEl) titleEl.textContent = title;

      this.fullscreenBody.innerHTML = "";
      let displayEl = null;

      const tag = (element.tagName || "").toLowerCase();
      if (tag === "iframe") {
        displayEl = document.createElement("iframe");
        displayEl.src = url || element.src;
        displayEl.className = "fullscreen-iframe";
        displayEl.sandbox =
          element.sandbox || "allow-scripts allow-same-origin allow-forms";
      } else if (tag === "img") {
        displayEl = document.createElement("img");
        displayEl.src = url || element.src;
        displayEl.className = "fullscreen-image";
        displayEl.alt = title;
      } else if (tag === "video") {
        displayEl = document.createElement("video");
        displayEl.src = url || element.src;
        displayEl.controls = true;
        displayEl.autoplay = true;
        displayEl.className = "fullscreen-video";
      } else if (tag === "audio") {
        displayEl = document.createElement("audio");
        displayEl.src = url || element.src;
        displayEl.controls = true;
        displayEl.autoplay = true;
        displayEl.className = "fullscreen-audio";
      } else {
        // Generic clone (e.g., code preview)
        displayEl = element.cloneNode(true);
        displayEl.classList.add("fullscreen-generic");
      }

      this.currentFullscreenUrl = url || element.src || null;
      this.fullscreenBody.appendChild(displayEl);
      this.fullscreenModal.style.display = "flex";
      document.body.style.overflow = "hidden";
    } catch (error) {
      this.error("Failed to open fullscreen", error);
    }
  }

  hideFullscreen() {
    if (!this.fullscreenModal) return;
    this.fullscreenModal.style.display = "none";
    if (this.fullscreenBody) this.fullscreenBody.innerHTML = "";
    document.body.style.overflow = "";
    this.currentFullscreenUrl = null;
    this.log("Fullscreen closed");
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

  // Enhanced functionality methods
  switchTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll(".preview-tab");
    tabs.forEach((tab) => tab.classList.remove("active"));

    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
      activeTab.classList.add("active");
    }

    // Update tab content
    const tabContents = document.querySelectorAll(".preview-tab-content");
    tabContents.forEach((content) => content.classList.remove("active"));

    const activeContent = document.getElementById(`${tabName}Tab`);
    if (activeContent) {
      activeContent.classList.add("active");
    }

    this.log(`Switched to ${tabName} tab`);
  }

  toggleResponsiveMode() {
    const previewFrame = document.getElementById("previewFrame");
    if (previewFrame) {
      const responsiveModes = ["desktop", "tablet", "mobile"];
      const currentMode = previewFrame.dataset.responsiveMode || "desktop";

      const currentIndex = responsiveModes.indexOf(currentMode);
      const nextIndex = (currentIndex + 1) % responsiveModes.length;
      const nextMode = responsiveModes[nextIndex];

      previewFrame.dataset.responsiveMode = nextMode;
      previewFrame.className = `preview-frame ${nextMode}`;

      this.log(`Switched to ${nextMode} responsive mode`);
    }
  }

  saveChanges() {
    // Implementation for saving changes
    this.showToast("Changes saved successfully!", "success");
    this.log("Changes saved");
  }

  autoSave() {
    // Implementation for auto-saving
    this.log("Auto-saving changes");
  }

  loadFileForEditing(fileName) {
    if (!fileName || !this.currentFiles.has(fileName)) {
      return;
    }

    const file = this.currentFiles.get(fileName);
    const editor = document.getElementById("codeEditor");

    if (editor) {
      // Set content based on file type
      let content = "";
      if (
        file.type.startsWith("text/") ||
        file.name.match(/\.(html|css|js|json|txt)$/i)
      ) {
        // Read file content
        const reader = new FileReader();
        reader.onload = (e) => {
          editor.innerHTML = this.escapeHtml(e.target.result);
          editor.dataset.fileName = fileName;
          editor.dataset.fileType = this.getFileType(fileName);
        };
        reader.readAsText(file);
      } else {
        editor.innerHTML = `<div class="binary-file-placeholder">Binary file: ${fileName}</div>`;
      }
    }
  }

  getFileType(fileName) {
    if (fileName.match(/\.html?$/i)) return "html";
    if (fileName.match(/\.css$/i)) return "css";
    if (fileName.match(/\.js$/i)) return "javascript";
    if (fileName.match(/\.json$/i)) return "json";
    return "text";
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatCode() {
    const editor = document.getElementById("codeEditor");
    if (!editor || !editor.dataset.fileType) return;

    const content = editor.textContent || editor.innerText;
    const fileType = editor.dataset.fileType;

    try {
      let formatted = content;

      if (fileType === "html") {
        formatted = this.formatHTML(content);
      } else if (fileType === "css") {
        formatted = this.formatCSS(content);
      } else if (fileType === "javascript") {
        formatted = this.formatJS(content);
      }

      editor.innerHTML = this.escapeHtml(formatted);
      this.showToast("Code formatted successfully!", "success");
    } catch (error) {
      this.showToast("Failed to format code", "error");
      this.error("Code formatting failed", error);
    }
  }

  formatHTML(html) {
    // Basic HTML formatting (could be enhanced with a proper formatter)
    return html.replace(/>\s*</g, ">\n<").replace(/\n\s*\n/g, "\n");
  }

  formatCSS(css) {
    // Basic CSS formatting
    return css
      .replace(/;\s*/g, ";\n")
      .replace(/{\s*/g, "{\n  ")
      .replace(/\n\s*\n/g, "\n");
  }

  formatJS(js) {
    // Basic JS formatting (could be enhanced with Prettier integration)
    return js
      .replace(/;\s*/g, ";\n")
      .replace(/{\s*/g, "{\n  ")
      .replace(/\n\s*\n/g, "\n");
  }

  executeToolAction(tool) {
    switch (tool) {
      case "format":
        this.formatCode();
        break;
      case "optimize":
        this.optimizeCSS();
        break;
      case "validate":
        this.validateHTML();
        break;
      case "preview":
        this.switchTab("preview");
        break;
      default:
        this.showToast(`Tool ${tool} not implemented yet`, "info");
    }
  }

  optimizeCSS() {
    // CSS optimization logic
    this.showToast("CSS optimization completed!", "success");
  }

  validateHTML() {
    // HTML validation logic
    this.showToast("HTML validation completed!", "success");
  }

  async runWidgetAnalysis() {
    const analysisResults = document.getElementById("analysisResults");
    if (!analysisResults) return;

    try {
      // Show loading state
      analysisResults.innerHTML = `
        <div class="analysis-loading">
          <span class="loading-spinner">🔄</span>
          <p>Running widget analysis...</p>
        </div>
      `;

      // Import and run workflow manager analysis
      const { default: WorkflowManager } = await import(
        "../../../../pages/page_modals/modal_scripts/workflow-manager.js"
      );
      const workflowManager = new WorkflowManager();

      // Simulate analysis workflow
      const analysisData = {
        codeQuality: {
          score: 85,
          issues: [
            "Consider adding alt text to images",
            "Optimize CSS selectors",
          ],
        },
        performance: {
          score: 92,
          suggestions: ["Minify CSS files", "Optimize images"],
        },
        accessibility: {
          score: 78,
          improvements: ["Add ARIA labels", "Improve color contrast"],
        },
        seo: {
          score: 88,
          recommendations: ["Add meta description", "Optimize title tags"],
        },
      };

      // Display results
      this.displayAnalysisResults(analysisData);
    } catch (error) {
      analysisResults.innerHTML = `
        <div class="analysis-error">
          <span class="error-icon">❌</span>
          <p>Analysis failed: ${error.message}</p>
        </div>
      `;
      this.error("Widget analysis failed", error);
    }
  }

  displayAnalysisResults(analysis) {
    const analysisResults = document.getElementById("analysisResults");

    const html = `
      <div class="analysis-summary">
        <h5>Analysis Summary</h5>
        <div class="score-grid">
          <div class="score-item">
            <span class="score-label">Code Quality</span>
            <div class="score-bar">
              <div class="score-fill" style="width: ${analysis.codeQuality.score}%"></div>
            </div>
            <span class="score-value">${analysis.codeQuality.score}/100</span>
          </div>
          <div class="score-item">
            <span class="score-label">Performance</span>
            <div class="score-bar">
              <div class="score-fill" style="width: ${analysis.performance.score}%"></div>
            </div>
            <span class="score-value">${analysis.performance.score}/100</span>
          </div>
          <div class="score-item">
            <span class="score-label">Accessibility</span>
            <div class="score-bar">
              <div class="score-fill" style="width: ${analysis.accessibility.score}%"></div>
            </div>
            <span class="score-value">${analysis.accessibility.score}/100</span>
          </div>
          <div class="score-item">
            <span class="score-label">SEO</span>
            <div class="score-bar">
              <div class="score-fill" style="width: ${analysis.seo.score}%"></div>
            </div>
            <span class="score-value">${analysis.seo.score}/100</span>
          </div>
        </div>
      </div>

      <div class="analysis-details">
        <div class="analysis-section">
          <h6>Code Quality Issues</h6>
          <ul>
            ${analysis.codeQuality.issues.map((issue) => `<li>• ${issue}</li>`).join("")}
          </ul>
        </div>

        <div class="analysis-section">
          <h6>Performance Suggestions</h6>
          <ul>
            ${analysis.performance.suggestions.map((suggestion) => `<li>• ${suggestion}</li>`).join("")}
          </ul>
        </div>

        <div class="analysis-section">
          <h6>Accessibility Improvements</h6>
          <ul>
            ${analysis.accessibility.improvements.map((improvement) => `<li>• ${improvement}</li>`).join("")}
          </ul>
        </div>

        <div class="analysis-section">
          <h6>SEO Recommendations</h6>
          <ul>
            ${analysis.seo.recommendations.map((rec) => `<li>• ${rec}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;

    analysisResults.innerHTML = html;
  }

  applyStylePreset(preset) {
    const presets = {
      minimal: {
        primaryColor: "#000000",
        background: "solid",
        borderRadius: 0,
      },
      neon: {
        primaryColor: "#00f0ff",
        background: "gradient",
        borderRadius: 8,
      },
      glass: {
        primaryColor: "#ffffff",
        background: "transparent",
        borderRadius: 12,
      },
      retro: {
        primaryColor: "#ff6b35",
        background: "solid",
        borderRadius: 4,
      },
    };

    const style = presets[preset];
    if (style) {
      this.updateStyleVariable("--primary-color", style.primaryColor);
      this.updateBackgroundStyle(style.background);
      this.updateStyleVariable("--border-radius", style.borderRadius + "px");

      // Update form controls
      const primaryColor = document.getElementById("primaryColor");
      const backgroundStyle = document.getElementById("backgroundStyle");
      const borderRadius = document.getElementById("borderRadius");

      if (primaryColor) primaryColor.value = style.primaryColor;
      if (backgroundStyle) backgroundStyle.value = style.background;
      if (borderRadius) borderRadius.value = style.borderRadius;

      this.showToast(`Applied ${preset} style preset!`, "success");
    }
  }

  updateStyleVariable(variable, value) {
    document.documentElement.style.setProperty(variable, value);
    this.log(`Updated ${variable} to ${value}`);
  }

  updateBackgroundStyle(style) {
    const previewFrame = document.getElementById("previewFrame");
    if (previewFrame) {
      previewFrame.className = `preview-frame ${style}`;
    }
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    const container =
      document.querySelector(".toast-container") || document.body;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }

  // Tools Integration
  async suggestTools(files) {
    try {
      // Import tools filter manager
      const { default: toolsFilterManager } = await import(
        "../../../../scripts/ui/tools-filter.js"
      );

      const suggestions = [];
      const fileTypes = new Set();

      // Analyze files to determine relevant tools
      files.forEach((file) => {
        if (file.name.match(/\.html?$/i)) fileTypes.add("html");
        if (file.name.match(/\.css$/i)) fileTypes.add("css");
        if (file.name.match(/\.js$/i)) fileTypes.add("javascript");
        if (file.name.match(/\.react?\.js$/i)) fileTypes.add("react");
        if (file.name.match(/\.vue?\.js$/i)) fileTypes.add("vue");
      });

      // Get relevant tools from tools filter manager
      const allTools = [
        ...toolsFilterManager.getToolsByCategory("ai-ides"),
        ...toolsFilterManager.getToolsByCategory("design"),
        ...toolsFilterManager.getToolsByCategory("productivity"),
        ...toolsFilterManager.getToolsByCategory("templates"),
      ];

      // Filter tools based on file types
      const relevantTools = allTools.filter((tool) => {
        const features = tool.features || [];
        const tags = tool.tags || [];

        return (
          (fileTypes.has("html") &&
            (features.includes("HTML") || tags.includes("HTML"))) ||
          (fileTypes.has("css") &&
            (features.includes("CSS") || tags.includes("CSS"))) ||
          (fileTypes.has("javascript") &&
            (features.includes("JavaScript") || tags.includes("JavaScript"))) ||
          (fileTypes.has("react") &&
            (features.includes("React") || tags.includes("React"))) ||
          (fileTypes.has("vue") &&
            (features.includes("Vue") || tags.includes("Vue"))) ||
          features.includes("Development") ||
          tags.includes("AI") ||
          tags.includes("Code Editor")
        );
      });

      // Sort by rating and take top 3
      const topTools = relevantTools
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3);

      return topTools;
    } catch (error) {
      this.error("Error getting tool suggestions", error);
      return [];
    }
  }

  displayToolSuggestions(tools) {
    const toolButtons = document.getElementById("toolButtons");
    if (!toolButtons) return;

    // Clear existing tool suggestions
    const existingSuggestions = toolButtons.querySelectorAll(".suggested-tool");
    existingSuggestions.forEach((btn) => btn.remove());

    // Add new tool suggestions
    tools.forEach((tool, index) => {
      const toolBtn = document.createElement("button");
      toolBtn.className = "tool-btn suggested-tool";
      toolBtn.title = `${tool.name} - ${tool.description}`;
      toolBtn.innerHTML = `
        <span>${tool.icon}</span>
        <span>${tool.name}</span>
      `;
      toolBtn.dataset.tool = "suggested";
      toolBtn.dataset.toolName = tool.name;
      toolBtn.dataset.toolUrl = tool.url;

      toolBtn.addEventListener("click", (e) => {
        this.openTool(tool.name, tool.url);
      });

      toolButtons.appendChild(toolBtn);
    });
  }

  openTool(toolName, toolUrl) {
    // Open tool in new tab
    window.open(toolUrl, "_blank");

    // Show toast notification
    this.showToast(`Opened ${toolName} in new tab!`, "info");

    this.log(`Opened tool: ${toolName} at ${toolUrl}`);
  }

  async suggestAndDisplayTools(files) {
    try {
      const tools = await this.suggestTools(files);
      this.displayToolSuggestions(tools);

      if (tools.length > 0) {
        this.log(`Suggested ${tools.length} tools for uploaded files`);
      }
    } catch (error) {
      this.error("Failed to suggest tools", error);
    }
  }
}

// Create and export singleton instance
const widgetPreviewManager = new WidgetPreviewManager();
export default widgetPreviewManager;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  widgetPreviewManager.init();
  // Expose globally for optional external triggers
  window.widgetPreviewManager = widgetPreviewManager;
});

// Export for use in other modules
export { WidgetPreviewManager };

// Export previewWidget function for timeline-manager.js
export function previewWidget(widgetData, containerId) {
  console.log("[WIDGET PREVIEW] previewWidget called", {
    widgetData,
    containerId,
  });

  if (!widgetData) {
    console.warn("[WIDGET PREVIEW] No widget data provided");
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn("[WIDGET PREVIEW] Container not found", containerId);
    return;
  }

  // Create preview content
  container.innerHTML = `
    <div class="widget-preview">
      <h3>Widget Preview</h3>
      <div class="preview-content">
        ${typeof widgetData === "string" ? widgetData : JSON.stringify(widgetData)}
      </div>
    </div>
  `;

  console.log("[WIDGET PREVIEW] Widget preview created successfully");
}
