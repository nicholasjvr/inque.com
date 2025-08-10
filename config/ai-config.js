// AI Configuration for Chatbot
// Import API key from secure, git-ignored file
import { getGenkitApiKey } from "./genkit-api-key.js";

export const AI_CONFIG = {
  // Google AI API Key - Retrieved from secure config
  GOOGLE_AI_API_KEY: getGenkitApiKey(),

  // AI Model settings
  MODEL: "gemini-pro",

  // Chatbot behavior settings
  MAX_RESPONSE_LENGTH: 500,
  TYPING_DELAY: 1000, // milliseconds

  // Fallback responses for when AI is unavailable
  FALLBACK_RESPONSES: {
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
    help: "I'm here to help! You can ask me about features, widgets, the canvas, profiles, or any other aspect of the application.",
    default:
      "I'm here to help you understand this application! You can ask me about features, widgets, the canvas, profiles, or how to use different parts of the platform.",
  },
};

// Helper function to get API key
export function getApiKey() {
  // Check if API key is set
  if (!AI_CONFIG.GOOGLE_AI_API_KEY) {
    console.warn(
      "[AI CONFIG] Please set your Google AI API key in config/genkit-api-key.js"
    );
    return null;
  }
  return AI_CONFIG.GOOGLE_AI_API_KEY;
}

// Helper function to check if AI is properly configured
export function isAIConfigured() {
  return getApiKey() !== null;
}
