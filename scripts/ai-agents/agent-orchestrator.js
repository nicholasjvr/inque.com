#!/usr/bin/env node

/**
 * AI Agent Orchestrator
 * Coordinates multiple AI agents to execute complex workflows
 */

import { AI_CONFIG } from "../../config/ai-config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// Import existing agents
import AutoFixer from "./auto-fixer.js";
import CodeAnalyzer from "./code-analyzer.js";
import SecurityScanner from "./security-scanner.js";
import DocumentationGenerator from "./documentation-generator.js";
import ReportGenerator from "./generate-report.js";

class AgentOrchestrator {
  constructor(options = {}) {
    this.agents = new Map();
    this.workflows = new Map();
    this.activeWorkflows = new Map();
    this.agentResults = new Map();
    this.workflowHistory = [];

    this.initializeAgents();
    this.defineWorkflows();

    console.log("[ORCHESTRATOR] Agent orchestrator initialized successfully");
  }

  initializeAgents() {
    console.log("[ORCHESTRATOR] Initializing AI agents...");

    // Initialize all available agents
    this.agents.set("auto-fixer", new AutoFixer());
    this.agents.set("code-analyzer", new CodeAnalyzer());
    this.agents.set("security-scanner", new SecurityScanner());
    this.agents.set("documentation-generator", new DocumentationGenerator());
    this.agents.set("report-generator", new ReportGenerator());

    console.log(`[ORCHESTRATOR] Initialized ${this.agents.size} agents`);
  }

  defineWorkflows() {
    console.log("[ORCHESTRATOR] Defining standard workflows...");

    // Full Code Review Workflow
    this.workflows.set("full-code-review", {
      name: "Full Code Review",
      description:
        "Comprehensive code analysis, security scan, auto-fix, and documentation",
      steps: [
        {
          id: "security-scan",
          agent: "security-scanner",
          target: "file",
          parallel: false,
          required: true,
        },
        {
          id: "code-analysis",
          agent: "code-analyzer",
          target: "file",
          parallel: true,
          required: true,
        },
        {
          id: "auto-fix",
          agent: "auto-fixer",
          target: "file",
          parallel: false,
          dependsOn: ["security-scan", "code-analysis"],
          required: false,
        },
        {
          id: "documentation",
          agent: "documentation-generator",
          target: "file",
          parallel: false,
          dependsOn: ["auto-fix"],
          required: false,
        },
        {
          id: "report",
          agent: "report-generator",
          target: "workflow",
          parallel: false,
          dependsOn: ["security-scan", "code-analysis", "auto-fix"],
          required: true,
        },
      ],
    });

    // Quick Security Check Workflow
    this.workflows.set("security-check", {
      name: "Security Check",
      description: "Quick security vulnerability scan",
      steps: [
        {
          id: "security-scan",
          agent: "security-scanner",
          target: "file",
          parallel: false,
          required: true,
        },
        {
          id: "report",
          agent: "report-generator",
          target: "workflow",
          parallel: false,
          dependsOn: ["security-scan"],
          required: true,
        },
      ],
    });

    // Documentation Generation Workflow
    this.workflows.set("documentation-only", {
      name: "Documentation Generation",
      description: "Generate comprehensive documentation for code",
      steps: [
        {
          id: "code-analysis",
          agent: "code-analyzer",
          target: "file",
          parallel: false,
          required: false,
        },
        {
          id: "documentation",
          agent: "documentation-generator",
          target: "file",
          parallel: false,
          dependsOn: ["code-analysis"],
          required: true,
        },
      ],
    });

    // Bug Investigation Workflow
    this.workflows.set("bug-investigation", {
      name: "Bug Investigation",
      description: "Analyze code for potential bugs and issues",
      steps: [
        {
          id: "code-analysis",
          agent: "code-analyzer",
          target: "file",
          parallel: false,
          required: true,
        },
        {
          id: "security-scan",
          agent: "security-scanner",
          target: "file",
          parallel: true,
          required: false,
        },
        {
          id: "auto-fix",
          agent: "auto-fixer",
          target: "file",
          parallel: false,
          dependsOn: ["code-analysis", "security-scan"],
          required: false,
        },
        {
          id: "report",
          agent: "report-generator",
          target: "workflow",
          parallel: false,
          dependsOn: ["code-analysis", "security-scan", "auto-fix"],
          required: true,
        },
      ],
    });

    // Project Analysis Workflow
    this.workflows.set("project-analysis", {
      name: "Project Analysis",
      description: "Comprehensive analysis of entire project",
      steps: [
        {
          id: "code-analysis",
          agent: "code-analyzer",
          target: "project",
          parallel: false,
          required: true,
        },
        {
          id: "security-scan",
          agent: "security-scanner",
          target: "project",
          parallel: true,
          required: true,
        },
        {
          id: "documentation",
          agent: "documentation-generator",
          target: "project",
          parallel: false,
          dependsOn: ["code-analysis"],
          required: false,
        },
        {
          id: "report",
          agent: "report-generator",
          target: "workflow",
          parallel: false,
          dependsOn: ["code-analysis", "security-scan", "documentation"],
          required: true,
        },
      ],
    });

    console.log(`[ORCHESTRATOR] Defined ${this.workflows.size} workflows`);
  }

