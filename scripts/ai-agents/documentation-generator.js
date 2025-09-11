#!/usr/bin/env node

/**
 * AI-Powered Documentation Generator
 * Automatically generates comprehensive documentation from code
 */

import { AI_CONFIG } from "../../config/ai-config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

class DocumentationGenerator {
  constructor() {
    if (!AI_CONFIG.GOOGLE_AI_API_KEY) {
      console.warn(
        "[DOC GENERATOR] No AI API key configured, using fallback mode"
      );
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(AI_CONFIG.GOOGLE_AI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: AI_CONFIG.MODEL });
    }

    this.supportedFileTypes = [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".py",
      ".java",
      ".cpp",
      ".c",
    ];
    this.documentationTypes = {
      function: "Function Documentation",
      class: "Class Documentation",
      module: "Module Documentation",
      api: "API Documentation",
      readme: "README Documentation",
    };

    console.log(
      "[DOC GENERATOR] Documentation generator initialized successfully"
    );
  }

  async generateDocumentation(filePath, options = {}) {
    try {
      console.log(`[DOC GENERATOR] Generating documentation for: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        console.error(`[DOC GENERATOR] File not found: ${filePath}`);
        return { success: false, error: "File not found" };
      }

      const content = fs.readFileSync(filePath, "utf8");
      const fileExtension = path.extname(filePath);

      if (!this.supportedFileTypes.includes(fileExtension)) {
        console.warn(`[DOC GENERATOR] Unsupported file type: ${fileExtension}`);
        return { success: false, error: "Unsupported file type" };
      }

      const documentation = await this.generateDocContent(
        content,
        filePath,
        options
      );

      if (documentation) {
        const outputPath = this.getOutputPath(filePath, options.outputDir);
        fs.writeFileSync(outputPath, documentation);

        console.log(`[DOC GENERATOR] Documentation generated: ${outputPath}`);
        return {
          success: true,
          outputPath,
          documentation,
          stats: this.getDocumentationStats(content, documentation),
        };
      } else {
        return { success: false, error: "Failed to generate documentation" };
      }
    } catch (error) {
      console.error(
        `[DOC GENERATOR] Error generating documentation for ${filePath}:`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  async generateDocContent(content, filePath, options) {
    try {
      if (!this.model) {
        return this.generateFallbackDocumentation(content, filePath);
      }

      const docType = options.type || this.detectDocumentationType(content);
      const prompt = this.buildDocumentationPrompt(
        content,
        filePath,
        docType,
        options
      );

      console.log(`[DOC GENERATOR] Generating ${docType} documentation...`);
      const result = await this.model.generateContent(prompt);
      const documentation = result.response.text();

      return this.formatDocumentation(documentation, docType, filePath);
    } catch (error) {
      console.error("[DOC GENERATOR] AI generation failed:", error);
      return this.generateFallbackDocumentation(content, filePath);
    }
  }

  buildDocumentationPrompt(content, filePath, docType, options) {
    const basePrompt = `Generate comprehensive ${docType} for the following code file.

FILE: ${filePath}
CONTENT:
${content}

REQUIREMENTS:
- Use clear, professional language
- Include examples where helpful
- Explain complex logic and algorithms
- Document all public functions/methods
- Include parameter descriptions and return values
- Add usage examples
- Follow standard documentation conventions
- Keep explanations concise but thorough

FORMAT: ${options.format || "markdown"}`;

    switch (docType) {
      case "function":
        return (
          basePrompt +
          `

FOCUS ON:
- Function purpose and behavior
- Parameter types and descriptions
- Return value explanation
- Usage examples
- Edge cases and error handling`
        );

      case "class":
        return (
          basePrompt +
          `

FOCUS ON:
- Class purpose and responsibilities
- Constructor parameters
- Public methods and their purposes
- Properties and their types
- Inheritance relationships
- Usage patterns`
        );

      case "api":
        return (
          basePrompt +
          `

FOCUS ON:
- API endpoints and methods
- Request/response formats
- Authentication requirements
- Error codes and handling
- Rate limiting
- Example requests and responses`
        );

      default:
        return basePrompt;
    }
  }

  detectDocumentationType(content) {
    // Simple heuristics to detect documentation type
    if (content.includes("class ") || content.includes("function ")) {
      return "class";
    }
    if (
      content.includes("app.get") ||
      content.includes("app.post") ||
      content.includes("router.")
    ) {
      return "api";
    }
    if (content.includes("export ") || content.includes("module.exports")) {
      return "module";
    }
    return "function";
  }

  generateFallbackDocumentation(content, filePath) {
    console.log(
      `[DOC GENERATOR] Generating fallback documentation for ${filePath}`
    );

    const fileName = path.basename(filePath, path.extname(filePath));
    const fileExtension = path.extname(filePath);

    let doc = `# ${fileName} Documentation\n\n`;
    doc += `**File:** \`${filePath}\`\n`;
    doc += `**Type:** ${fileExtension} file\n`;
    doc += `**Generated:** ${new Date().toLocaleString()}\n\n`;

    // Extract basic function/class information
    const functions = this.extractFunctions(content);
    const classes = this.extractClasses(content);

    if (classes.length > 0) {
      doc += `## Classes\n\n`;
      classes.forEach((cls) => {
        doc += `### ${cls.name}\n`;
        doc += `${cls.description}\n\n`;
      });
    }

    if (functions.length > 0) {
      doc += `## Functions\n\n`;
      functions.forEach((func) => {
        doc += `### ${func.name}\n`;
        doc += `${func.description}\n\n`;
      });
    }

    doc += `## File Statistics\n`;
    doc += `- **Lines of Code:** ${content.split("\n").length}\n`;
    doc += `- **Functions:** ${functions.length}\n`;
    doc += `- **Classes:** ${classes.length}\n`;
    doc += `- **File Size:** ${Math.round(content.length / 1024)} KB\n\n`;

    doc += `---\n*Documentation generated by AI Agent Integration System*\n`;

    return doc;
  }

  extractFunctions(content) {
    const functions = [];
    const functionRegex =
      /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?function|(\w+)\s*:\s*(?:async\s+)?function)/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3];
      functions.push({
        name,
        description: `Function ${name} - purpose to be documented`,
      });
    }

    return functions;
  }

  extractClasses(content) {
    const classes = [];
    const classRegex = /class\s+(\w+)/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        description: `Class ${match[1]} - purpose to be documented`,
      });
    }

    return classes;
  }

  formatDocumentation(doc, docType, filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const header = `# ${fileName} Documentation\n\n`;
    const footer = `\n---\n*Documentation generated by AI Agent Integration System*\n`;

    return header + doc + footer;
  }

  getOutputPath(filePath, outputDir = "docs") {
    const fileName = path.basename(filePath, path.extname(filePath));
    const outputDirPath = outputDir || "docs";

    // Ensure output directory exists
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }

    return path.join(outputDirPath, `${fileName}.md`);
  }

  getDocumentationStats(originalContent, documentation) {
    return {
      originalLines: originalContent.split("\n").length,
      documentationLines: documentation.split("\n").length,
      documentationSize: Math.round(documentation.length / 1024),
      coverage: "Generated",
      timestamp: new Date().toISOString(),
    };
  }

  async batchGenerateDocumentation(projectPath, options = {}) {
    console.log(
      `[DOC GENERATOR] Starting batch documentation generation for: ${projectPath}`
    );

    const files = this.findDocumentableFiles(projectPath);
    const results = [];

    for (const filePath of files) {
      const result = await this.generateDocumentation(filePath, options);
      results.push({ filePath, result });
    }

    const summary = {
      totalFiles: results.length,
      successfulGenerations: results.filter((r) => r.result.success).length,
      failedGenerations: results.filter((r) => !r.result.success).length,
      timestamp: new Date().toISOString(),
    };

    console.log(`[DOC GENERATOR] Batch generation completed:`, summary);
    return { results, summary };
  }

  findDocumentableFiles(projectPath) {
    const files = [];

    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (
          stat.isDirectory() &&
          !item.startsWith(".") &&
          item !== "node_modules"
        ) {
          scanDirectory(fullPath);
        } else if (
          stat.isFile() &&
          this.supportedFileTypes.includes(path.extname(item))
        ) {
          files.push(fullPath);
        }
      }
    }

    scanDirectory(projectPath);
    return files;
  }
}

export default DocumentationGenerator;

// Run documentation generator if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const generator = new DocumentationGenerator();

    // Generate documentation for key files
    const targetFiles = [
      "pages/page_modals/modal_scripts/chatbot.js",
      "scripts/ai-agents/auto-fixer.js",
      "main.js",
    ].filter((p) => fs.existsSync(p));

    if (targetFiles.length === 0) {
      console.log(
        "[DOC GENERATOR] No target files found, generating project overview"
      );
      const summary = await generator.batchGenerateDocumentation(process.cwd());
      console.log(JSON.stringify(summary, null, 2));
    } else {
      const results = [];
      for (const filePath of targetFiles) {
        const result = await generator.generateDocumentation(filePath);
        results.push({ filePath, result });
      }
      console.log(JSON.stringify({ results }, null, 2));
    }
  })().catch((err) => {
    console.error("[DOC GENERATOR] CLI error:", err);
    process.exit(1);
  });
}
