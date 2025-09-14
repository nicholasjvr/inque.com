// Enhanced Build Helper Script for inQ Platform
// Helps switch between development and production modes
// Now includes quip project management and WebGL optimization

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BUILD_HELPER_DEBUG = {
  log: (message, data = null) => {
    console.log(`[BUILD HELPER] ${message}`, data || "");
  },
  error: (message, error = null) => {
    console.error(`[BUILD HELPER ERROR] ${message}`, error || "");
  },
};

class BuildHelper {
  constructor() {
    this.modes = {
      dev: {
        firebasePublic: ".",
        description: "Development mode - serves raw files",
      },
      prod: {
        firebasePublic: "dist",
        description: "Production mode - serves optimized build",
      },
    };

    this.quipConfig = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: [
        ".html",
        ".js",
        ".css",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".svg",
        ".json",
        ".webp",
        ".glsl",
        ".obj",
        ".mtl",
      ],
      webglOptimizations: true,
      compressionEnabled: true,
    };
  }

  async switchMode(mode) {
    if (!this.modes[mode]) {
      BUILD_HELPER_DEBUG.error(
        `Invalid mode: ${mode}. Available modes: ${Object.keys(this.modes).join(", ")}`
      );
      return;
    }

    try {
      BUILD_HELPER_DEBUG.log(`Switching to ${mode} mode...`);

      // Update firebase.json
      const firebaseConfig = JSON.parse(
        fs.readFileSync("firebase.json", "utf8")
      );
      firebaseConfig.hosting.public = this.modes[mode].firebasePublic;

      fs.writeFileSync(
        "firebase.json",
        JSON.stringify(firebaseConfig, null, 2)
      );

      BUILD_HELPER_DEBUG.log(
        `Firebase hosting now points to: ${this.modes[mode].firebasePublic}`
      );
      BUILD_HELPER_DEBUG.log(`Mode: ${this.modes[mode].description}`);

      if (mode === "prod") {
        BUILD_HELPER_DEBUG.log("Building production assets...");
        execSync("npm run build", { stdio: "inherit" });
        BUILD_HELPER_DEBUG.log("Production build complete!");
      }
    } catch (error) {
      BUILD_HELPER_DEBUG.error("Failed to switch mode", error);
    }
  }

  showStatus() {
    const firebaseConfig = JSON.parse(fs.readFileSync("firebase.json", "utf8"));
    const currentPublic = firebaseConfig.hosting.public;

    console.log("\n🚀 inQ Platform Build Status");
    console.log("==============================");
    console.log(`Current Firebase public folder: ${currentPublic}`);

    if (currentPublic === "dist") {
      console.log("Mode: Production (optimized build)");
      if (fs.existsSync("dist")) {
        console.log("✅ dist folder exists");
      } else {
        console.log("❌ dist folder missing - run 'npm run build'");
      }
    } else {
      console.log("Mode: Development (raw files)");
    }

    // Show quip configuration
    console.log("\n🎮 Quip Configuration:");
    console.log(
      `Max file size: ${this.quipConfig.maxFileSize / (1024 * 1024)}MB`
    );
    console.log(
      `WebGL optimizations: ${this.quipConfig.webglOptimizations ? "Enabled" : "Disabled"}`
    );
    console.log(
      `Compression: ${this.quipConfig.compressionEnabled ? "Enabled" : "Disabled"}`
    );
    console.log(
      `Allowed extensions: ${this.quipConfig.allowedExtensions.join(", ")}`
    );

    console.log("\nAvailable commands:");
    console.log("  npm run dev     - Start development server");
    console.log("  npm run build   - Build for production");
    console.log("  npm run preview - Preview production build");
    console.log(
      "  node scripts/build-helper.js prod - Switch to production mode"
    );
    console.log(
      "  node scripts/build-helper.js dev  - Switch to development mode"
    );
    console.log(
      "  node scripts/build-helper.js validate-quip <path> - Validate quip project"
    );
    console.log(
      "  node scripts/build-helper.js optimize-quip <path> - Optimize quip for WebGL"
    );
  }

  /**
   * Validate quip project structure and files
   */
  validateQuip(quipPath) {
    BUILD_HELPER_DEBUG.log(`Validating quip project: ${quipPath}`);

    if (!fs.existsSync(quipPath)) {
      BUILD_HELPER_DEBUG.error(`Quip path does not exist: ${quipPath}`);
      return false;
    }

    const stats = fs.statSync(quipPath);
    if (!stats.isDirectory()) {
      BUILD_HELPER_DEBUG.error(`Quip path is not a directory: ${quipPath}`);
      return false;
    }

    const files = fs.readdirSync(quipPath);
    const htmlFiles = files.filter((file) => /\.html?$/i.test(file));

    if (htmlFiles.length === 0) {
      BUILD_HELPER_DEBUG.error("No HTML files found in quip project");
      return false;
    }

    // Check for required files
    const hasIndexHtml = htmlFiles.some((file) => /^index\.html?$/i.test(file));
    if (!hasIndexHtml) {
      BUILD_HELPER_DEBUG.warn(
        "No index.html found - using first HTML file as entry point"
      );
    }

    // Validate file sizes and extensions
    let totalSize = 0;
    let invalidFiles = [];

    files.forEach((file) => {
      const filePath = path.join(quipPath, file);
      const fileStats = fs.statSync(filePath);

      if (fileStats.isFile()) {
        totalSize += fileStats.size;

        const ext = path.extname(file).toLowerCase();
        if (!this.quipConfig.allowedExtensions.includes(ext)) {
          invalidFiles.push(file);
        }
      }
    });

    if (totalSize > this.quipConfig.maxFileSize) {
      BUILD_HELPER_DEBUG.error(
        `Quip project exceeds maximum size: ${totalSize / (1024 * 1024)}MB > ${this.quipConfig.maxFileSize / (1024 * 1024)}MB`
      );
      return false;
    }

    if (invalidFiles.length > 0) {
      BUILD_HELPER_DEBUG.error(
        `Invalid file extensions found: ${invalidFiles.join(", ")}`
      );
      return false;
    }

    BUILD_HELPER_DEBUG.log(`✅ Quip validation successful`);
    BUILD_HELPER_DEBUG.log(
      `Total size: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`
    );
    BUILD_HELPER_DEBUG.log(`Files: ${files.length}`);
    BUILD_HELPER_DEBUG.log(`HTML files: ${htmlFiles.length}`);

    return true;
  }

  /**
   * Optimize quip project for WebGL performance
   */
  optimizeQuip(quipPath) {
    BUILD_HELPER_DEBUG.log(`Optimizing quip project: ${quipPath}`);

    if (!this.validateQuip(quipPath)) {
      BUILD_HELPER_DEBUG.error("Quip validation failed - cannot optimize");
      return false;
    }

    const files = fs.readdirSync(quipPath);

    files.forEach((file) => {
      const filePath = path.join(quipPath, file);
      const ext = path.extname(file).toLowerCase();

      if (ext === ".js") {
        this.optimizeJavaScript(filePath);
      } else if (ext === ".css") {
        this.optimizeCSS(filePath);
      } else if ([".png", ".jpg", ".jpeg"].includes(ext)) {
        this.optimizeImage(filePath);
      }
    });

    BUILD_HELPER_DEBUG.log("✅ Quip optimization complete");
    return true;
  }

  /**
   * Optimize JavaScript files for WebGL
   */
  optimizeJavaScript(filePath) {
    BUILD_HELPER_DEBUG.log(`Optimizing JavaScript: ${filePath}`);

    let content = fs.readFileSync(filePath, "utf8");

    // Add WebGL performance optimizations
    const webglOptimizations = `
// WebGL Performance Optimizations
if (typeof window !== 'undefined') {
  // Enable high DPI rendering
  const canvas = document.querySelector('canvas');
  if (canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = 'crisp-edges';
  }
  
  // Performance monitoring
  if (window.performance && window.performance.mark) {
    window.performance.mark('quip-optimized-${Date.now()}');
  }
}
`;

    // Insert optimizations at the beginning of the file
    content = webglOptimizations + content;

    fs.writeFileSync(filePath, content);
  }

  /**
   * Optimize CSS files
   */
  optimizeCSS(filePath) {
    BUILD_HELPER_DEBUG.log(`Optimizing CSS: ${filePath}`);

    let content = fs.readFileSync(filePath, "utf8");

    // Remove comments and unnecessary whitespace
    content = content
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/\s+/g, " ") // Collapse whitespace
      .replace(/;\s*}/g, "}") // Remove semicolons before closing braces
      .trim();

    fs.writeFileSync(filePath, content);
  }

  /**
   * Optimize image files (placeholder - would use actual image optimization library)
   */
  optimizeImage(filePath) {
    BUILD_HELPER_DEBUG.log(`Optimizing image: ${filePath}`);
    // In a real implementation, you would use libraries like sharp or imagemin
    // For now, just log the optimization
  }
}

// CLI usage
const args = process.argv.slice(2);
const helper = new BuildHelper();

if (args.length === 0) {
  helper.showStatus();
} else if (args[0] === "validate-quip" && args[1]) {
  helper.validateQuip(args[1]);
} else if (args[0] === "optimize-quip" && args[1]) {
  helper.optimizeQuip(args[1]);
} else {
  helper.switchMode(args[0]);
}
