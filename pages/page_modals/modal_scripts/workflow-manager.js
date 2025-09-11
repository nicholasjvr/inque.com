console.log("[WORKFLOW MANAGER] Initializing workflow manager...");

// Workflow Manager state
let currentWorkflows = [];
let currentTemplates = [];
let currentScheduled = [];
let currentHistory = [];
let activeWorkflows = new Map();

// Initialize workflow manager
function initializeWorkflowManager() {
  console.log("[WORKFLOW MANAGER] Initializing workflow manager components...");

  // Set up tab switching
  setupTabSwitching();

  // Set up event listeners
  setupEventListeners();

  // Load initial data
  loadWorkflows();
  loadTemplates();
  loadScheduled();
  loadHistory();

  console.log("[WORKFLOW MANAGER] Workflow manager initialized successfully");
}

// Tab switching functionality
function setupTabSwitching() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      document.getElementById(`${targetTab}-tab`).classList.add("active");

      console.log(`[WORKFLOW MANAGER] Switched to tab: ${targetTab}`);
    });
  });
}

// Event listeners setup
function setupEventListeners() {
  // Create workflow button
  const createWorkflowBtn = document.getElementById("createWorkflowBtn");
  if (createWorkflowBtn) {
    createWorkflowBtn.addEventListener("click", openCreateWorkflowModal);
  }

  // Schedule workflow button
  const scheduleWorkflowBtn = document.getElementById("scheduleWorkflowBtn");
  if (scheduleWorkflowBtn) {
    scheduleWorkflowBtn.addEventListener("click", openScheduleWorkflowModal);
  }

  // Create workflow form
  const createWorkflowForm = document.getElementById("createWorkflowForm");
  if (createWorkflowForm) {
    createWorkflowForm.addEventListener("submit", handleCreateWorkflow);
  }

  // Add step button
  const addStepBtn = document.getElementById("addStepBtn");
  if (addStepBtn) {
    addStepBtn.addEventListener("click", addWorkflowStep);
  }

  // Cancel create workflow
  const cancelCreateWorkflow = document.getElementById("cancelCreateWorkflow");
  if (cancelCreateWorkflow) {
    cancelCreateWorkflow.addEventListener("click", closeCreateWorkflowModal);
  }

  // Close buttons
  const closeButtons = document.querySelectorAll(".close-button");
  closeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      if (modal) {
        modal.style.display = "none";
      }
    });
  });
}

// Load workflows
async function loadWorkflows() {
  console.log("[WORKFLOW MANAGER] Loading workflows...");

  try {
    // Simulate loading workflows (in real implementation, this would call the orchestrator)
    const workflows = [
      {
        id: "full-code-review",
        name: "Full Code Review",
        description:
          "Comprehensive code analysis, security scan, auto-fix, and documentation",
        stepCount: 5,
        status: "available",
      },
      {
        id: "security-check",
        name: "Security Check",
        description: "Quick security vulnerability scan",
        stepCount: 2,
        status: "available",
      },
      {
        id: "documentation-only",
        name: "Documentation Generation",
        description: "Generate comprehensive documentation for code",
        stepCount: 2,
        status: "available",
      },
    ];

    currentWorkflows = workflows;
    renderWorkflows();
    console.log(`[WORKFLOW MANAGER] Loaded ${workflows.length} workflows`);
  } catch (error) {
    console.error("[WORKFLOW MANAGER] Error loading workflows:", error);
  }
}

// Render workflows
function renderWorkflows() {
  const workflowList = document.getElementById("workflowList");
  if (!workflowList) return;

  workflowList.innerHTML = "";

  currentWorkflows.forEach((workflow) => {
    const workflowCard = createWorkflowCard(workflow);
    workflowList.appendChild(workflowCard);
  });
}

