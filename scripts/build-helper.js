// Build Helper Script for inQ Platform
// Helps switch between development and production modes

import { execSync } from "child_process";
import fs from "fs";

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
  }
}

// CLI usage
const args = process.argv.slice(2);
const helper = new BuildHelper();

if (args.length === 0) {
  helper.showStatus();
} else {
  helper.switchMode(args[0]);
}
