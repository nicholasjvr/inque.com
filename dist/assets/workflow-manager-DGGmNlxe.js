console.log("[WORKFLOW MANAGER] Initializing workflow manager...");let d=[],p=[],m=[],w=[];function g(){console.log("[WORKFLOW MANAGER] Initializing workflow manager components..."),y(),h(),k(),W(),A(),O(),console.log("[WORKFLOW MANAGER] Workflow manager initialized successfully")}function y(){const e=document.querySelectorAll(".tab-button"),t=document.querySelectorAll(".tab-content");e.forEach(o=>{o.addEventListener("click",()=>{const s=o.getAttribute("data-tab");e.forEach(n=>n.classList.remove("active")),t.forEach(n=>n.classList.remove("active")),o.classList.add("active"),document.getElementById(`${s}-tab`).classList.add("active"),console.log(`[WORKFLOW MANAGER] Switched to tab: ${s}`)})})}function h(){const e=document.getElementById("createWorkflowBtn");e&&e.addEventListener("click",F);const t=document.getElementById("scheduleWorkflowBtn");t&&t.addEventListener("click",D);const o=document.getElementById("createWorkflowForm");o&&o.addEventListener("submit",I);const s=document.getElementById("addStepBtn");s&&s.addEventListener("click",T);const n=document.getElementById("cancelCreateWorkflow");n&&n.addEventListener("click",v),document.querySelectorAll(".close-button").forEach(l=>{l.addEventListener("click",c=>{const i=c.target.closest(".modal");i&&(i.style.display="none")})})}async function k(){console.log("[WORKFLOW MANAGER] Loading workflows...");try{const e=[{id:"full-code-review",name:"Full Code Review",description:"Comprehensive code analysis, security scan, auto-fix, and documentation",stepCount:5,status:"available"},{id:"security-check",name:"Security Check",description:"Quick security vulnerability scan",stepCount:2,status:"available"},{id:"documentation-only",name:"Documentation Generation",description:"Generate comprehensive documentation for code",stepCount:2,status:"available"}];d=e,f(),console.log(`[WORKFLOW MANAGER] Loaded ${e.length} workflows`)}catch(e){console.error("[WORKFLOW MANAGER] Error loading workflows:",e)}}function f(){const e=document.getElementById("workflowList");e&&(e.innerHTML="",d.forEach(t=>{const o=b(t);e.appendChild(o)}))}function b(e){const t=document.createElement("div");return t.className="workflow-card",t.innerHTML=`
    <div class="workflow-card-header">
      <h4 class="workflow-name">${e.name}</h4>
      <div class="workflow-status status-${e.status}">${e.status}</div>
    </div>
    <div class="workflow-card-body">
      <p class="workflow-description">${e.description}</p>
      <div class="workflow-meta">
        <span class="step-count">${e.stepCount} steps</span>
        <span class="workflow-id">ID: ${e.id}</span>
      </div>
    </div>
    <div class="workflow-card-actions">
      <button class="btn btn-primary btn-sm" onclick="executeWorkflow('${e.id}')">
        <span class="btn-icon">▶️</span>
        Execute
      </button>
      <button class="btn btn-secondary btn-sm" onclick="scheduleWorkflow('${e.id}')">
        <span class="btn-icon">⏰</span>
        Schedule
      </button>
      <button class="btn btn-outline btn-sm" onclick="viewWorkflowDetails('${e.id}')">
        <span class="btn-icon">👁️</span>
        Details
      </button>
    </div>
  `,t}async function W(){console.log("[WORKFLOW MANAGER] Loading templates...");const e=[{id:"code-quality",name:"Code Quality Check",description:"Comprehensive code quality analysis and improvement",stepCount:3,category:"Quality"},{id:"security-audit",name:"Security Audit",description:"Comprehensive security vulnerability assessment",stepCount:3,category:"Security"},{id:"documentation",name:"Documentation Generation",description:"Generate comprehensive project documentation",stepCount:2,category:"Documentation"},{id:"pre-deployment",name:"Pre-deployment Checklist",description:"Comprehensive checks before deployment",stepCount:4,category:"Deployment"}];p=e,E(),console.log(`[WORKFLOW MANAGER] Loaded ${e.length} templates`)}function E(){const e=document.getElementById("templateGrid");e&&(e.innerHTML="",p.forEach(t=>{const o=R(t);e.appendChild(o)}))}function R(e){const t=document.createElement("div");return t.className="template-card",t.innerHTML=`
    <div class="template-card-header">
      <h4 class="template-name">${e.name}</h4>
      <span class="template-category">${e.category}</span>
    </div>
    <div class="template-card-body">
      <p class="template-description">${e.description}</p>
      <div class="template-meta">
        <span class="step-count">${e.stepCount} steps</span>
      </div>
    </div>
    <div class="template-card-actions">
      <button class="btn btn-primary btn-sm" onclick="useTemplate('${e.id}')">
        <span class="btn-icon">📋</span>
        Use Template
      </button>
      <button class="btn btn-outline btn-sm" onclick="previewTemplate('${e.id}')">
        <span class="btn-icon">👁️</span>
        Preview
      </button>
    </div>
  `,t}async function A(){console.log("[WORKFLOW MANAGER] Loading scheduled workflows...");const e=[{id:"scheduled-1",workflowId:"security-check",workflowName:"Security Check",target:"main.js",schedule:"Daily at 9:00 AM",nextRun:"2024-01-15 09:00:00",status:"scheduled"},{id:"scheduled-2",workflowId:"full-code-review",workflowName:"Full Code Review",target:"pages/",schedule:"Weekly on Monday",nextRun:"2024-01-22 10:00:00",status:"scheduled"}];m=e,L(),console.log(`[WORKFLOW MANAGER] Loaded ${e.length} scheduled workflows`)}function L(){const e=document.getElementById("scheduledList");e&&(e.innerHTML="",m.forEach(t=>{const o=C(t);e.appendChild(o)}))}function C(e){const t=document.createElement("div");return t.className="scheduled-card",t.innerHTML=`
    <div class="scheduled-card-header">
      <h4 class="scheduled-workflow-name">${e.workflowName}</h4>
      <div class="scheduled-status status-${e.status}">${e.status}</div>
    </div>
    <div class="scheduled-card-body">
      <div class="scheduled-details">
        <div class="detail-item">
          <span class="detail-label">Target:</span>
          <span class="detail-value">${e.target}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Schedule:</span>
          <span class="detail-value">${e.schedule}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Next Run:</span>
          <span class="detail-value">${e.nextRun}</span>
        </div>
      </div>
    </div>
    <div class="scheduled-card-actions">
      <button class="btn btn-primary btn-sm" onclick="runScheduledNow('${e.id}')">
        <span class="btn-icon">▶️</span>
        Run Now
      </button>
      <button class="btn btn-secondary btn-sm" onclick="editSchedule('${e.id}')">
        <span class="btn-icon">✏️</span>
        Edit
      </button>
      <button class="btn btn-danger btn-sm" onclick="cancelSchedule('${e.id}')">
        <span class="btn-icon">❌</span>
        Cancel
      </button>
    </div>
  `,t}async function O(){console.log("[WORKFLOW MANAGER] Loading workflow history...");const e=[{id:"exec-1",workflowId:"security-check",workflowName:"Security Check",target:"chatbot.js",status:"completed",startTime:"2024-01-14 14:30:00",endTime:"2024-01-14 14:32:15",duration:"2m 15s"},{id:"exec-2",workflowId:"full-code-review",workflowName:"Full Code Review",target:"main.js",status:"failed",startTime:"2024-01-14 13:45:00",endTime:"2024-01-14 13:47:30",duration:"2m 30s"},{id:"exec-3",workflowId:"documentation-only",workflowName:"Documentation Generation",target:"auto-fixer.js",status:"completed",startTime:"2024-01-14 12:15:00",endTime:"2024-01-14 12:18:45",duration:"3m 45s"}];w=e,$(),console.log(`[WORKFLOW MANAGER] Loaded ${e.length} history entries`)}function $(){const e=document.getElementById("historyList");e&&(e.innerHTML="",w.forEach(t=>{const o=S(t);e.appendChild(o)}))}function S(e){const t=document.createElement("div");return t.className="history-card",t.innerHTML=`
    <div class="history-card-header">
      <h4 class="history-workflow-name">${e.workflowName}</h4>
      <div class="history-status status-${e.status}">${e.status}</div>
    </div>
    <div class="history-card-body">
      <div class="history-details">
        <div class="detail-item">
          <span class="detail-label">Target:</span>
          <span class="detail-value">${e.target}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${e.duration}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Started:</span>
          <span class="detail-value">${e.startTime}</span>
        </div>
      </div>
    </div>
    <div class="history-card-actions">
      <button class="btn btn-outline btn-sm" onclick="viewExecutionDetails('${e.id}')">
        <span class="btn-icon">👁️</span>
        View Details
      </button>
      <button class="btn btn-secondary btn-sm" onclick="replayExecution('${e.id}')">
        <span class="btn-icon">🔄</span>
        Replay
      </button>
    </div>
  `,t}async function M(e){console.log(`[WORKFLOW MANAGER] Executing workflow: ${e}`);const t=d.find(o=>o.id===e);if(!t){console.error(`[WORKFLOW MANAGER] Workflow not found: ${e}`);return}N(t);try{await x(e),console.log(`[WORKFLOW MANAGER] Workflow ${e} completed successfully`)}catch(o){console.error(`[WORKFLOW MANAGER] Workflow ${e} failed:`,o)}}function N(e){const t=document.getElementById("workflowExecutionModal");t&&(document.getElementById("executingWorkflowName").textContent=e.name,document.getElementById("executingWorkflowDescription").textContent=e.description,document.getElementById("workflowProgress").style.width="0%",document.getElementById("progressText").textContent="0%",t.style.display="block")}async function x(e){const t=[{name:"Security Scan",duration:2e3},{name:"Code Analysis",duration:3e3},{name:"Auto Fix",duration:1500},{name:"Documentation",duration:2500},{name:"Report Generation",duration:1e3}],o=t.length;let s=0;for(let n=0;n<t.length;n++){const a=t[n];u(n,"running",a.name),await new Promise(c=>setTimeout(c,a.duration)),u(n,"completed",a.name),s++;const l=Math.round(s/o*100);document.getElementById("workflowProgress").style.width=`${l}%`,document.getElementById("progressText").textContent=`${l}%`}G()}function u(e,t,o){const s=document.getElementById("workflowSteps");if(!s)return;let n=s.children[e];n||(n=document.createElement("div"),n.className="workflow-step",n.innerHTML=`
      <div class="step-icon"></div>
      <div class="step-content">
        <div class="step-name">${o}</div>
        <div class="step-status">${t}</div>
      </div>
    `,s.appendChild(n)),n.className=`workflow-step status-${t}`,n.querySelector(".step-status").textContent=t;const a=n.querySelector(".step-icon");a.textContent=t==="completed"?"✅":t==="running"?"⏳":"⏸️"}function G(){const e=document.getElementById("workflowResults"),t=document.getElementById("resultsContent");!e||!t||(t.innerHTML=`
    <div class="result-summary">
      <h5>Execution Summary</h5>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-label">Status:</span>
          <span class="stat-value status-completed">Completed</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Duration:</span>
          <span class="stat-value">10.5 seconds</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Steps:</span>
          <span class="stat-value">5 completed</span>
        </div>
      </div>
    </div>
    <div class="result-details">
      <h5>Detailed Results</h5>
      <div class="result-item">
        <strong>Security Scan:</strong> No vulnerabilities found
      </div>
      <div class="result-item">
        <strong>Code Analysis:</strong> 3 issues identified and fixed
      </div>
      <div class="result-item">
        <strong>Auto Fix:</strong> 2 fixes applied successfully
      </div>
      <div class="result-item">
        <strong>Documentation:</strong> Generated comprehensive docs
      </div>
      <div class="result-item">
        <strong>Report:</strong> Summary report created
      </div>
    </div>
  `,e.style.display="block")}function F(){const e=document.getElementById("createWorkflowModal");e&&(e.style.display="block")}function v(){const e=document.getElementById("createWorkflowModal");e&&(e.style.display="none")}function T(){const e=document.getElementById("stepsContainer");if(!e)return;const t=e.children.length,o=document.createElement("div");o.className="workflow-step-form",o.innerHTML=`
    <div class="step-form-header">
      <h5>Step ${t+1}</h5>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeWorkflowStep(this)">
        <span class="btn-icon">❌</span>
        Remove
      </button>
    </div>
    <div class="step-form-body">
      <div class="form-group">
        <label>Agent</label>
        <select name="agent" required>
          <option value="">Select Agent</option>
          <option value="code-analyzer">Code Analyzer</option>
          <option value="security-scanner">Security Scanner</option>
          <option value="auto-fixer">Auto Fixer</option>
          <option value="documentation-generator">Documentation Generator</option>
          <option value="report-generator">Report Generator</option>
        </select>
      </div>
      <div class="form-group">
        <label>Target</label>
        <select name="target" required>
          <option value="">Select Target</option>
          <option value="file">File</option>
          <option value="project">Project</option>
          <option value="workflow">Workflow</option>
        </select>
      </div>
      <div class="form-group">
        <label>Dependencies (optional)</label>
        <input type="text" name="dependsOn" placeholder="Step IDs separated by commas">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" name="required" checked>
          Required Step
        </label>
      </div>
    </div>
  `,e.appendChild(o)}function B(e){const t=e.closest(".workflow-step-form");t&&t.remove()}function I(e){e.preventDefault(),new FormData(e.target);const t=document.getElementById("workflowName").value,o=document.getElementById("workflowDescription").value,s=[];if(document.querySelectorAll(".workflow-step-form").forEach((l,c)=>{const i={id:`step-${c+1}`,agent:l.querySelector('[name="agent"]').value,target:l.querySelector('[name="target"]').value,dependsOn:l.querySelector('[name="dependsOn"]').value.split(",").map(r=>r.trim()).filter(r=>r),required:l.querySelector('[name="required"]').checked};i.agent&&i.target&&s.push(i)}),s.length===0){alert("Please add at least one step to the workflow");return}const a={id:`custom-${Date.now()}`,name:t,description:o,steps:s,stepCount:s.length,status:"available"};d.push(a),f(),v(),console.log(`[WORKFLOW MANAGER] Created custom workflow: ${a.id}`)}function D(){const e=document.getElementById("scheduleWorkflowModal");e&&(e.style.display="block")}window.executeWorkflow=M;window.scheduleWorkflow=e=>{console.log(`[WORKFLOW MANAGER] Scheduling workflow: ${e}`)};window.viewWorkflowDetails=e=>{console.log(`[WORKFLOW MANAGER] Viewing workflow details: ${e}`)};window.useTemplate=e=>{console.log(`[WORKFLOW MANAGER] Using template: ${e}`)};window.previewTemplate=e=>{console.log(`[WORKFLOW MANAGER] Previewing template: ${e}`)};window.runScheduledNow=e=>{console.log(`[WORKFLOW MANAGER] Running scheduled workflow now: ${e}`)};window.editSchedule=e=>{console.log(`[WORKFLOW MANAGER] Editing schedule: ${e}`)};window.cancelSchedule=e=>{console.log(`[WORKFLOW MANAGER] Canceling schedule: ${e}`)};window.viewExecutionDetails=e=>{console.log(`[WORKFLOW MANAGER] Viewing execution details: ${e}`)};window.replayExecution=e=>{console.log(`[WORKFLOW MANAGER] Replaying execution: ${e}`)};window.removeWorkflowStep=B;document.addEventListener("DOMContentLoaded",()=>{console.log("[WORKFLOW MANAGER] DOM loaded, initializing workflow manager..."),g()});console.log("[WORKFLOW MANAGER] Workflow manager functionality loaded");