// Create workflow card
function createWorkflowCard(workflow) {
  const card = document.createElement("div");
  card.className = "workflow-card";
  card.innerHTML = `
    <div class="workflow-card-header">
      <h4 class="workflow-name">${workflow.name}</h4>
      <div class="workflow-status status-${workflow.status}">${workflow.status}</div>
    </div>
    <div class="workflow-card-body">
      <p class="workflow-description">${workflow.description}</p>
      <div class="workflow-meta">
        <span class="step-count">${workflow.stepCount} steps</span>
        <span class="workflow-id">ID: ${workflow.id}</span>
      </div>
    </div>
    <div class="workflow-card-actions">
      <button class="btn btn-primary btn-sm" onclick="executeWorkflow('${workflow.id}')">
        <span class="btn-icon">▶️</span>
        Execute
      </button>
      <button class="btn btn-secondary btn-sm" onclick="scheduleWorkflow('${workflow.id}')">
        <span class="btn-icon">⏰</span>
        Schedule
      </button>
      <button class="btn btn-outline btn-sm" onclick="viewWorkflowDetails('${workflow.id}')">
        <span class="btn-icon">👁️</span>
        Details
      </button>
    </div>
  `;
  return card;
}

// Load templates
async function loadTemplates() {
  console.log("[WORKFLOW MANAGER] Loading templates...");

  const templates = [
    {
      id: "code-quality",
      name: "Code Quality Check",
      description: "Comprehensive code quality analysis and improvement",
      stepCount: 3,
      category: "Quality",
    },
    {
      id: "security-audit",
      name: "Security Audit",
      description: "Comprehensive security vulnerability assessment",
      stepCount: 3,
      category: "Security",
    },
    {
      id: "documentation",
      name: "Documentation Generation",
      description: "Generate comprehensive project documentation",
      stepCount: 2,
      category: "Documentation",
    },
    {
      id: "pre-deployment",
      name: "Pre-deployment Checklist",
      description: "Comprehensive checks before deployment",
      stepCount: 4,
      category: "Deployment",
    },
  ];

  currentTemplates = templates;
  renderTemplates();
  console.log(`[WORKFLOW MANAGER] Loaded ${templates.length} templates`);
}

// Render templates
function renderTemplates() {
  const templateGrid = document.getElementById("templateGrid");
  if (!templateGrid) return;

  templateGrid.innerHTML = "";

  currentTemplates.forEach((template) => {
    const templateCard = createTemplateCard(template);
    templateGrid.appendChild(templateCard);
  });
}

// Create template card
function createTemplateCard(template) {
  const card = document.createElement("div");
  card.className = "template-card";
  card.innerHTML = `
    <div class="template-card-header">
      <h4 class="template-name">${template.name}</h4>
      <span class="template-category">${template.category}</span>
    </div>
    <div class="template-card-body">
      <p class="template-description">${template.description}</p>
      <div class="template-meta">
        <span class="step-count">${template.stepCount} steps</span>
      </div>
    </div>
    <div class="template-card-actions">
      <button class="btn btn-primary btn-sm" onclick="useTemplate('${template.id}')">
        <span class="btn-icon">📋</span>
        Use Template
      </button>
      <button class="btn btn-outline btn-sm" onclick="previewTemplate('${template.id}')">
        <span class="btn-icon">👁️</span>
        Preview
      </button>
    </div>
  `;
  return card;
}

// Load scheduled workflows
async function loadScheduled() {
  console.log("[WORKFLOW MANAGER] Loading scheduled workflows...");

  // Simulate scheduled workflows
  const scheduled = [
    {
      id: "scheduled-1",
      workflowId: "security-check",
      workflowName: "Security Check",
      target: "main.js",
      schedule: "Daily at 9:00 AM",
      nextRun: "2024-01-15 09:00:00",
      status: "scheduled",
    },
    {
      id: "scheduled-2",
      workflowId: "full-code-review",
      workflowName: "Full Code Review",
      target: "pages/",
      schedule: "Weekly on Monday",
      nextRun: "2024-01-22 10:00:00",
      status: "scheduled",
    },
  ];

  currentScheduled = scheduled;
  renderScheduled();
  console.log(
    `[WORKFLOW MANAGER] Loaded ${scheduled.length} scheduled workflows`
  );
}