  async executeWorkflow(workflowId, target, options = {}) {
    console.log(`[ORCHESTRATOR] Starting workflow: ${workflowId}`);

    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const workflowInstance = {
      id: `${workflowId}-${Date.now()}`,
      workflowId,
      target,
      status: "running",
      startTime: new Date().toISOString(),
      steps: [],
      results: {},
      errors: [],
    };

    this.activeWorkflows.set(workflowInstance.id, workflowInstance);

    try {
      // Execute workflow steps
      const results = await this.executeWorkflowSteps(
        workflow,
        target,
        options
      );

      workflowInstance.status = "completed";
      workflowInstance.endTime = new Date().toISOString();
      workflowInstance.results = results;

      // Save to history
      this.workflowHistory.push(workflowInstance);

      console.log(`[ORCHESTRATOR] Workflow completed: ${workflowInstance.id}`);
      return workflowInstance;
    } catch (error) {
      console.error(
        `[ORCHESTRATOR] Workflow failed: ${workflowInstance.id}`,
        error
      );

      workflowInstance.status = "failed";
      workflowInstance.endTime = new Date().toISOString();
      workflowInstance.errors.push(error.message);

      this.workflowHistory.push(workflowInstance);
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowInstance.id);
    }
  }

  async executeWorkflowSteps(workflow, target, options) {
    const results = {};
    const stepResults = new Map();

    // Create execution plan
    const executionPlan = this.createExecutionPlan(workflow.steps);

    console.log(
      `[ORCHESTRATOR] Execution plan created with ${executionPlan.length} phases`
    );

    // Execute each phase
    for (const phase of executionPlan) {
      console.log(
        `[ORCHESTRATOR] Executing phase with ${phase.length} parallel steps`
      );

      // Execute parallel steps
      const phasePromises = phase.map((step) =>
        this.executeStep(step, target, stepResults, options)
      );
      const phaseResults = await Promise.allSettled(phasePromises);

      // Process results
      phaseResults.forEach((result, index) => {
        const step = phase[index];
        if (result.status === "fulfilled") {
          stepResults.set(step.id, result.value);
          results[step.id] = result.value;
        } else {
          console.error(
            `[ORCHESTRATOR] Step ${step.id} failed:`,
            result.reason
          );
          if (step.required) {
            throw new Error(
              `Required step failed: ${step.id} - ${result.reason.message}`
            );
          }
        }
      });
    }

    return results;
  }

  createExecutionPlan(steps) {
    const phases = [];
    const completed = new Set();
    const remaining = [...steps];

    while (remaining.length > 0) {
      const currentPhase = [];
      const nextRemaining = [];

      for (const step of remaining) {
        // Check if all dependencies are completed
        const dependenciesMet =
          !step.dependsOn || step.dependsOn.every((dep) => completed.has(dep));

        if (dependenciesMet) {
          currentPhase.push(step);
        } else {
          nextRemaining.push(step);
        }
      }

      if (currentPhase.length === 0) {
        throw new Error("Circular dependency detected in workflow");
      }

      phases.push(currentPhase);
      currentPhase.forEach((step) => completed.add(step.id));
      remaining.splice(0, remaining.length, ...nextRemaining);
    }

    return phases;
  }

  async executeStep(step, target, stepResults, options) {
    console.log(
      `[ORCHESTRATOR] Executing step: ${step.id} with agent: ${step.agent}`
    );

    const agent = this.agents.get(step.agent);
    if (!agent) {
      throw new Error(`Agent not found: ${step.agent}`);
    }

    // Prepare step context
    const context = {
      target,
      stepResults: Object.fromEntries(stepResults),
      options,
      workflowId: step.workflowId,
    };

    let result;

    try {
      // Execute based on target type
      switch (step.target) {
        case "file":
          result = await this.executeFileTarget(agent, target, context);
          break;
        case "project":
          result = await this.executeProjectTarget(agent, target, context);
          break;
        case "workflow":
          result = await this.executeWorkflowTarget(agent, context);
          break;
        default:
          throw new Error(`Unknown target type: ${step.target}`);
      }

      console.log(`[ORCHESTRATOR] Step ${step.id} completed successfully`);
      return result;
    } catch (error) {
      console.error(`[ORCHESTRATOR] Step ${step.id} failed:`, error);
      throw error;
    }
  }

  async executeFileTarget(agent, filePath, context) {
    if (agent.scanFile) {
      // Security scanner or code analyzer
      const content = fs.readFileSync(filePath, "utf8");
      return await agent.scanFile(filePath, content);
    } else if (agent.fixFile) {
      // Auto fixer
      const issues = context.stepResults["code-analysis"]?.issues || [];
      return await agent.fixFile(filePath, issues);
    } else if (agent.generateDocumentation) {
      // Documentation generator
      return await agent.generateDocumentation(filePath, context.options);
    } else {
      throw new Error(
        `Agent ${agent.constructor.name} does not support file targets`
      );
    }
  }

  async executeProjectTarget(agent, projectPath, context) {
    if (agent.analyzeProject) {
      return await agent.analyzeProject(projectPath);
    } else if (agent.batchFix) {
      const issuesList = context.stepResults["code-analysis"]?.issues || [];
      return await agent.batchFix(projectPath, issuesList);
    } else if (agent.batchGenerateDocumentation) {
      return await agent.batchGenerateDocumentation(
        projectPath,
        context.options
      );
    } else {
      throw new Error(
        `Agent ${agent.constructor.name} does not support project targets`
      );
    }
  }

  async executeWorkflowTarget(agent, context) {
    if (agent.generateReport) {
      return await agent.generateReport();
    } else {
      throw new Error(
        `Agent ${agent.constructor.name} does not support workflow targets`
      );
    }
  }

  getWorkflowStatus(workflowInstanceId) {
    return (
      this.activeWorkflows.get(workflowInstanceId) ||
      this.workflowHistory.find((w) => w.id === workflowInstanceId)
    );
  }

  getAvailableWorkflows() {
    return Array.from(this.workflows.values()).map((workflow) => ({
      id: workflow.id || workflow.name.toLowerCase().replace(/\s+/g, "-"),
      name: workflow.name,
      description: workflow.description,
      stepCount: workflow.steps.length,
    }));
  }

  getWorkflowHistory(limit = 10) {
    return this.workflowHistory
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, limit);
  }

  getAgentStatus() {
    const status = {};
    for (const [name, agent] of this.agents.entries()) {
      status[name] = {
        name: agent.constructor.name,
        available: true,
        lastUsed: null, // Could track this
      };
    }
    return status;
  }

  // Utility method to create custom workflows
  createCustomWorkflow(name, description, steps) {
    const workflowId = name.toLowerCase().replace(/\s+/g, "-");
    this.workflows.set(workflowId, {
      name,
      description,
      steps,
    });
    console.log(`[ORCHESTRATOR] Created custom workflow: ${workflowId}`);
    return workflowId;
  }
}

export default AgentOrchestrator;

// Run orchestrator if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const orchestrator = new AgentOrchestrator();

    console.log("[ORCHESTRATOR] Available workflows:");
    console.log(JSON.stringify(orchestrator.getAvailableWorkflows(), null, 2));

    console.log("\n[ORCHESTRATOR] Agent status:");
    console.log(JSON.stringify(orchestrator.getAgentStatus(), null, 2));

    // Example: Run a quick security check
    try {
      const result = await orchestrator.executeWorkflow(
        "security-check",
        "pages/page_modals/modal_scripts/chatbot.js"
      );
      console.log("\n[ORCHESTRATOR] Security check result:");
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("[ORCHESTRATOR] Example execution failed:", error);
    }
  })().catch((err) => {
    console.error("[ORCHESTRATOR] CLI error:", err);
    process.exit(1);
  });
}
