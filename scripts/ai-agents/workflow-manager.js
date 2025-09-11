#!/usr/bin/env node

/**
 * Workflow Manager
 * Manages workflow definitions, scheduling, and monitoring
 */

import fs from "fs";
import path from "path";

class WorkflowManager {
  constructor() {
    this.workflowDefinitions = new Map();
    this.scheduledWorkflows = new Map();
    this.workflowTemplates = new Map();

    this.loadWorkflowTemplates();
    console.log("[WORKFLOW MANAGER] Workflow manager initialized");
  }

  loadWorkflowTemplates() {
    console.log("[WORKFLOW MANAGER] Loading workflow templates...");

    // Code Quality Workflow Template
    this.workflowTemplates.set("code-quality", {
      name: "Code Quality Check",
      description: "Comprehensive code quality analysis and improvement",
      steps: [
        {
          id: "analyze",
          agent: "code-analyzer",
          target: "file",
          parallel: false,
          required: true,
          config: {
            focusAreas: ["performance", "maintainability", "readability"],
          },
        },
        {
          id: "fix",
          agent: "auto-fixer",
          target: "file",
          parallel: false,
          dependsOn: ["analyze"],
          required: false,
          config: {
            autoApply: false,
            createBackup: true,
          },
        },
        {
          id: "document",
          agent: "documentation-generator",
          target: "file",
          parallel: false,
          dependsOn: ["fix"],
          required: false,
        },
      ],
    });

    // Security Audit Template
    this.workflowTemplates.set("security-audit", {
      name: "Security Audit",
      description: "Comprehensive security vulnerability assessment",
      steps: [
        {
          id: "scan",
          agent: "security-scanner",
          target: "file",
          parallel: false,
          required: true,
          config: {
            scanTypes: ["vulnerabilities", "secrets", "insecure-patterns"],
          },
        },
        {
          id: "fix-security",
          agent: "auto-fixer",
          target: "file",
          parallel: false,
          dependsOn: ["scan"],
          required: false,
          config: {
            focusOn: "security",
            autoApply: false,
          },
        },
        {
          id: "report",
          agent: "report-generator",
          target: "workflow",
          parallel: false,
          dependsOn: ["scan", "fix-security"],
          required: true,
        },
      ],
    });

    // Documentation Generation Template
    this.workflowTemplates.set("documentation", {
      name: "Documentation Generation",
      description: "Generate comprehensive project documentation",
      steps: [
        {
          id: "analyze-structure",
          agent: "code-analyzer",
          target: "project",
          parallel: false,
          required: true,
          config: {
            analyzeStructure: true,
          },
        },
        {
          id: "generate-docs",
          agent: "documentation-generator",
          target: "project",
          parallel: false,
          dependsOn: ["analyze-structure"],
          required: true,
          config: {
            outputFormat: "markdown",
            includeExamples: true,
          },
        },
      ],
    });

    // Pre-deployment Checklist Template
    this.workflowTemplates.set("pre-deployment", {
      name: "Pre-deployment Checklist",
      description: "Comprehensive checks before deployment",
      steps: [
        {
          id: "security-check",
          agent: "security-scanner",
          target: "project",
          parallel: false,
          required: true,
        },
        {
          id: "code-quality",
          agent: "code-analyzer",
          target: "project",
          parallel: true,
          required: true,
        },
        {
          id: "auto-fix",
          agent: "auto-fixer",
          target: "project",
          parallel: false,
          dependsOn: ["security-check", "code-quality"],
          required: false,
        },
        {
          id: "final-report",
          agent: "report-generator",
          target: "workflow",
          parallel: false,
          dependsOn: ["security-check", "code-quality", "auto-fix"],
          required: true,
        },
      ],
    });

    console.log(
      `[WORKFLOW MANAGER] Loaded ${this.workflowTemplates.size} workflow templates`
    );
  }