// Render scheduled workflows
function renderScheduled() {
  const scheduledList = document.getElementById("scheduledList");
  if (!scheduledList) return;

  scheduledList.innerHTML = "";

  currentScheduled.forEach((scheduled) => {
    const scheduledCard = createScheduledCard(scheduled);
    scheduledList.appendChild(scheduledCard);
  });
}

// Create scheduled card
function createScheduledCard(scheduled) {
  const card = document.createElement("div");
  card.className = "scheduled-card";
  card.innerHTML = `
    <div class="scheduled-card-header">
      <h4 class="scheduled-workflow-name">${scheduled.workflowName}</h4>
      <div class="scheduled-status status-${scheduled.status}">${scheduled.status}</div>
    </div>
    <div class="scheduled-card-body">
      <div class="scheduled-details">
        <div class="detail-item">
          <span class="detail-label">Target:</span>
          <span class="detail-value">${scheduled.target}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Schedule:</span>
          <span class="detail-value">${scheduled.schedule}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Next Run:</span>
          <span class="detail-value">${scheduled.nextRun}</span>
        </div>
      </div>
    </div>
    <div class="scheduled-card-actions">
      <button class="btn btn-primary btn-sm" onclick="runScheduledNow('${scheduled.id}')">
        <span class="btn-icon">▶️</span>
        Run Now
      </button>
      <button class="btn btn-secondary btn-sm" onclick="editSchedule('${scheduled.id}')">
        <span class="btn-icon">✏️</span>
        Edit
      </button>
      <button class="btn btn-danger btn-sm" onclick="cancelSchedule('${scheduled.id}')">
        <span class="btn-icon">❌</span>
        Cancel
      </button>
    </div>
  `;
  return card;
}

// Load history
async function loadHistory() {
  console.log("[WORKFLOW MANAGER] Loading workflow history...");

  // Simulate workflow history
  const history = [
    {
      id: "exec-1",
      workflowId: "security-check",
      workflowName: "Security Check",
      target: "chatbot.js",
      status: "completed",
      startTime: "2024-01-14 14:30:00",
      endTime: "2024-01-14 14:32:15",
      duration: "2m 15s",
    },
    {
      id: "exec-2",
      workflowId: "full-code-review",
      workflowName: "Full Code Review",
      target: "main.js",
      status: "failed",
      startTime: "2024-01-14 13:45:00",
      endTime: "2024-01-14 13:47:30",
      duration: "2m 30s",
    },
    {
      id: "exec-3",
      workflowId: "documentation-only",
      workflowName: "Documentation Generation",
      target: "auto-fixer.js",
      status: "completed",
      startTime: "2024-01-14 12:15:00",
      endTime: "2024-01-14 12:18:45",
      duration: "3m 45s",
    },
  ];

  currentHistory = history;
  renderHistory();
  console.log(`[WORKFLOW MANAGER] Loaded ${history.length} history entries`);
}

// Render history
function renderHistory() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  historyList.innerHTML = "";

  currentHistory.forEach((entry) => {
    const historyCard = createHistoryCard(entry);
    historyList.appendChild(historyCard);
  });
}

// Create history card
function createHistoryCard(entry) {
  const card = document.createElement("div");
  card.className = "history-card";
  card.innerHTML = `
    <div class="history-card-header">
      <h4 class="history-workflow-name">${entry.workflowName}</h4>
      <div class="history-status status-${entry.status}">${entry.status}</div>
    </div>
    <div class="history-card-body">
      <div class="history-details">
        <div class="detail-item">
          <span class="detail-label">Target:</span>
          <span class="detail-value">${entry.target}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${entry.duration}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Started:</span>
          <span class="detail-value">${entry.startTime}</span>
        </div>
      </div>
    </div>
    <div class="history-card-actions">
      <button class="btn btn-outline btn-sm" onclick="viewExecutionDetails('${entry.id}')">
        <span class="btn-icon">👁️</span>
        View Details
      </button>
      <button class="btn btn-secondary btn-sm" onclick="replayExecution('${entry.id}')">
        <span class="btn-icon">🔄</span>
        Replay
      </button>
    </div>
  `;
  return card;
}

