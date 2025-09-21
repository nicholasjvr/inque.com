#!/usr/bin/env node

/**
 * AI-Powered CSS Analyzer
 * Analyzes CSS files and HTML documents for styling issues, dependencies, and optimizations
 */

import { AI_CONFIG } from "../../config/ai-config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

class CSSAnalyzer {
  constructor() {
    if (!AI_CONFIG.GOOGLE_AI_API_KEY) {
      console.warn(
        "[CSS ANALYZER] No AI API key configured, using fallback mode"
      );
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(AI_CONFIG.GOOGLE_AI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: AI_CONFIG.MODEL });
    }

    this.cssIssues = {
      missingDependencies: [],
      unusedStyles: [],
      invalidSelectors: [],
      performanceIssues: [],
      compatibilityIssues: [],
      accessibilityIssues: [],
    };

    console.log("[CSS ANALYZER] CSS analyzer initialized successfully");
  }

  log(message, data = null) {
    console.log(`[CSS ANALYZER] ${message}`, data || "");
  }

  error(message, error = null) {
    console.error(`[CSS ANALYZER ERROR] ${message}`, error || "");
  }

  async analyzeWidgetFiles(files, htmlFile = null) {
    try {
      this.log("Starting CSS analysis for widget files", {
        fileCount: files.length,
        hasHTML: !!htmlFile,
      });

      const analysis = {
        cssFiles: [],
        dependencies: [],
        issues: [],
        recommendations: [],
        optimization: null,
      };

      // Separate CSS files from other files
      const cssFiles = files.filter((f) => f.name.match(/\.css$/i));
      const otherFiles = files.filter((f) => !f.name.match(/\.css$/i));

      analysis.cssFiles = cssFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: "css",
      }));

      // Analyze each CSS file
      for (const cssFile of cssFiles) {
        const cssContent = await this.readFileContent(cssFile);
        const fileAnalysis = await this.analyzeCSSFile(
          cssFile.name,
          cssContent
        );
        analysis.issues.push(...fileAnalysis.issues);
      }

      // If we have an HTML file, analyze CSS dependencies
      if (htmlFile) {
        const htmlContent = await this.readFileContent(htmlFile);
        const dependencyAnalysis = this.analyzeHTMLDependencies(
          htmlContent,
          files
        );
        analysis.dependencies = dependencyAnalysis.dependencies;
        analysis.issues.push(...dependencyAnalysis.issues);

        // Cross-reference CSS files with HTML usage
        const usageAnalysis = await this.analyzeCSSUsage(cssFiles, htmlContent);
        analysis.issues.push(...usageAnalysis.issues);
      }

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis.issues);

      // Generate optimization suggestions
      analysis.optimization =
        await this.generateOptimizationSuggestions(cssFiles);

      this.log("CSS analysis completed", {
        cssFilesFound: cssFiles.length,
        totalIssues: analysis.issues.length,
        dependenciesFound: analysis.dependencies.length,
      });

      return analysis;
    } catch (error) {
      this.error("Error analyzing widget files", error);
      return {
        cssFiles: [],
        dependencies: [],
        issues: [
          {
            type: "analysis_error",
            severity: "high",
            message: error.message,
          },
        ],
        recommendations: [],
        optimization: null,
      };
    }
  }

  async analyzeCSSFile(fileName, content) {
    const issues = [];

    try {
      // Basic static analysis
      const staticIssues = this.performStaticAnalysis(content, fileName);
      issues.push(...staticIssues);

      // AI-powered analysis
      if (this.model) {
        const aiAnalysis = await this.performAIAnalysis(content, fileName);
        if (aiAnalysis && aiAnalysis.issues) {
          issues.push(...aiAnalysis.issues);
        }
      }

      return { issues };
    } catch (error) {
      this.error(`Error analyzing CSS file ${fileName}`, error);
      issues.push({
        type: "analysis_error",
        severity: "medium",
        message: `Failed to analyze CSS file: ${error.message}`,
        file: fileName,
      });
      return { issues };
    }
  }

  performStaticAnalysis(content, fileName) {
    const issues = [];

    // Check for common CSS issues
    const lines = content.split("\n");

    // Check for missing semicolons (basic check)
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.startsWith("/*") &&
        !trimmed.startsWith("*") &&
        !trimmed.endsWith(";") &&
        !trimmed.endsWith("{") &&
        !trimmed.endsWith("}") &&
        !trimmed.endsWith(",") &&
        !trimmed.startsWith("@") &&
        !trimmed.includes("*/")
      ) {
        issues.push({
          type: "syntax",
          severity: "low",
          message: "Possible missing semicolon",
          line: index + 1,
          file: fileName,
          suggestion: "Add semicolon at end of CSS declaration",
        });
      }
    });

    // Check for !important overuse
    const importantCount = (content.match(/!important/g) || []).length;
    if (importantCount > 5) {
      issues.push({
        type: "performance",
        severity: "medium",
        message: `High use of !important (${importantCount} instances)`,
        file: fileName,
        suggestion: "Reduce !important usage and use more specific selectors",
      });
    }

    // Check for very long selectors
    const longSelectors = content.match(/[^}]+{/g) || [];
    longSelectors.forEach((selector, index) => {
      if (selector.length > 200) {
        const lineNumber = content
          .substring(0, content.indexOf(selector))
          .split("\n").length;
        issues.push({
          type: "performance",
          severity: "low",
          message: "Very long selector detected",
          line: lineNumber,
          file: fileName,
          suggestion:
            "Consider breaking down complex selectors for better maintainability",
        });
      }
    });

    return issues;
  }

  async performAIAnalysis(content, fileName) {
    if (!this.model) return null;

    try {
      const prompt = `
        Analyze this CSS file for:
        1. Code quality issues
        2. Performance problems
        3. Best practices violations
        4. Browser compatibility issues
        5. Maintainability concerns

        CSS Content:
        ${content}

        Provide analysis in JSON format with this structure:
        {
          "issues": [
            {
              "type": "category",
              "severity": "low|medium|high",
              "message": "description",
              "line": line_number,
              "suggestion": "how to fix"
            }
          ]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;
    } catch (error) {
      this.error("AI analysis failed", error);
      return null;
    }
  }

  analyzeHTMLDependencies(htmlContent, files) {
    const issues = [];
    const dependencies = [];

    // Find all CSS references in HTML
    const cssLinkRegex = /<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi;
    const cssImportRegex = /@import\s+["']([^"']+\.css[^"']*)["']/gi;
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;

    let match;

    // Check link tags
    while ((match = cssLinkRegex.exec(htmlContent)) !== null) {
      const cssFile = match[1];
      const fileExists = files.some(
        (f) =>
          f.name === cssFile ||
          f.name.endsWith("/" + cssFile) ||
          f.name.endsWith("\\" + cssFile)
      );

      dependencies.push({
        type: "link",
        file: cssFile,
        exists: fileExists,
      });

      if (!fileExists) {
        issues.push({
          type: "missing_dependency",
          severity: "high",
          message: `CSS file referenced but not found: ${cssFile}`,
          suggestion:
            "Ensure all referenced CSS files are included in the upload",
        });
      }
    }

    // Check @import statements
    while ((match = cssImportRegex.exec(htmlContent)) !== null) {
      const cssFile = match[1];
      const fileExists = files.some(
        (f) =>
          f.name === cssFile ||
          f.name.endsWith("/" + cssFile) ||
          f.name.endsWith("\\" + cssFile)
      );

      dependencies.push({
        type: "import",
        file: cssFile,
        exists: fileExists,
      });

      if (!fileExists) {
        issues.push({
          type: "missing_dependency",
          severity: "high",
          message: `Imported CSS file not found: ${cssFile}`,
          suggestion: "Include imported CSS files in your upload",
        });
      }
    }

    // Check inline styles
    while ((match = styleRegex.exec(htmlContent)) !== null) {
      const styleContent = match[1];
      if (styleContent.trim()) {
        dependencies.push({
          type: "inline",
          content: styleContent.substring(0, 100) + "...",
          exists: true,
        });
      }
    }

    return { dependencies, issues };
  }

  async analyzeCSSUsage(cssFiles, htmlContent) {
    const issues = [];

    try {
      for (const cssFile of cssFiles) {
        const cssContent = await this.readFileContent(cssFile);

        // Extract CSS selectors
        const selectors = this.extractSelectors(cssContent);

        // Check if selectors are used in HTML
        let unusedSelectors = [];
        for (const selector of selectors) {
          if (!this.isSelectorUsed(selector, htmlContent)) {
            unusedSelectors.push(selector);
          }
        }

        if (unusedSelectors.length > 0) {
          issues.push({
            type: "unused_css",
            severity: "low",
            message: `${unusedSelectors.length} unused CSS selectors in ${cssFile.name}`,
            file: cssFile.name,
            suggestion: "Consider removing unused CSS to reduce file size",
            details:
              unusedSelectors.slice(0, 10).join(", ") +
              (unusedSelectors.length > 10 ? "..." : ""),
          });
        }
      }

      return { issues };
    } catch (error) {
      this.error("Error analyzing CSS usage", error);
      return { issues: [] };
    }
  }

  extractSelectors(cssContent) {
    const selectors = [];
    const selectorRegex = /([^{]+)\s*{/g;
    let match;

    while ((match = selectorRegex.exec(cssContent)) !== null) {
      const selector = match[1].trim();
      if (selector && !selector.startsWith("@") && !selector.startsWith("/*")) {
        selectors.push(selector);
      }
    }

    return selectors;
  }

  isSelectorUsed(selector, htmlContent) {
    // Simple check for selector usage in HTML
    // This is a basic implementation - could be enhanced with proper CSS selector matching

    // Remove pseudo-selectors and clean up
    const cleanSelector = selector
      .replace(/:hover|:focus|:active|:visited/g, "")
      .replace(/::before|::after/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Check for class usage
    if (cleanSelector.startsWith(".")) {
      const className = cleanSelector.substring(1);
      return new RegExp(
        `class=["'][^"']*\\b${className}\\b[^"']*["']`,
        "i"
      ).test(htmlContent);
    }

    // Check for ID usage
    if (cleanSelector.startsWith("#")) {
      const idName = cleanSelector.substring(1);
      return new RegExp(`id=["']${idName}["']`, "i").test(htmlContent);
    }

    // Check for tag usage (basic)
    if (/^[a-zA-Z][a-zA-Z0-9-]*/.test(cleanSelector)) {
      return new RegExp(`<${cleanSelector}`, "i").test(htmlContent);
    }

    return false;
  }

  generateRecommendations(issues) {
    const recommendations = [];

    const highSeverity = issues.filter((i) => i.severity === "high");
    const mediumSeverity = issues.filter((i) => i.severity === "medium");

    if (highSeverity.length > 0) {
      recommendations.push({
        priority: "high",
        message: `Fix ${highSeverity.length} high-priority CSS issues`,
        details: highSeverity.map((i) => i.message).join("; "),
      });
    }

    if (mediumSeverity.length > 0) {
      recommendations.push({
        priority: "medium",
        message: `Review ${mediumSeverity.length} medium-priority CSS issues`,
        details: mediumSeverity.map((i) => i.message).join("; "),
      });
    }

    // General recommendations
    if (issues.some((i) => i.type === "missing_dependency")) {
      recommendations.push({
        priority: "high",
        message: "Ensure all CSS dependencies are included",
        details: "Missing CSS files can cause styling issues in your widget",
      });
    }

    if (issues.some((i) => i.type === "unused_css")) {
      recommendations.push({
        priority: "low",
        message: "Consider removing unused CSS",
        details: "Unused CSS increases file size and loading time",
      });
    }

    return recommendations;
  }

  async generateOptimizationSuggestions(cssFiles) {
    if (!this.model) return null;

    try {
      const cssContents = await Promise.all(
        cssFiles.map(async (file) => ({
          name: file.name,
          content: await this.readFileContent(file),
        }))
      );

      const prompt = `
        Analyze these CSS files for optimization opportunities:

        ${cssContents.map((f) => `File: ${f.name}\n${f.content}`).join("\n\n")}

        Provide optimization suggestions including:
        1. CSS minification opportunities
        2. Redundant rules removal
        3. Performance improvements
        4. Browser compatibility enhancements
        5. File size reduction strategies

        Format as JSON with structure:
        {
          "suggestions": [
            {
              "type": "optimization_type",
              "impact": "high|medium|low",
              "description": "what to do",
              "potentialSavings": "size reduction estimate"
            }
          ],
          "overallScore": "optimization score out of 100"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      this.error("Error generating optimization suggestions", error);
      return null;
    }
  }

  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // Widget upload enhancement methods
  async processCSSForUpload(files, options = {}) {
    const result = {
      processedFiles: [],
      inlinedCSS: "",
      issues: [],
      recommendations: [],
    };

    try {
      // Find HTML and CSS files
      const htmlFiles = files.filter((f) => f.name.match(/\.html?$/i));
      const cssFiles = files.filter((f) => f.name.match(/\.css$/i));

      if (htmlFiles.length === 0) {
        this.log("No HTML files found for CSS processing");
        return result;
      }

      const htmlFile = htmlFiles[0];
      const htmlContent = await this.readFileContent(htmlFile);

      // Extract inline CSS if any
      const inlineStyles = this.extractInlineStyles(htmlContent);
      result.inlinedCSS = inlineStyles;

      // Process external CSS files
      const externalCSS = await this.processExternalCSS(cssFiles);

      // Combine all CSS
      const combinedCSS = this.combineCSS(externalCSS, inlineStyles);

      // Optimize combined CSS
      const optimizedCSS = await this.optimizeCSS(combinedCSS);

      // Create processed files array
      result.processedFiles = files.filter((f) => !f.name.match(/\.css$/i));

      if (options.inlineCSS) {
        // Replace external CSS links with inline styles
        const processedHTML = this.inlineCSSIntoHTML(
          htmlContent,
          optimizedCSS,
          cssFiles
        );
        result.processedFiles.push({
          name: htmlFile.name,
          content: processedHTML,
          type: "html",
        });
      } else {
        // Keep CSS files separate but optimized
        for (const cssFile of cssFiles) {
          const cssContent = await this.readFileContent(cssFile);
          const optimizedContent = await this.optimizeCSS(cssContent);
          result.processedFiles.push({
            name: cssFile.name,
            content: optimizedContent,
            type: "css",
          });
        }
      }

      this.log("CSS processing completed", {
        originalFiles: files.length,
        processedFiles: result.processedFiles.length,
        cssOptimized: optimizedCSS.length < combinedCSS.length,
      });

      return result;
    } catch (error) {
      this.error("Error processing CSS for upload", error);
      result.issues.push({
        type: "processing_error",
        severity: "high",
        message: error.message,
      });
      return result;
    }
  }

  extractInlineStyles(htmlContent) {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let inlineCSS = "";
    let match;

    while ((match = styleRegex.exec(htmlContent)) !== null) {
      inlineCSS += match[1] + "\n";
    }

    return inlineCSS.trim();
  }

  async processExternalCSS(cssFiles) {
    let combinedCSS = "";

    for (const cssFile of cssFiles) {
      const cssContent = await this.readFileContent(cssFile);
      combinedCSS += `/* ${cssFile.name} */\n${cssContent}\n\n`;
    }

    return combinedCSS.trim();
  }

  combineCSS(externalCSS, inlineCSS) {
    return externalCSS + (externalCSS && inlineCSS ? "\n\n" : "") + inlineCSS;
  }

  async optimizeCSS(cssContent) {
    // Basic CSS optimization
    let optimized = cssContent;

    // Remove comments (but preserve /*! important comments */)
    optimized = optimized.replace(/\/\*[\s\S]*?\*\//g, "");

    // Remove extra whitespace
    optimized = optimized.replace(/\s+/g, " ");
    optimized = optimized.replace(/; /g, ";");
    optimized = optimized.replace(/: /g, ":");
    optimized = optimized.replace(/{ /g, "{");
    optimized = optimized.replace(/ }/g, "}");

    // Remove trailing whitespace
    optimized = optimized.replace(/[;\s]+}/g, "}");

    return optimized.trim();
  }

  inlineCSSIntoHTML(htmlContent, cssContent, cssFiles) {
    // Remove existing CSS links
    let processedHTML = htmlContent;
    for (const cssFile of cssFiles) {
      processedHTML = processedHTML.replace(
        new RegExp(
          `<link[^>]+href=["'][^"']*${cssFile.name}[^"']*["'][^>]*>`,
          "gi"
        ),
        ""
      );
    }

    // Remove existing @import statements for these files
    processedHTML = processedHTML.replace(
      /@import\s+["'][^"']+\.css["'];?\s*/gi,
      ""
    );

    // Add inline CSS
    if (cssContent.trim()) {
      const styleTag = `<style>\n${cssContent}\n</style>`;
      processedHTML = processedHTML.replace("</head>", `${styleTag}\n</head>`);
    }

    return processedHTML;
  }
}

export default CSSAnalyzer;

// Run CSS analyzer if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("[CSS ANALYZER] CSS Analyzer ready for use");
  console.log(
    "[CSS ANALYZER] Use this agent to analyze CSS files and optimize styling for widget uploads"
  );
}
