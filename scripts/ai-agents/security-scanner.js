#!/usr/bin/env node

/**
 * AI-Powered Security Scanner
 * Scans code for security vulnerabilities and best practices
 */

import { AI_CONFIG } from "../../config/ai-config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

class SecurityScanner {
  constructor() {
    if (!AI_CONFIG.GOOGLE_AI_API_KEY) {
      console.warn(
        "[SECURITY SCANNER] No AI API key configured, using fallback mode"
      );
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(AI_CONFIG.GOOGLE_AI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: AI_CONFIG.MODEL });
    }

    this.securityPatterns = {
      sqlInjection:
        /(\b(select|insert|update|delete|drop|create|alter)\b.*\b(where|from|into|table)\b)/i,
      xss: /<script|javascript:|on\w+\s*=|eval\s*\(|innerHTML\s*=/i,
      hardcodedSecrets:
        /(password|secret|key|token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
      unsafeEval: /eval\s*\(|Function\s*\(|setTimeout\s*\(|setInterval\s*\(/i,
    };

    console.log("[SECURITY SCANNER] Security scanner initialized successfully");
  }

  async scanFile(filePath, content) {
    try {
      console.log(`[SECURITY SCANNER] Scanning file: ${filePath}`);

      const staticScan = this.performStaticScan(content);
      let aiScan = null;

      if (this.model) {
        aiScan = await this.performAIScan(filePath, content);
      }

      const results = {
        filePath,
        staticScan,
        aiScan,
        timestamp: new Date().toISOString(),
        riskLevel: this.calculateRiskLevel(staticScan),
      };

      console.log(`[SECURITY SCANNER] Scan completed for ${filePath}`);
      return results;
    } catch (error) {
      console.error(`[SECURITY SCANNER] Error scanning ${filePath}:`, error);
      return {
        filePath,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  performStaticScan(content) {
    const issues = [];

    // Check for security patterns
    for (const [type, pattern] of Object.entries(this.securityPatterns)) {
      if (pattern.test(content)) {
        issues.push({
          type,
          severity: "high",
          message: `Potential ${type} vulnerability detected`,
          line: this.findLineNumber(content, pattern),
          suggestion: this.getSecuritySuggestion(type),
        });
      }
    }

    // Check for other common issues
    if (content.includes("process.env") && content.includes("console.log")) {
      issues.push({
        type: "information_disclosure",
        severity: "medium",
        message:
          "Environment variables being logged - potential information disclosure",
        suggestion:
          "Remove or secure logging of sensitive environment variables",
      });
    }

    return issues;
  }

  async performAIScan(filePath, content) {
    try {
      const prompt = `
        Analyze this code file for security vulnerabilities:
        
        File: ${filePath}
        Content:
        ${content}
        
        Focus on:
        1. SQL injection vulnerabilities
        2. Cross-site scripting (XSS)
        3. Authentication bypass
        4. Information disclosure
        5. Insecure dependencies
        6. Input validation issues
        
        Provide specific security recommendations with severity levels.
      `;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("[SECURITY SCANNER] AI scan failed:", error);
      return null;
    }
  }

  findLineNumber(content, pattern) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return null;
  }

  getSecuritySuggestion(type) {
    const suggestions = {
      sqlInjection: "Use parameterized queries or ORM libraries",
      xss: "Sanitize user input and use safe DOM manipulation methods",
      hardcodedSecrets: "Use environment variables or secure secret management",
      unsafeEval: "Avoid eval() and similar functions, use safer alternatives",
    };

    return suggestions[type] || "Review and secure this code section";
  }

  calculateRiskLevel(issues) {
    if (issues.some((issue) => issue.severity === "high")) return "high";
    if (issues.some((issue) => issue.severity === "medium")) return "medium";
    if (issues.length > 0) return "low";
    return "none";
  }
}

export default SecurityScanner;
