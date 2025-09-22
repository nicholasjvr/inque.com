// AI Configuration for Chatbot
// Uses environment variables for CI/CD and local development

// Debug log to show when AI config is loaded
console.log("[DEBUG] AI Configuration module loaded");

// For browser environment, we'll use a different approach for API key
// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";
const apiKey = isBrowser
  ? window.GOOGLE_AI_API_KEY || localStorage.getItem("GOOGLE_AI_API_KEY")
  : typeof process !== "undefined"
    ? process.env.GOOGLE_AI_API_KEY
    : null;

console.log("[DEBUG] Environment check - GOOGLE_AI_API_KEY present:", !!apiKey);

export const AI_CONFIG = {
  GOOGLE_AI_API_KEY: apiKey,
  MODEL: "gemini-pro",

  // Chatbot behavior settings
  MAX_RESPONSE_LENGTH: 500,
  TYPING_DELAY: 1000,

  FALLBACK_RESPONSES: {
    // Core features
    features:
      "This application includes user profiles, widget management, interactive canvas, timeline management, and social features. What would you like to know more about?",
    widgets:
      "Widgets are interactive components you can upload and display on your profile. You can upload HTML, CSS, JavaScript files and preview them before publishing.",
    canvas:
      "The interactive canvas allows you to draw, collaborate with others, and create visual content. You can switch between different modes and save your work.",
    profile:
      "Your profile shows your information, stats, and uploaded widgets. You can edit your profile, upload a photo, and customize your bio.",
    upload:
      "You can upload various file types including images, documents, and widget files. The system supports drag-and-drop and provides progress tracking.",

    // AI and automation features
    ai: "This application includes AI-powered features like code analysis, security scanning, auto-fixing, and this chatbot assistant! The AI agents help with development workflow automation.",
    agents:
      "AI agents in this application include: code analyzer, security scanner, auto-fixer, documentation generator, and deployment automation tools.",
    automation:
      "The AI agents can automatically analyze your code, fix common issues, generate documentation, scan for security vulnerabilities, and help with deployment.",

    // Development and technical
    code: "This application supports JavaScript, HTML, CSS development with AI-powered code analysis, security scanning, and automated documentation generation.",
    development:
      "The development workflow includes AI agents for code quality, security scanning, auto-fixing, documentation, and deployment automation.",
    security:
      "Security features include AI-powered vulnerability scanning, automated security checks, and best practice recommendations.",

    // User experience
    help: "I'm here to help! You can ask me about features, widgets, the canvas, profiles, AI agents, or any other aspect of the application.",
    getting_started:
      "To get started: 1) Set up your profile, 2) Explore the canvas, 3) Upload some widgets, 4) Try the AI agents for code analysis!",
    tutorial:
      "Here's a quick tutorial: Start by editing your profile, then try the interactive canvas, upload a widget, and explore the AI-powered development tools.",

    // Troubleshooting
    error:
      "If you're experiencing issues, try refreshing the page, checking your internet connection, or clearing your browser cache. The AI agents can also help diagnose problems.",
    bug: "Found a bug? The AI agents can help analyze and fix common issues automatically. You can also report issues through the application's feedback system.",

    // Advanced features
    collaboration:
      "Collaboration features include real-time canvas editing, shared projects, social interactions, and AI-powered code review assistance.",
    integration:
      "The application integrates with various services including Firebase for data storage, Google AI for intelligent features, and GitHub for version control.",

    // Default fallback
    default:
      "I'm here to help you understand this application! You can ask me about features, widgets, the canvas, profiles, AI agents, or how to use different parts of the platform.",
  },
};

// Helper function to get API key
export function getApiKey() {
  console.log("[DEBUG] getApiKey() function called");
  // Check if API key is set
  if (!AI_CONFIG.GOOGLE_AI_API_KEY) {
    console.warn(
      "[AI CONFIG] Please set your GOOGLE_AI_API_KEY environment variable"
    );
    console.log("[DEBUG] API key not found in environment variables");
    return null;
  }
  console.log("[DEBUG] API key found and returned successfully");
  return AI_CONFIG.GOOGLE_AI_API_KEY;
}

// Helper function to check if AI is properly configured
export function isAIConfigured() {
  return getApiKey() !== null;
}