  createWorkflowFromTemplate(templateId, customizations = {}) {
    const template = this.workflowTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const workflow = {
      ...template,
      ...customizations,
      id: customizations.id || `${templateId}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.workflowDefinitions.set(workflow.id, workflow);
    console.log(
      `[WORKFLOW MANAGER] Created workflow from template: ${workflow.id}`
    );
    return workflow;
  }

  createCustomWorkflow(definition) {
    const workflow = {
      id: definition.id || `custom-${Date.now()}`,
      name: definition.name,
      description: definition.description,
      steps: definition.steps,
      createdAt: new Date().toISOString(),
      ...definition,
    };

    // Validate workflow
    this.validateWorkflow(workflow);

    this.workflowDefinitions.set(workflow.id, workflow);
    console.log(`[WORKFLOW MANAGER] Created custom workflow: ${workflow.id}`);
    return workflow;
  }

  validateWorkflow(workflow) {
    if (!workflow.name || !workflow.steps || !Array.isArray(workflow.steps)) {
      throw new Error("Invalid workflow: missing required fields");
    }

    // Check for circular dependencies
    const stepIds = new Set(workflow.steps.map((s) => s.id));
    for (const step of workflow.steps) {
      if (step.dependsOn) {
        for (const dep of step.dependsOn) {
          if (!stepIds.has(dep)) {
            throw new Error(
              `Workflow validation failed: step ${step.id} depends on non-existent step ${dep}`
            );
          }
        }
      }
    }

    console.log(
      `[WORKFLOW MANAGER] Workflow validation passed: ${workflow.id}`
    );
  }

  scheduleWorkflow(workflowId, target, schedule) {
    const workflow = this.workflowDefinitions.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const scheduledWorkflow = {
      id: `scheduled-${Date.now()}`,
      workflowId,
      target,
      schedule,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      nextRun: this.calculateNextRun(schedule),
    };

    this.scheduledWorkflows.set(scheduledWorkflow.id, scheduledWorkflow);
    console.log(
      `[WORKFLOW MANAGER] Scheduled workflow: ${scheduledWorkflow.id}`
    );
    return scheduledWorkflow;
  }

  calculateNextRun(schedule) {
    const now = new Date();

    switch (schedule.type) {
      case "interval":
        return new Date(now.getTime() + schedule.interval);
      case "cron":
        // Simple cron-like scheduling (would need a proper cron parser in production)
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours
      case "once":
        return new Date(schedule.datetime);
      default:
        throw new Error(`Unknown schedule type: ${schedule.type}`);
    }
  }

  getDueWorkflows() {
    const now = new Date();
    const due = [];

    for (const [id, scheduled] of this.scheduledWorkflows.entries()) {
      if (
        scheduled.status === "scheduled" &&
        new Date(scheduled.nextRun) <= now
      ) {
        due.push(scheduled);
      }
    }

    return due;
  }

  updateScheduledWorkflow(id, updates) {
    const scheduled = this.scheduledWorkflows.get(id);
    if (!scheduled) {
      throw new Error(`Scheduled workflow not found: ${id}`);
    }

    Object.assign(scheduled, updates);
    this.scheduledWorkflows.set(id, scheduled);
    console.log(`[WORKFLOW MANAGER] Updated scheduled workflow: ${id}`);
    return scheduled;
  }

  getWorkflowDefinitions() {
    return Array.from(this.workflowDefinitions.values());
  }

  getWorkflowTemplates() {
    return Array.from(this.workflowTemplates.values());
  }

  getScheduledWorkflows() {
    return Array.from(this.scheduledWorkflows.values());
  }

  deleteWorkflow(workflowId) {
    if (this.workflowDefinitions.has(workflowId)) {
      this.workflowDefinitions.delete(workflowId);
      console.log(`[WORKFLOW MANAGER] Deleted workflow: ${workflowId}`);
      return true;
    }
    return false;
  }

  exportWorkflow(workflowId) {
    const workflow = this.workflowDefinitions.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const exportData = {
      ...workflow,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    };

    return exportData;
  }

  importWorkflow(workflowData) {
    const workflow = {
      ...workflowData,
      id: workflowData.id || `imported-${Date.now()}`,
      importedAt: new Date().toISOString(),
    };

    this.validateWorkflow(workflow);
    this.workflowDefinitions.set(workflow.id, workflow);
    console.log(`[WORKFLOW MANAGER] Imported workflow: ${workflow.id}`);
    return workflow;
  }

  // Save workflows to file
  saveWorkflows(filePath = "workflows.json") {
    const data = {
      workflows: Array.from(this.workflowDefinitions.values()),
      scheduled: Array.from(this.scheduledWorkflows.values()),
      exportedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[WORKFLOW MANAGER] Workflows saved to: ${filePath}`);
  }

  // Load workflows from file
  loadWorkflows(filePath = "workflows.json") {
    if (!fs.existsSync(filePath)) {
      console.log(`[WORKFLOW MANAGER] No workflow file found: ${filePath}`);
      return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (data.workflows) {
      data.workflows.forEach((workflow) => {
        this.workflowDefinitions.set(workflow.id, workflow);
      });
    }

    if (data.scheduled) {
      data.scheduled.forEach((scheduled) => {
        this.scheduledWorkflows.set(scheduled.id, scheduled);
      });
    }

    console.log(`[WORKFLOW MANAGER] Loaded workflows from: ${filePath}`);
  }
}

export default WorkflowManager;

// Run workflow manager if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new WorkflowManager();

  console.log("[WORKFLOW MANAGER] Available templates:");
  console.log(JSON.stringify(manager.getWorkflowTemplates(), null, 2));

  // Create a custom workflow
  const customWorkflow = manager.createCustomWorkflow({
    name: "Custom Code Review",
    description: "Custom workflow for code review",
    steps: [
      {
        id: "analyze",
        agent: "code-analyzer",
        target: "file",
        required: true,
      },
      {
        id: "report",
        agent: "report-generator",
        target: "workflow",
        dependsOn: ["analyze"],
        required: true,
      },
    ],
  });

  console.log("\n[WORKFLOW MANAGER] Created custom workflow:");
  console.log(JSON.stringify(customWorkflow, null, 2));
}
