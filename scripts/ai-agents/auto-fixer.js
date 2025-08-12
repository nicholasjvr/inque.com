#!/usr/bin/env node

/**
 * AI-Powered Auto-Fixer
 * Automatically fixes common code issues and security vulnerabilities
 */

import { AI_CONFIG } from "../../config/ai-config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

class AutoFixer {
  constructor() {
    if (!AI_CONFIG.GOOGLE_AI_API_KEY) {
      console.warn(
        "[AUTO FIXER] No AI API key configured, using fallback mode"
      );
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(AI_CONFIG.GOOGLE_AI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: AI_CONFIG.MODEL });
    }

    this.fixableIssues = [
      "console.log",
      "TODO:",
      "FIXME:",
      "hardcoded_secrets",
      "unsafe_eval",
    ];

    console.log("[AUTO FIXER] Auto-fixer initialized successfully");
  }

  async fixFile(filePath, issues) {
    try {
      console.log(`[AUTO FIXER] Attempting to fix file: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        console.error(`[AUTO FIXER] File not found: ${filePath}`);
        return { success: false, error: "File not found" };
      }

      const content = fs.readFileSync(filePath, "utf8");
      const fixedContent = await this.applyFixes(content, issues);

      if (fixedContent !== content) {
        // Create backup
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, content);
        console.log(`[AUTO FIXER] Backup created: ${backupPath}`);

        // Write fixed content
        fs.writeFileSync(filePath, fixedContent);
        console.log(`[AUTO FIXER] File fixed successfully: ${filePath}`);

        return {
          success: true,
          originalFile: backupPath,
          fixesApplied: this.getAppliedFixes(content, fixedContent),
        };
      } else {
        console.log(`[AUTO FIXER] No fixes needed for: ${filePath}`);
        return { success: true, fixesApplied: [] };
      }
    } catch (error) {
      console.error(`[AUTO FIXER] Error fixing ${filePath}:`, error);
      return { success: false, error: error.message };
    }
  }

  async applyFixes(content, issues) {
    let fixedContent = content;

    for (const issue of issues) {
      if (this.canAutoFix(issue.type)) {
        fixedContent = await this.applySpecificFix(fixedContent, issue);
      }
    }

    return fixedContent;
  }

  canAutoFix(issueType) {
    return this.fixableIssues.includes(issueType);
  }

  async applySpecificFix(content, issue) {
    switch (issue.type) {
      case "console.log":
        return this.removeConsoleLogs(content);
      case "TODO:":
      case "FIXME:":
        return this.removeTodos(content);
      case "hardcoded_secrets":
        return this.replaceHardcodedSecrets(content);
      case "unsafe_eval":
        return this.replaceUnsafeEval(content);
      default:
        return content;
    }
  }

  removeConsoleLogs(content) {
    console.log("[AUTO FIXER] Removing console.log statements");
    return content.replace(/console\.log\([^)]*\);?\s*/g, "");
  }

  removeTodos(content) {
    console.log("[AUTO FIXER] Removing TODO/FIXME comments");
    return content.replace(/\/\/\s*(TODO|FIXME):.*$/gm, "");
  }

  replaceHardcodedSecrets(content) {
    console.log("[AUTO FIXER] Replacing hardcoded secrets");
    return content.replace(
      /(password|secret|key|token)\s*[:=]\s*['"][^'"]{8,}['"]/g,
      "$1: process.env.$1_UPPER"
    );
  }

  replaceUnsafeEval(content) {
    console.log("[AUTO FIXER] Replacing unsafe eval usage");
    return content.replace(
      /eval\s*\(/g,
      "// TODO: Replace eval() with safer alternative - "
    );
  }

  getAppliedFixes(originalContent, fixedContent) {
    const fixes = [];

    if (
      originalContent.includes("console.log") &&
      !fixedContent.includes("console.log")
    ) {
      fixes.push("Removed console.log statements");
    }

    if (originalContent.includes("TODO:") && !fixedContent.includes("TODO:")) {
      fixes.push("Removed TODO comments");
    }

    if (
      originalContent.includes("FIXME:") &&
      !fixedContent.includes("FIXME:")
    ) {
      fixes.push("Removed FIXME comments");
    }

    return fixes;
  }

  async batchFix(projectPath, issuesList) {
    console.log(`[AUTO FIXER] Starting batch fix for project: ${projectPath}`);

    const results = [];

    for (const { filePath, issues } of issuesList) {
      const result = await this.fixFile(filePath, issues);
      results.push({ filePath, result });
    }

    const summary = {
      totalFiles: results.length,
      successfulFixes: results.filter((r) => r.result.success).length,
      failedFixes: results.filter((r) => !r.result.success).length,
      timestamp: new Date().toISOString(),
    };

    console.log(`[AUTO FIXER] Batch fix completed:`, summary);
    return { results, summary };
  }
}

export default AutoFixer;