// Execute workflow
async function executeWorkflow(workflowId) {
  console.log(`[WORKFLOW MANAGER] Executing workflow: ${workflowId}`);

  const workflow = currentWorkflows.find((w) => w.id === workflowId);
  if (!workflow) {
    console.error(`[WORKFLOW MANAGER] Workflow not found: ${workflowId}`);
    return;
  }

  // Open execution modal
  openWorkflowExecutionModal(workflow);

  // Simulate workflow execution
  try {
    await simulateWorkflowExecution(workflowId);
    console.log(
      `[WORKFLOW MANAGER] Workflow ${workflowId} completed successfully`
    );
  } catch (error) {
    console.error(`[WORKFLOW MANAGER] Workflow ${workflowId} failed:`, error);
  }
}

// Open workflow execution modal
function openWorkflowExecutionModal(workflow) {
  const modal = document.getElementById("workflowExecutionModal");
  if (!modal) return;

  // Update modal content
  document.getElementById("executingWorkflowName").textContent = workflow.name;
  document.getElementById("executingWorkflowDescription").textContent =
    workflow.description;

  // Reset progress
  document.getElementById("workflowProgress").style.width = "0%";
  document.getElementById("progressText").textContent = "0%";

  // Show modal
  modal.style.display = "block";
}

// Simulate workflow execution
async function simulateWorkflowExecution(workflowId) {
  const steps = [
    { name: "Security Scan", duration: 2000 },
    { name: "Code Analysis", duration: 3000 },
    { name: "Auto Fix", duration: 1500 },
    { name: "Documentation", duration: 2500 },
    { name: "Report Generation", duration: 1000 },
  ];

  const totalSteps = steps.length;
  let completedSteps = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Update step status
    updateWorkflowStep(i, "running", step.name);

    // Simulate step execution
    await new Promise((resolve) => setTimeout(resolve, step.duration));

    // Mark step as completed
    updateWorkflowStep(i, "completed", step.name);
    completedSteps++;

    // Update progress
    const progress = Math.round((completedSteps / totalSteps) * 100);
    document.getElementById("workflowProgress").style.width = `${progress}%`;
    document.getElementById("progressText").textContent = `${progress}%`;
  }

  // Show results
  showWorkflowResults();
}

// Update workflow step
function updateWorkflowStep(index, status, name) {
  const stepsContainer = document.getElementById("workflowSteps");
  if (!stepsContainer) return;

  // Create step element if it doesn't exist
  let stepElement = stepsContainer.children[index];
  if (!stepElement) {
    stepElement = document.createElement("div");
    stepElement.className = "workflow-step";
    stepElement.innerHTML = `
      <div class="step-icon"></div>
      <div class="step-content">
        <div class="step-name">${name}</div>
        <div class="step-status">${status}</div>
      </div>
    `;
    stepsContainer.appendChild(stepElement);
  }

  // Update step status
  stepElement.className = `workflow-step status-${status}`;
  stepElement.querySelector(".step-status").textContent = status;

  // Update icon
  const icon = stepElement.querySelector(".step-icon");
  icon.textContent =
    status === "completed" ? "✅" : status === "running" ? "⏳" : "⏸️";
}

// Show workflow results
function showWorkflowResults() {
  const resultsContainer = document.getElementById("workflowResults");
  const resultsContent = document.getElementById("resultsContent");

  if (!resultsContainer || !resultsContent) return;

  resultsContent.innerHTML = `
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
  `;

  resultsContainer.style.display = "block";
}

// Open create workflow modal
function openCreateWorkflowModal() {
  const modal = document.getElementById("createWorkflowModal");
  if (modal) {
    modal.style.display = "block";
  }
}

