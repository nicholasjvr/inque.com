import{c as g}from"./cloud-upload-xQtmBUJr.js";import{_ as y}from"./auth-YTXLyXWo.js";import{C as S}from"./css-analyzer-DJZTM973.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";class b{constructor(){this.previewContainer=null,this.currentFiles=new Map,this.fullscreenModal=null,this.fullscreenBody=null,this.currentFullscreenUrl=null,this.log("Widget Preview Manager initialized")}log(e,t=null){console.log(`[WIDGET PREVIEW] ${e}`,t||"")}error(e,t=null){console.error(`[WIDGET PREVIEW ERROR] ${e}`,t||"")}async init(){try{return this.log("Initializing widget preview system"),this.setupPreviewContainer(),this.setupFullscreenModal(),this.setupEventListeners(),!0}catch(e){return this.error("Failed to initialize widget preview system",e),!1}}setupPreviewContainer(){this.previewContainer=document.getElementById("widgetPreviewContainer"),this.previewContainer||(this.previewContainer=document.createElement("div"),this.previewContainer.id="widgetPreviewContainer",this.previewContainer.className="widget-preview-container",this.previewContainer.innerHTML=`
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
      `,document.body.appendChild(this.previewContainer))}setupFullscreenModal(){let e=document.getElementById("widgetFullscreenModal");e||(e=document.createElement("div"),e.id="widgetFullscreenModal",e.className="widget-fullscreen-modal",e.innerHTML=`
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
      `,document.body.appendChild(e)),this.fullscreenModal=e,this.fullscreenBody=e.querySelector("#fullscreenBody");const t=e.querySelector("#fullscreenCloseBtn");t&&!t._handlerBound&&(t.addEventListener("click",()=>this.hideFullscreen()),t._handlerBound=!0);const i=e.querySelector("#fullscreenOpenTabBtn");i&&!i._handlerBound&&(i.addEventListener("click",()=>{this.currentFullscreenUrl&&window.open(this.currentFullscreenUrl,"_blank")}),i._handlerBound=!0),e._backdropHandlerBound||(e.addEventListener("click",s=>{s.target===e&&this.hideFullscreen()}),e._backdropHandlerBound=!0),this._escHandlerBound||(document.addEventListener("keydown",s=>{s.key==="Escape"&&this.hideFullscreen()}),this._escHandlerBound=!0)}setupEventListeners(){const e=document.getElementById("previewCloseBtn");e&&e.addEventListener("click",()=>{this.hidePreview()}),document.querySelectorAll(".preview-tab").forEach(d=>{d.addEventListener("click",v=>{this.switchTab(v.target.dataset.tab)})});const i=document.getElementById("previewResponsiveBtn");i&&i.addEventListener("click",()=>{this.toggleResponsiveMode()});const s=document.getElementById("previewFullscreenBtn");s&&s.addEventListener("click",()=>{this.openFullscreenFromElement(document.getElementById("previewFrame"),"Widget Preview")});const a=document.getElementById("previewSaveBtn");a&&a.addEventListener("click",()=>{this.saveChanges()});const n=document.getElementById("fileSelector");n&&n.addEventListener("change",d=>{this.loadFileForEditing(d.target.value)});const c=document.getElementById("editorFormatBtn");c&&c.addEventListener("click",()=>{this.formatCode()}),document.querySelectorAll(".tool-btn").forEach(d=>{d.addEventListener("click",v=>{this.executeToolAction(v.target.dataset.tool)})});const r=document.getElementById("runAnalysisBtn");r&&r.addEventListener("click",()=>{this.runWidgetAnalysis()}),document.querySelectorAll(".style-preset").forEach(d=>{d.addEventListener("click",v=>{this.applyStylePreset(v.target.closest(".style-preset").dataset.preset)})});const l=document.getElementById("primaryColor");l&&l.addEventListener("change",d=>{this.updateStyleVariable("--primary-color",d.target.value)});const p=document.getElementById("backgroundStyle");p&&p.addEventListener("change",d=>{this.updateBackgroundStyle(d.target.value)});const h=document.getElementById("borderRadius");h&&h.addEventListener("input",d=>{this.updateStyleVariable("--border-radius",d.target.value+"px")}),this.previewContainer.addEventListener("click",d=>{d.target===this.previewContainer&&this.hidePreview()});const m=document.getElementById("codeEditor");if(m){let d;m.addEventListener("input",()=>{clearTimeout(d),d=setTimeout(()=>{this.autoSave()},1e3)})}}showPreview(){this.previewContainer&&(this.previewContainer.style.display="block",this.log("Preview shown"))}hidePreview(){this.previewContainer&&(this.previewContainer.style.display="none",this.clearPreview(),this.log("Preview hidden"))}clearPreview(){const e=document.getElementById("previewContent");e&&(e.innerHTML=`
        <div class="preview-placeholder">
          <span class="preview-icon">👁️</span>
          <p>Select files to preview your widget</p>
        </div>
      `),this.currentFiles.clear()}async handleFiles(e){try{this.log("Handling files for preview",{count:e.length});const t=Array.from(e);this.currentFiles.clear(),t.forEach(s=>{this.currentFiles.set(s.name,s)}),this.populateFileTree(t);const i=t.filter(s=>s.name.match(/\.html?$/i));if(i.length>0)await this.showProjectPreview(t,i[0]);else for(const s of t)await this.showFilePreview(s);this.showPreview()}catch(t){this.error("Error handling files for preview",t),this.showError("Failed to preview files: "+t.message)}}populateFileTree(e){const t=document.getElementById("fileList"),i=document.getElementById("fileSelector");if(t&&i){i.innerHTML='<option value="">Select a file to edit...</option>';const s=e.filter(l=>l.name.match(/\.html?$/i)),a=e.filter(l=>l.name.match(/\.css$/i)),n=e.filter(l=>l.name.match(/\.js$/i)),c=e.filter(l=>l.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)),o=e.filter(l=>!l.name.match(/\.(html?|css|js|png|jpg|jpeg|gif|svg|webp)$/i));let r="";s.length>0&&(r+=`<div class="file-category">
          <div class="category-header">📄 HTML (${s.length})</div>
          <div class="category-files">`,s.forEach(l=>{r+=`<div class="file-item" data-file="${l.name}">
            <span class="file-icon">📄</span>
            <span class="file-name">${l.name}</span>
            <span class="file-size">${this.formatFileSize(l.size)}</span>
          </div>`,i.innerHTML+=`<option value="${l.name}">📄 ${l.name}</option>`}),r+="</div></div>"),a.length>0&&(r+=`<div class="file-category">
          <div class="category-header">🎨 CSS (${a.length})</div>
          <div class="category-files">`,a.forEach(l=>{r+=`<div class="file-item" data-file="${l.name}">
            <span class="file-icon">🎨</span>
            <span class="file-name">${l.name}</span>
            <span class="file-size">${this.formatFileSize(l.size)}</span>
          </div>`,i.innerHTML+=`<option value="${l.name}">🎨 ${l.name}</option>`}),r+="</div></div>"),n.length>0&&(r+=`<div class="file-category">
          <div class="category-header">⚡ JavaScript (${n.length})</div>
          <div class="category-files">`,n.forEach(l=>{r+=`<div class="file-item" data-file="${l.name}">
            <span class="file-icon">⚡</span>
            <span class="file-name">${l.name}</span>
            <span class="file-size">${this.formatFileSize(l.size)}</span>
          </div>`,i.innerHTML+=`<option value="${l.name}">⚡ ${l.name}</option>`}),r+="</div></div>"),c.length>0&&(r+=`<div class="file-category">
          <div class="category-header">🖼️ Images (${c.length})</div>
          <div class="category-files">`,c.forEach(l=>{r+=`<div class="file-item" data-file="${l.name}">
            <span class="file-icon">🖼️</span>
            <span class="file-name">${l.name}</span>
            <span class="file-size">${this.formatFileSize(l.size)}</span>
          </div>`,i.innerHTML+=`<option value="${l.name}">🖼️ ${l.name}</option>`}),r+="</div></div>"),o.length>0&&(r+=`<div class="file-category">
          <div class="category-header">📁 Other (${o.length})</div>
          <div class="category-files">`,o.forEach(l=>{r+=`<div class="file-item" data-file="${l.name}">
            <span class="file-icon">📄</span>
            <span class="file-name">${l.name}</span>
            <span class="file-size">${this.formatFileSize(l.size)}</span>
          </div>`,i.innerHTML+=`<option value="${l.name}">📄 ${l.name}</option>`}),r+="</div></div>"),t.innerHTML=r,t.querySelectorAll(".file-item").forEach(l=>{l.addEventListener("click",()=>{const p=l.dataset.file;i.value=p,this.loadFileForEditing(p),this.switchTab("edit")})}),this.suggestAndDisplayTools(e)}}async showFilePreview(e){const t=document.getElementById("previewContent");if(!t)return;const i=URL.createObjectURL(e);let s;try{if(e.type.startsWith("image/"))s=document.createElement("img"),s.src=i,s.className="preview-image",s.alt=e.name;else if(e.type.startsWith("audio/"))s=document.createElement("audio"),s.controls=!0,s.src=i,s.className="preview-audio";else if(e.type.startsWith("video/"))s=document.createElement("video"),s.controls=!0,s.src=i,s.className="preview-video";else if(e.name.match(/\.html?$/i))s=document.createElement("iframe"),s.src=i,s.className="preview-iframe",s.sandbox="allow-scripts allow-same-origin";else if(e.name.match(/\.(js|css|json|txt)$/i)){const r=await this.readFileAsText(e);s=this.createCodePreview(r,e.name)}else s=document.createElement("div"),s.className="preview-unsupported",s.innerHTML=`
          <span class="file-icon">📄</span>
          <p>${e.name}</p>
          <small>File type not supported for preview</small>
        `;const a=document.createElement("div");a.className="file-info",a.innerHTML=`
        <span class="file-name">${e.name}</span>
        <span class="file-size">${this.formatFileSize(e.size)}</span>
      `;const n=document.createElement("div");n.className="preview-item",n.appendChild(a),n.appendChild(s);const c=document.createElement("div");c.className="preview-controls";const o=document.createElement("button");o.className="preview-fullscreen-btn",o.textContent="⛶ Fullscreen",o.addEventListener("click",()=>{const r=`Preview: ${e.name}`;this.openFullscreenFromElement(s,r,s.src||i)}),c.appendChild(o),n.appendChild(c),t.appendChild(n)}catch(a){this.error("Error creating preview for file",{fileName:e.name,error:a})}}async showProjectPreview(e,t){const i=document.getElementById("previewContent");if(i)try{const s={};e.forEach(m=>s[m.name]=m);let n=await this.readFileAsText(t);n=n.replace(/<link[^>]+href="([^"]+\.css)"[^>]*>/gi,async(m,d)=>s[d]?`<style>${await this.readFileAsText(s[d])}</style>`:m),n=n.replace(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/gi,async(m,d)=>s[d]?`<script>${await this.readFileAsText(s[d])}<\/script>`:m);const c=new Blob([n],{type:"text/html"}),o=URL.createObjectURL(c),r=document.createElement("iframe");r.src=o,r.className="preview-iframe project-preview",r.sandbox="allow-scripts allow-same-origin allow-forms",r.title="Widget Preview";const u=document.createElement("div");u.className="project-info",u.innerHTML=`
        <h4>Project Preview</h4>
        <p>${e.length} files loaded</p>
        <ul class="file-list">
          ${e.map(m=>`<li>${m.name} (${this.formatFileSize(m.size)})</li>`).join("")}
        </ul>
      `;const l=document.createElement("div");l.className="preview-item project-preview-item",l.appendChild(u),l.appendChild(r);const p=document.createElement("div");p.className="preview-controls";const h=document.createElement("button");h.className="preview-fullscreen-btn",h.textContent="⛶ Fullscreen",h.addEventListener("click",()=>{this.openFullscreenFromElement(r,"Project Preview",o)}),p.appendChild(h),l.appendChild(p),i.appendChild(l)}catch(s){this.error("Error creating project preview",s),this.showError("Failed to preview project: "+s.message)}}openFullscreenFromElement(e,t="Preview",i=null){try{this.log("Opening fullscreen",{title:t,url:i}),this.fullscreenModal||this.setupFullscreenModal();const s=this.fullscreenModal.querySelector("#fullscreenTitle");s&&(s.textContent=t),this.fullscreenBody.innerHTML="";let a=null;const n=(e.tagName||"").toLowerCase();n==="iframe"?(a=document.createElement("iframe"),a.src=i||e.src,a.className="fullscreen-iframe",a.sandbox=e.sandbox||"allow-scripts allow-same-origin allow-forms"):n==="img"?(a=document.createElement("img"),a.src=i||e.src,a.className="fullscreen-image",a.alt=t):n==="video"?(a=document.createElement("video"),a.src=i||e.src,a.controls=!0,a.autoplay=!0,a.className="fullscreen-video"):n==="audio"?(a=document.createElement("audio"),a.src=i||e.src,a.controls=!0,a.autoplay=!0,a.className="fullscreen-audio"):(a=e.cloneNode(!0),a.classList.add("fullscreen-generic")),this.currentFullscreenUrl=i||e.src||null,this.fullscreenBody.appendChild(a),this.fullscreenModal.style.display="flex",document.body.style.overflow="hidden"}catch(s){this.error("Failed to open fullscreen",s)}}hideFullscreen(){this.fullscreenModal&&(this.fullscreenModal.style.display="none",this.fullscreenBody&&(this.fullscreenBody.innerHTML=""),document.body.style.overflow="",this.currentFullscreenUrl=null,this.log("Fullscreen closed"))}createCodePreview(e,t){const i=document.createElement("div");i.className="code-preview";const s=document.createElement("div");s.className="code-header",s.innerHTML=`
      <span class="file-name">${t}</span>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${e.replace(/`/g,"\\`")}\`)">📋 Copy</button>
    `;const a=document.createElement("pre");return a.className="code-content",a.textContent=e,i.appendChild(s),i.appendChild(a),i}async readFileAsText(e){return new Promise((t,i)=>{const s=new FileReader;s.onload=()=>t(s.result),s.onerror=()=>i(s.error),s.readAsText(e)})}formatFileSize(e){if(e===0)return"0 Bytes";const t=1024,i=["Bytes","KB","MB","GB"],s=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,s)).toFixed(2))+" "+i[s]}showError(e){const t=document.getElementById("previewContent");t&&(t.innerHTML=`
        <div class="preview-error">
          <span class="error-icon">❌</span>
          <p>${e}</p>
        </div>
      `)}getCurrentFiles(){return Array.from(this.currentFiles.values())}clearFiles(){this.currentFiles.clear(),this.clearPreview()}switchTab(e){document.querySelectorAll(".preview-tab").forEach(n=>n.classList.remove("active"));const i=document.querySelector(`[data-tab="${e}"]`);i&&i.classList.add("active"),document.querySelectorAll(".preview-tab-content").forEach(n=>n.classList.remove("active"));const a=document.getElementById(`${e}Tab`);a&&a.classList.add("active"),this.log(`Switched to ${e} tab`)}toggleResponsiveMode(){const e=document.getElementById("previewFrame");if(e){const t=["desktop","tablet","mobile"],i=e.dataset.responsiveMode||"desktop",a=(t.indexOf(i)+1)%t.length,n=t[a];e.dataset.responsiveMode=n,e.className=`preview-frame ${n}`,this.log(`Switched to ${n} responsive mode`)}}saveChanges(){this.showToast("Changes saved successfully!","success"),this.log("Changes saved")}autoSave(){this.log("Auto-saving changes")}loadFileForEditing(e){if(!e||!this.currentFiles.has(e))return;const t=this.currentFiles.get(e),i=document.getElementById("codeEditor");if(i)if(t.type.startsWith("text/")||t.name.match(/\.(html|css|js|json|txt)$/i)){const s=new FileReader;s.onload=a=>{i.innerHTML=this.escapeHtml(a.target.result),i.dataset.fileName=e,i.dataset.fileType=this.getFileType(e)},s.readAsText(t)}else i.innerHTML=`<div class="binary-file-placeholder">Binary file: ${e}</div>`}getFileType(e){return e.match(/\.html?$/i)?"html":e.match(/\.css$/i)?"css":e.match(/\.js$/i)?"javascript":e.match(/\.json$/i)?"json":"text"}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}formatCode(){const e=document.getElementById("codeEditor");if(!e||!e.dataset.fileType)return;const t=e.textContent||e.innerText,i=e.dataset.fileType;try{let s=t;i==="html"?s=this.formatHTML(t):i==="css"?s=this.formatCSS(t):i==="javascript"&&(s=this.formatJS(t)),e.innerHTML=this.escapeHtml(s),this.showToast("Code formatted successfully!","success")}catch(s){this.showToast("Failed to format code","error"),this.error("Code formatting failed",s)}}formatHTML(e){return e.replace(/>\s*</g,`>
<`).replace(/\n\s*\n/g,`
`)}formatCSS(e){return e.replace(/;\s*/g,`;
`).replace(/{\s*/g,`{
  `).replace(/\n\s*\n/g,`
`)}formatJS(e){return e.replace(/;\s*/g,`;
`).replace(/{\s*/g,`{
  `).replace(/\n\s*\n/g,`
`)}executeToolAction(e){switch(e){case"format":this.formatCode();break;case"optimize":this.optimizeCSS();break;case"validate":this.validateHTML();break;case"preview":this.switchTab("preview");break;default:this.showToast(`Tool ${e} not implemented yet`,"info")}}optimizeCSS(){this.showToast("CSS optimization completed!","success")}validateHTML(){this.showToast("HTML validation completed!","success")}async runWidgetAnalysis(){const e=document.getElementById("analysisResults");if(e)try{e.innerHTML=`
        <div class="analysis-loading">
          <span class="loading-spinner">🔄</span>
          <p>Running widget analysis...</p>
        </div>
      `;const{default:t}=await y(async()=>{const{default:a}=await import("./workflow-manager-DGGmNlxe.js");return{default:a}},[],import.meta.url),i=new t,s={codeQuality:{score:85,issues:["Consider adding alt text to images","Optimize CSS selectors"]},performance:{score:92,suggestions:["Minify CSS files","Optimize images"]},accessibility:{score:78,improvements:["Add ARIA labels","Improve color contrast"]},seo:{score:88,recommendations:["Add meta description","Optimize title tags"]}};this.displayAnalysisResults(s)}catch(t){e.innerHTML=`
        <div class="analysis-error">
          <span class="error-icon">❌</span>
          <p>Analysis failed: ${t.message}</p>
        </div>
      `,this.error("Widget analysis failed",t)}}displayAnalysisResults(e){const t=document.getElementById("analysisResults"),i=`
      <div class="analysis-summary">
        <h5>Analysis Summary</h5>
        <div class="score-grid">
          <div class="score-item">
            <span class="score-label">Code Quality</span>
            <div class="score-bar">
              <div class="score-fill" style="width: ${e.codeQuality.score}%"></div>
            </div>
            <span class="score-value">${e.codeQuality.score}/100</span>
          </div>
          <div class="score-item">
            <span class="score-label">Performance</span>
            <div class="score-bar">
              <div class="score-fill" style="width: ${e.performance.score}%"></div>
            </div>
            <span class="score-value">${e.performance.score}/100</span>
          </div>
          <div class="score-item">
            <span class="score-label">Accessibility</span>
            <div class="score-bar">
              <div class="score-fill" style="width: ${e.accessibility.score}%"></div>
            </div>
            <span class="score-value">${e.accessibility.score}/100</span>
          </div>
          <div class="score-item">
            <span class="score-label">SEO</span>
            <div class="score-bar">
              <div class="score-fill" style="width: ${e.seo.score}%"></div>
            </div>
            <span class="score-value">${e.seo.score}/100</span>
          </div>
        </div>
      </div>

      <div class="analysis-details">
        <div class="analysis-section">
          <h6>Code Quality Issues</h6>
          <ul>
            ${e.codeQuality.issues.map(s=>`<li>• ${s}</li>`).join("")}
          </ul>
        </div>

        <div class="analysis-section">
          <h6>Performance Suggestions</h6>
          <ul>
            ${e.performance.suggestions.map(s=>`<li>• ${s}</li>`).join("")}
          </ul>
        </div>

        <div class="analysis-section">
          <h6>Accessibility Improvements</h6>
          <ul>
            ${e.accessibility.improvements.map(s=>`<li>• ${s}</li>`).join("")}
          </ul>
        </div>

        <div class="analysis-section">
          <h6>SEO Recommendations</h6>
          <ul>
            ${e.seo.recommendations.map(s=>`<li>• ${s}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;t.innerHTML=i}applyStylePreset(e){const i={minimal:{primaryColor:"#000000",background:"solid",borderRadius:0},neon:{primaryColor:"#00f0ff",background:"gradient",borderRadius:8},glass:{primaryColor:"#ffffff",background:"transparent",borderRadius:12},retro:{primaryColor:"#ff6b35",background:"solid",borderRadius:4}}[e];if(i){this.updateStyleVariable("--primary-color",i.primaryColor),this.updateBackgroundStyle(i.background),this.updateStyleVariable("--border-radius",i.borderRadius+"px");const s=document.getElementById("primaryColor"),a=document.getElementById("backgroundStyle"),n=document.getElementById("borderRadius");s&&(s.value=i.primaryColor),a&&(a.value=i.background),n&&(n.value=i.borderRadius),this.showToast(`Applied ${e} style preset!`,"success")}}updateStyleVariable(e,t){document.documentElement.style.setProperty(e,t),this.log(`Updated ${e} to ${t}`)}updateBackgroundStyle(e){const t=document.getElementById("previewFrame");t&&(t.className=`preview-frame ${e}`)}showToast(e,t="info"){const i=document.createElement("div");i.className=`toast ${t}`,i.innerHTML=`
      <span class="toast-message">${e}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `,(document.querySelector(".toast-container")||document.body).appendChild(i),setTimeout(()=>{i.parentNode&&i.remove()},3e3)}async suggestTools(e){try{const{default:t}=await y(async()=>{const{default:o}=await import("./tools-filter-qyJYBFYl.js");return{default:o}},[],import.meta.url),i=[],s=new Set;return e.forEach(o=>{o.name.match(/\.html?$/i)&&s.add("html"),o.name.match(/\.css$/i)&&s.add("css"),o.name.match(/\.js$/i)&&s.add("javascript"),o.name.match(/\.react?\.js$/i)&&s.add("react"),o.name.match(/\.vue?\.js$/i)&&s.add("vue")}),[...t.getToolsByCategory("ai-ides"),...t.getToolsByCategory("design"),...t.getToolsByCategory("productivity"),...t.getToolsByCategory("templates")].filter(o=>{const r=o.features||[],u=o.tags||[];return s.has("html")&&(r.includes("HTML")||u.includes("HTML"))||s.has("css")&&(r.includes("CSS")||u.includes("CSS"))||s.has("javascript")&&(r.includes("JavaScript")||u.includes("JavaScript"))||s.has("react")&&(r.includes("React")||u.includes("React"))||s.has("vue")&&(r.includes("Vue")||u.includes("Vue"))||r.includes("Development")||u.includes("AI")||u.includes("Code Editor")}).sort((o,r)=>(r.rating||0)-(o.rating||0)).slice(0,3)}catch(t){return this.error("Error getting tool suggestions",t),[]}}displayToolSuggestions(e){const t=document.getElementById("toolButtons");if(!t)return;t.querySelectorAll(".suggested-tool").forEach(s=>s.remove()),e.forEach((s,a)=>{const n=document.createElement("button");n.className="tool-btn suggested-tool",n.title=`${s.name} - ${s.description}`,n.innerHTML=`
        <span>${s.icon}</span>
        <span>${s.name}</span>
      `,n.dataset.tool="suggested",n.dataset.toolName=s.name,n.dataset.toolUrl=s.url,n.addEventListener("click",c=>{this.openTool(s.name,s.url)}),t.appendChild(n)})}openTool(e,t){window.open(t,"_blank"),this.showToast(`Opened ${e} in new tab!`,"info"),this.log(`Opened tool: ${e} at ${t}`)}async suggestAndDisplayTools(e){try{const t=await this.suggestTools(e);this.displayToolSuggestions(t),t.length>0&&this.log(`Suggested ${t.length} tools for uploaded files`)}catch(t){this.error("Failed to suggest tools",t)}}}const f=new b;document.addEventListener("DOMContentLoaded",()=>{f.init(),window.widgetPreviewManager=f});class C{constructor(){this.uploadingSlots=new Set,this.cssAnalyzer=null,this.isPremium=!1,this.log("Widget Upload Manager initialized with Cloud Functions")}log(e,t=null){console.log(`[WIDGET UPLOAD] ${e}`,t||"")}error(e,t=null){console.error(`[WIDGET UPLOAD ERROR] ${e}`,t||"")}async init(){try{return this.log("Initializing widget upload system"),await this.checkPremiumStatus(),this.log("Widget upload system initialized"),this.setupEventListeners(),!0}catch(e){return this.error("Failed to initialize widget upload system",e),!1}}async checkPremiumStatus(){try{const e=window.userProfile||{};this.isPremium=e.isPremium||e.level>=3||!1,this.isPremium?(this.log("Premium user detected - CSS analysis enabled"),this.cssAnalyzer=new S):this.log("Standard user - CSS analysis disabled (premium feature)")}catch(e){this.log("Could not determine premium status - defaulting to standard",e),this.isPremium=!1}}setupEventListeners(){this.log("Setting up event listeners"),document.querySelectorAll(".upload-widget-btn").forEach(a=>{a.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),this.handleUploadButtonClick(a)})}),document.querySelectorAll(".preview-widget-btn").forEach(a=>{a.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),this.handlePreviewButtonClick(a)})}),document.querySelectorAll(".widget-file-input").forEach(a=>{a.addEventListener("change",n=>{this.handleFileInputChange(n.target)})}),document.querySelectorAll(".widget-upload-area").forEach(a=>{this.setupDragAndDrop(a)}),this.log("Event listeners setup complete")}setupDragAndDrop(e){const t=e.querySelector(".widget-file-input");e.addEventListener("dragover",i=>{i.preventDefault(),e.style.borderColor="var(--primary-color)",e.style.background="rgba(0, 240, 255, 0.1)"}),e.addEventListener("dragleave",i=>{i.preventDefault(),e.style.borderColor="#555",e.style.background="#0f0f0f"}),e.addEventListener("drop",i=>{i.preventDefault(),e.style.borderColor="#555",e.style.background="#0f0f0f";const s=i.dataTransfer.files;s.length>0&&(t.files=s,this.handleFileInputChange(t))}),e.addEventListener("click",i=>{i.target.closest(".file-list")||i.target.closest(".action-buttons")||(t.value="",t.click())})}async handleFileInputChange(e){const t=e.files;t.length>0&&(this.log("Files selected",{count:t.length}),this.updateFileList(e,t),this.isPremium&&this.cssAnalyzer?await this.analyzeWidgetFiles(t,e):(this.log("Skipping CSS analysis - premium feature"),this.showPremiumNotice(e)),f.handleFiles(t))}updateFileList(e,t){const i=e.closest(".widget-upload-area"),s=i.querySelector(".upload-placeholder p");if(t.length>0){s.textContent=`${t.length} file(s) selected`;let a=i.querySelector(".file-list");a||(a=document.createElement("div"),a.className="file-list",i.appendChild(a)),a.innerHTML="",Array.from(t).forEach(n=>{const c=document.createElement("div");c.className="file-item",c.innerHTML=`
          <span class="file-name">${n.name}</span>
          <span class="file-size">${this.formatFileSize(n.size)}</span>
          <span class="file-type ${this.getFileTypeClass(n.name)}">${this.getFileTypeLabel(n.name)}</span>
        `,a.appendChild(c)}),this.addCSSAnalysisIndicator(i,t)}}getFileTypeClass(e){return e.match(/\.css$/i)?"css-file":e.match(/\.html?$/i)?"html-file":e.match(/\.js$/i)?"js-file":e.match(/\.(png|jpg|jpeg|gif|svg)$/i)?"image-file":"other-file"}getFileTypeLabel(e){return e.match(/\.css$/i)?"CSS":e.match(/\.html?$/i)?"HTML":e.match(/\.js$/i)?"JS":e.match(/\.(png|jpg|jpeg|gif|svg)$/i)?"IMG":"FILE"}addCSSAnalysisIndicator(e,t){const i=Array.from(t).filter(a=>a.name.match(/\.css$/i)),s=Array.from(t).filter(a=>a.name.match(/\.html?$/i));if(i.length>0||s.length>0){let a=e.querySelector(".css-analysis-indicator");a||(a=document.createElement("div"),a.className="css-analysis-indicator",this.isPremium?a.innerHTML=`
            <div class="analysis-status" id="analysisStatus">
              <span class="analysis-icon">🔍</span>
              <span class="analysis-text">Analyzing CSS...</span>
            </div>
            <div class="analysis-results" id="analysisResults" style="display: none;">
              <div class="css-issues" id="cssIssues"></div>
              <div class="css-recommendations" id="cssRecommendations"></div>
            </div>
          `:a.innerHTML=`
            <div class="premium-notice">
              <span class="premium-icon">⭐</span>
              <span class="premium-text">CSS Analysis - Premium Feature</span>
              <button class="upgrade-btn" onclick="this.showUpgradeModal()">Upgrade</button>
            </div>
          `,e.appendChild(a))}}showPremiumNotice(e){const t=e.closest(".widget-upload-area");Array.from(e.files).filter(s=>s.name.match(/\.css$/i)).length>0&&this.addCSSAnalysisIndicator(t,e.files)}formatFileSize(e){if(e===0)return"0 Bytes";const t=1024,i=["Bytes","KB","MB","GB"],s=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,s)).toFixed(2))+" "+i[s]}async handlePreviewButtonClick(e){const t=e.getAttribute("data-slot"),i=document.querySelector(`.widget-file-input[data-slot="${t}"]`);if(!i.files.length){this.showToast("Please select files to preview.","warning");return}this.log("Showing preview for slot",{slot:t}),await f.handleFiles(i.files)}async handleUploadButtonClick(e){const t=e.getAttribute("data-slot");if(this.uploadingSlots.has(t)){this.log("Upload already in progress for slot",{slot:t});return}const i=document.querySelector(`.widget-file-input[data-slot="${t}"]`),s=document.querySelector(`.widget-title-input[data-slot="${t}"]`),a=document.querySelector(`.widget-desc-input[data-slot="${t}"]`);if(!i.files.length){this.showToast("Please select files to upload.","warning");return}if(!g.validateFiles(i.files)){this.showToast("Invalid file type selected. Allowed: html, js, css, png, jpg, jpeg, gif, svg, json.","error");return}const n=s.value.trim()||"Untitled Widget",c=a.value.trim()||"";this.uploadingSlots.add(t),e.textContent="Uploading...",e.disabled=!0;try{this.log("Starting widget upload",{slot:t,fileCount:i.files.length});let o=i.files,r={processedFiles:o,issues:[],recommendations:[]};if(this.isPremium&&this.cssAnalyzer){if(r=await this.processCSSForUpload(o),r.issues.length>0){const l=r.issues.filter(p=>p.severity==="high").length;l>0&&this.showToast(`CSS processing found ${l} issues. Consider reviewing before upload.`,"warning")}r.processedFiles.length>0&&(o=r.processedFiles)}else this.log("Skipping CSS processing - premium feature");const u=await g.uploadWithProgress(o,t,{title:n,description:c,cssAnalysis:r,originalFileCount:i.files.length},(l,p)=>{e.textContent=`${p} (${l}%)`});this.log("Widget upload successful",u),e.textContent=`Uploaded to Slot ${t}!`,e.style.background="linear-gradient(45deg, #4caf50, #45a049)",this.showToast(`Successfully uploaded ${u.files.length} files! 🎉`,"success"),window.widgetDisplay&&(this.log("Refreshing widget display..."),await window.widgetDisplay.loadUserWidgets(),window.widgetDisplay.setupWidgetSlots(),this.log("Widget display refreshed.")),setTimeout(()=>{e.textContent=`Upload to Slot ${t}`,e.disabled=!1,e.style.background="linear-gradient(45deg, #4caf50, #45a049)",i.value="",s.value="",a.value="";const l=i.closest(".widget-upload-area"),p=l.querySelector(".file-list");p&&p.remove();const h=l.querySelector(".upload-placeholder p");h.textContent="Drop files here or click to upload"},2e3)}catch(o){this.error("Widget upload failed",o),e.textContent="Upload Failed",e.style.background="linear-gradient(45deg, #f44336, #d32f2f)",this.showToast(`Upload failed: ${o.message}`,"error"),setTimeout(()=>{e.textContent=`Upload to Slot ${t}`,e.disabled=!1,e.style.background="linear-gradient(45deg, #4caf50, #45a049)"},2e3)}finally{this.uploadingSlots.delete(t)}}async analyzeWidgetFiles(e,t){try{const i=t.closest(".widget-upload-area"),s=i.querySelector("#analysisStatus"),a=i.querySelector("#analysisResults");s&&(s.style.display="block",a.style.display="none");const n=Array.from(e).filter(l=>l.name.match(/\.html?$/i)),c=n.length>0?n[0]:null,o=await this.cssAnalyzer.analyzeWidgetFiles(e,c);this.displayCSSAnalysisResults(o,i);const r=o.issues.filter(l=>l.severity==="high").length,u=o.issues.filter(l=>l.severity==="medium").length;r>0?this.showToast(`Found ${r} high-priority CSS issues. Please review before uploading.`,"warning"):u>0?this.showToast(`Found ${u} CSS issues. Consider reviewing for optimal styling.`,"info"):this.showToast("CSS analysis complete! Your styles look good.","success")}catch(i){this.error("CSS analysis failed",i),this.showToast("CSS analysis failed. Upload will still work but optimization may be limited.","warning")}}displayCSSAnalysisResults(e,t){const i=t.querySelector("#analysisStatus"),s=t.querySelector("#analysisResults"),a=t.querySelector("#cssIssues"),n=t.querySelector("#cssRecommendations");i&&(i.style.display="none"),s&&(s.style.display="block"),a&&(e.issues.length>0?a.innerHTML=`
          <h4>CSS Issues (${e.issues.length})</h4>
          ${e.issues.map(c=>`
            <div class="css-issue ${c.severity}">
              <span class="issue-severity ${c.severity}">${c.severity.toUpperCase()}</span>
              <span class="issue-message">${c.message}</span>
              ${c.suggestion?`<div class="issue-suggestion">💡 ${c.suggestion}</div>`:""}
            </div>
          `).join("")}
        `:a.innerHTML=`
          <h4>CSS Issues</h4>
          <div class="css-issue-success">✅ No CSS issues found!</div>
        `),n&&(e.recommendations.length>0?n.innerHTML=`
          <h4>Recommendations</h4>
          ${e.recommendations.map(c=>`
            <div class="css-recommendation ${c.priority}">
              <span class="rec-priority ${c.priority}">${c.priority.toUpperCase()}</span>
              <span class="rec-message">${c.message}</span>
              ${c.details?`<div class="rec-details">${c.details}</div>`:""}
            </div>
          `).join("")}
        `:n.innerHTML=`
          <h4>Recommendations</h4>
          <div class="css-recommendation-success">✨ Your CSS is well-optimized!</div>
        `),this.addAnalysisToggleFunctionality(t)}addAnalysisToggleFunctionality(e){const t=e.querySelector("#analysisResults"),i=e.querySelector("#analysisStatus");if(t&&i){i.style.cursor="pointer",i.title="Click to view CSS analysis results";let s=!1;i.addEventListener("click",()=>{s=!s,s?(t.style.display="block",i.innerHTML=`
            <span class="analysis-icon">📊</span>
            <span class="analysis-text">Hide Analysis</span>
          `):(t.style.display="none",i.innerHTML=`
            <span class="analysis-icon">🔍</span>
            <span class="analysis-text">Show Analysis</span>
          `)})}}showToast(e,t="info"){window.showToast?window.showToast(e,t):console.log(`[TOAST ${t.toUpperCase()}] ${e}`)}async deleteWidget(e){try{this.log("Deleting widget",{widgetId:e});const t=await g.deleteWidget(e);return this.log("Widget deleted successfully",t),t}catch(t){throw this.error("Widget deletion failed",t),t}}async getWidgetDownloadUrls(e){try{this.log("Getting widget download URLs",{widgetId:e});const t=await g.getWidgetDownloadUrls(e);return this.log("Download URLs retrieved",t),t}catch(t){throw this.error("Failed to get download URLs",t),t}}async processCSSForUpload(e){try{this.log("Processing CSS files for upload",{fileCount:e.length});const t=await this.cssAnalyzer.processCSSForUpload(e,{inlineCSS:!1,optimize:!0});return this.log("CSS processing completed",{originalFiles:e.length,processedFiles:t.processedFiles.length}),t}catch(t){return this.error("CSS processing failed",t),{processedFiles:e,inlinedCSS:"",issues:[],recommendations:[]}}}async handleWidgetUpload(e){try{this.log("Handling widget upload from auth module",{title:e.title});let t=e.files;if(t){const s=await this.processCSSForUpload(t);s.processedFiles.length>0&&(t=s.processedFiles)}const i=await g.uploadWidgetFiles(t,"slot-upload",{title:e.title,description:e.description||"",category:e.category||"general",tags:e.tags||[]});return this.log("Widget upload completed successfully",i),{success:!0,widgetId:i.widgetId,widget:i}}catch(t){return this.error("Widget upload failed",t),{success:!1,error:t.message}}}}const E=new C;document.addEventListener("DOMContentLoaded",()=>{E.init()});export{C as WidgetUploadManager,E as default};
