#!/usr/bin/env node

/**
 * AI-Powered Code Quality Analyzer
 * Analyzes code for quality issues, performance problems, and security vulnerabilities
 */

import { AI_CONFIG } from "../../config/ai-config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

class CodeAnalyzer {
  constructor() {
    if (!AI_CONFIG.GOOGLE_AI_API_KEY) {
      console.warn(
        "[CODE ANALYZER] No AI API key configured, using fallback mode"
      );
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(AI_CONFIG.GOOGLE_AI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: AI_CONFIG.MODEL });
    }
    console.log("[CODE ANALYZER] Code analyzer initialized successfully");
  }

  async analyzeFile(filePath, content) {
    try {
      console.log(`[CODE ANALYZER] Analyzing file: ${filePath}`);

      if (!this.model) {
        return this.getFallbackAnalysis(filePath, content);
      }

      const prompt = `
        Analyze this code file for:
        1. Code quality issues
        2. Performance problems
        3. Security vulnerabilities
        4. Best practices violations
        
        File: ${filePath}
        Content:
        ${content}
        
        Provide a structured analysis with:
        - Issue severity (low/medium/high/critical)
        - Specific problems found
        - Suggested improvements
        - Code examples for fixes
      `;

      const result = await this.model.generateContent(prompt);
      const analysis = result.response.text();

      console.log(`[CODE ANALYZER] Analysis completed for ${filePath}`);
      return analysis;
    } catch (error) {
      console.error(`[CODE ANALYZER] Error analyzing ${filePath}:`, error);
      return this.getFallbackAnalysis(filePath, content);
    }
  }

  getFallbackAnalysis(filePath, content) {
    console.log(`[CODE ANALYZER] Using fallback analysis for ${filePath}`);

    // Basic static analysis
    const issues = [];

    // Check for common issues
    if (
      content.includes("console.log(") &&
      !content.includes("// TODO: Remove debug log")
    ) {
      issues.push({
        severity: "low",
        type: "debug_code",
        message:
          "Console.log statements found - consider removing in production",
        suggestion: "Remove or comment out console.log statements",
      });
    }

    if (content.includes("TODO:") || content.includes("FIXME:")) {
      issues.push({
        severity: "medium",
        type: "todo_items",
        message: "TODO/FIXME items found in code",
        suggestion: "Address pending tasks before deployment",
      });
    }

    return {
      filePath,
      issues,
      timestamp: new Date().toISOString(),
      analysisType: "fallback",
    };
  }

  async analyzeProject(projectPath) {
    console.log(
      `[CODE ANALYZER] Starting project analysis for: ${projectPath}`
    );

    // This would scan all files in the project
    // For now, return a summary
    return {
      projectPath,
      totalFiles: 0,
      issuesFound: 0,
      timestamp: new Date().toISOString(),
      status: "completed",
    };
  }
}

export default CodeAnalyzer;