// Close create workflow modal
function closeCreateWorkflowModal() {
  const modal = document.getElementById("createWorkflowModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Add workflow step
function addWorkflowStep() {
  const stepsContainer = document.getElementById("stepsContainer");
  if (!stepsContainer) return;

  const stepIndex = stepsContainer.children.length;
  const stepElement = document.createElement("div");
  stepElement.className = "workflow-step-form";
  stepElement.innerHTML = `
    <div class="step-form-header">
      <h5>Step ${stepIndex + 1}</h5>
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
  `;

  stepsContainer.appendChild(stepElement);
}

// Remove workflow step
function removeWorkflowStep(button) {
  const stepElement = button.closest(".workflow-step-form");
  if (stepElement) {
    stepElement.remove();
  }
}

// Handle create workflow form submission
function handleCreateWorkflow(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const workflowName = document.getElementById("workflowName").value;
  const workflowDescription = document.getElementById(
    "workflowDescription"
  ).value;

  // Collect steps
  const steps = [];
  const stepElements = document.querySelectorAll(".workflow-step-form");

  stepElements.forEach((stepElement, index) => {
    const stepData = {
      id: `step-${index + 1}`,
      agent: stepElement.querySelector('[name="agent"]').value,
      target: stepElement.querySelector('[name="target"]').value,
      dependsOn: stepElement
        .querySelector('[name="dependsOn"]')
        .value.split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      required: stepElement.querySelector('[name="required"]').checked,
    };

    if (stepData.agent && stepData.target) {
      steps.push(stepData);
    }
  });

  if (steps.length === 0) {
    alert("Please add at least one step to the workflow");
    return;
  }

  // Create workflow
  const workflow = {
    id: `custom-${Date.now()}`,
    name: workflowName,
    description: workflowDescription,
    steps: steps,
    stepCount: steps.length,
    status: "available",
  };

  // Add to workflows
  currentWorkflows.push(workflow);
  renderWorkflows();

  // Close modal
  closeCreateWorkflowModal();

  console.log(`[WORKFLOW MANAGER] Created custom workflow: ${workflow.id}`);
}

// Global functions for onclick handlers
window.executeWorkflow = executeWorkflow;
window.scheduleWorkflow = (workflowId) => {
  console.log(`[WORKFLOW MANAGER] Scheduling workflow: ${workflowId}`);
  // Implementation for scheduling workflow
};
window.viewWorkflowDetails = (workflowId) => {
  console.log(`[WORKFLOW MANAGER] Viewing workflow details: ${workflowId}`);
  // Implementation for viewing workflow details
};
window.useTemplate = (templateId) => {
  console.log(`[WORKFLOW MANAGER] Using template: ${templateId}`);
  // Implementation for using template
};
window.previewTemplate = (templateId) => {
  console.log(`[WORKFLOW MANAGER] Previewing template: ${templateId}`);
  // Implementation for previewing template
};
window.runScheduledNow = (scheduledId) => {
  console.log(
    `[WORKFLOW MANAGER] Running scheduled workflow now: ${scheduledId}`
  );
  // Implementation for running scheduled workflow
};
window.editSchedule = (scheduledId) => {
  console.log(`[WORKFLOW MANAGER] Editing schedule: ${scheduledId}`);
  // Implementation for editing schedule
};
window.cancelSchedule = (scheduledId) => {
  console.log(`[WORKFLOW MANAGER] Canceling schedule: ${scheduledId}`);
  // Implementation for canceling schedule
};
window.viewExecutionDetails = (executionId) => {
  console.log(`[WORKFLOW MANAGER] Viewing execution details: ${executionId}`);
  // Implementation for viewing execution details
};
window.replayExecution = (executionId) => {
  console.log(`[WORKFLOW MANAGER] Replaying execution: ${executionId}`);
  // Implementation for replaying execution
};
window.removeWorkflowStep = removeWorkflowStep;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "[WORKFLOW MANAGER] DOM loaded, initializing workflow manager..."
  );
  initializeWorkflowManager();
});

console.log("[WORKFLOW MANAGER] Workflow manager functionality loaded");
