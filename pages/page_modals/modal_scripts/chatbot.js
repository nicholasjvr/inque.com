console.log("[CHATBOT] Initializing AI chatbot...");

// Chatbot state
let chatHistory = [];
let isTyping = false;
let userContext = {
  name: null,
  preferences: {},
  sessionStart: new Date().toISOString(),
  topicsDiscussed: [],
  lastInteraction: null,
};

// Customer Service Button functionality
function initializeCustomerServiceButton() {
  console.log("[CHATBOT] Initializing customer service button...");

  const csButton = document.getElementById("customerServiceButton");
  const csNotificationBadge = document.getElementById("csNotificationBadge");

  if (!csButton) {
    console.warn("[CHATBOT] Customer service button not found");
    return;
  }

  // Add click animation
  csButton.addEventListener("click", () => {
    console.log("[CHATBOT] Customer service button clicked");
    csButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      csButton.style.transform = "";
    }, 150);
  });

  // Show notification badge after 5 seconds (demo)
  setTimeout(() => {
    if (csNotificationBadge) {
      csNotificationBadge.style.display = "flex";
      console.log("[CHATBOT] Notification badge shown");
    }
  }, 5000);

  console.log("[CHATBOT] Customer service button initialized");
}

function initializeChatbot() {
  console.log("[CHATBOT] Initializing chatbot components...");

  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");

  if (!chatMessages || !chatInput || !sendChatBtn) {
    console.error("[CHATBOT] Required chatbot elements not found");
    return;
  }

  // Add event listeners
  sendChatBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Initialize dynamic suggestions
  initializeDynamicSuggestions();

  console.log("[CHATBOT] Chatbot initialized successfully");
}

// Send a message to the AI
async function sendMessage() {
  const chatInput = document.getElementById("chatInput");
  const message = chatInput.value.trim();

  if (!message || isTyping) return;

  console.log("[CHATBOT] Sending message:", message);

  // Add user message to chat
  addMessage(message, "user");
  chatInput.value = "";

  // Show typing indicator
  showTypingIndicator();

  try {
    // Get AI response using Genkit
    const response = await getAIResponse(message);

    // Remove typing indicator and add AI response
    removeTypingIndicator();
    addMessage(response, "ai");

    // Add to chat history and update context
    chatHistory.push({ role: "user", content: message });
    chatHistory.push({ role: "assistant", content: response });

    // Update user context
    updateUserContext(message, response);

    // Update suggestions based on new context
    setTimeout(() => updateSuggestions(), 500);
  } catch (error) {
    console.error("[CHATBOT] Error getting AI response:", error);
    removeTypingIndicator();
    addMessage("Sorry, I encountered an error. Please try again.", "ai");
  }
}

// Get AI response using Genkit with caching
async function getAIResponse(message) {
  console.log("[CHATBOT] Getting AI response for:", message);

  try {
    // Check cache first
    const cachedResponse = await getCachedResponse(message);
    if (cachedResponse) {
      console.log("[CHATBOT] Using cached response");
      return cachedResponse;
    }

    // Import configuration and Google AI
    const { AI_CONFIG, getApiKey, isAIConfigured } = await import(
      "./config/ai-config.js"
    );
    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    // Check if AI is properly configured
    if (!isAIConfigured()) {
      console.warn("[CHATBOT] AI not configured, using fallback responses");
      throw new Error("AI not configured");
    }

    // Initialize Google AI with API key from config
    const genAI = new GoogleGenerativeAI(getApiKey());

    // Build context-aware prompt
    const contextInfo = buildContextInfo();
    const prompt = `You are a helpful AI assistant for a web application called "inque". 

CONTEXT:
${contextInfo}

USER'S CURRENT QUESTION: "${message}"

CONVERSATION HISTORY:
${chatHistory
  .slice(-6)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

This application has the following features:
- User authentication and profiles
- Widget upload and management system  
- Interactive canvas for drawing and collaboration
- Timeline-based project management
- Social features and user interactions
- File upload and storage capabilities
- AI-powered code analysis and security scanning

INSTRUCTIONS:
- Provide a helpful, friendly response that considers the user's context and previous conversations
- If this is a follow-up question, reference previous topics naturally
- Keep responses concise but informative (max ${AI_CONFIG.MAX_RESPONSE_LENGTH} characters)
- If the user seems new, offer to explain basic features
- If they're experienced, dive deeper into advanced topics
- Always be encouraging and supportive`;

    // Get response from Gemini
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.MODEL });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log("[CHATBOT] AI response received:", response);

    // Cache the response for future use
    await setCachedResponse(message, response);

    return response;
  } catch (error) {
    console.error("[CHATBOT] Error with AI integration:", error);

    // Use fallback responses from config
    try {
      const { AI_CONFIG } = await import("./config/ai-config.js");

      // Check if message contains keywords for fallback responses
      const lowerMessage = message.toLowerCase();
      for (const [keyword, response] of Object.entries(
        AI_CONFIG.FALLBACK_RESPONSES
      )) {
        if (lowerMessage.includes(keyword)) {
          return response;
        }
      }

      return AI_CONFIG.FALLBACK_RESPONSES.default;
    } catch (configError) {
      console.error("[CHATBOT] Error loading config:", configError);
      return "I'm here to help you understand this application! You can ask me about features, widgets, the canvas, profiles, or how to use different parts of the platform.";
    }
  }
}

// Add a message to the chat
function addMessage(content, sender) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = sender === "ai" ? "🤖" : "👤";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  const messageText = document.createElement("p");
  messageText.textContent = content;

  messageContent.appendChild(messageText);
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageContent);

  chatMessages.appendChild(messageDiv);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  console.log(`[CHATBOT] Added ${sender} message:`, content);
}

// Get AI response using Genkit API
async function getAIResponse(message) {
  try {
    // Import AI config
    const { AI_CONFIG } = await import("../../config/ai-config.js");

    if (!AI_CONFIG.GOOGLE_AI_API_KEY) {
      throw new Error("AI API key not configured");
    }

    console.log("[CHATBOT] Making API request to Google AI...");

    // Make request to Google AI API (Gemini)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.MODEL}:generateContent?key=${AI_CONFIG.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful AI assistant for a web application called "inque". This application has the following features:
              
              - User profiles and authentication
              - Widget management (upload, preview, display)
              - Interactive canvas for drawing and collaboration
              - Timeline management
              - Social features
              - Project management
              
              The user is asking: "${message}"
              
              Please provide a helpful, friendly response that explains features or answers their question. Keep responses concise (under 200 words) and focus on being helpful. If they ask about something not in the app, politely redirect them to the app's features.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      console.log("[CHATBOT] AI response received from API");
      return aiResponse;
    } else {
      throw new Error("Invalid response format from AI API");
    }
  } catch (error) {
    console.error("[CHATBOT] Error in getAIResponse:", error);

    // Fallback to predefined responses
    const fallbackResponses = {
      "what is this application about":
        'This is "inque" - a web application for creative collaboration! It includes user profiles, widget management, interactive canvas, timeline management, and social features.',
      "how do i upload a widget":
        'To upload a widget, click on "Widget Studio" in your profile settings. You can upload HTML, CSS, and JavaScript files, preview them, and then publish them to your profile.',
      "what are the main features":
        "The main features include: user profiles, widget management, interactive canvas for drawing, timeline management, social features, and project management tools.",
      "how do i edit my profile":
        "Click on your profile picture or name to open the profile editor. You can change your name, bio, profile picture, and other settings there.",
      help: "I can help you understand the features of this application! Ask me about widgets, the canvas, profiles, or any other aspect of the platform.",
    };

    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    return "I'm here to help you understand this application! You can ask me about widgets, the canvas, profiles, or how to use different parts of the platform.";
  }
}

// Show typing indicator
function showTypingIndicator() {
  isTyping = true;
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  const typingDiv = document.createElement("div");
  typingDiv.className = "message ai-message typing";
  typingDiv.id = "typingIndicator";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "🤖";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  const messageText = document.createElement("p");
  messageText.textContent = "Thinking...";

  messageContent.appendChild(messageText);
  typingDiv.appendChild(avatar);
  typingDiv.appendChild(messageContent);

  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  console.log("[CHATBOT] Showing typing indicator");
}

// Remove typing indicator
function removeTypingIndicator() {
  isTyping = false;
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.remove();
    console.log("[CHATBOT] Removed typing indicator");
  }
}

// Close chatbot card
function closeChatbot() {
  console.log("[CHATBOT] Closing chatbot card...");
  const chatbotCard = document.getElementById("chatbotCard");
  if (chatbotCard) {
    chatbotCard.classList.remove("open", "minimized");
    console.log("[CHATBOT] Chatbot card closed successfully");
  }
}

// Minimize chatbot card
function minimizeChatbot() {
  console.log("[CHATBOT] Minimizing chatbot card...");
  const chatbotCard = document.getElementById("chatbotCard");
  if (chatbotCard) {
    chatbotCard.classList.add("minimized");
    chatbotCard.classList.remove("open");
    console.log("[CHATBOT] Chatbot card minimized successfully");
  }
}

// Expand chatbot card from minimized state
function expandChatbot() {
  console.log("[CHATBOT] Expanding chatbot card...");
  const chatbotCard = document.getElementById("chatbotCard");
  if (chatbotCard) {
    chatbotCard.classList.add("open");
    chatbotCard.classList.remove("minimized");
    console.log("[CHATBOT] Chatbot card expanded successfully");
  }
}

// Wire up chatbot card controls
function setupChatbotCardControls() {
  console.log("[CHATBOT] Setting up chatbot card event listeners...");

  // Close button
  const chatbotCloseBtn = document.getElementById("chatbotCloseBtn");
  if (chatbotCloseBtn) {
    // Remove any existing listeners first
    chatbotCloseBtn.removeEventListener("click", closeChatbot);
    chatbotCloseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[CHATBOT] Close button clicked");
      closeChatbot();
    });
    console.log("[CHATBOT] Close button event listener attached");
  } else {
    console.warn("[CHATBOT] Close button not found");
  }

  // Minimize button
  const chatbotMinimizeBtn = document.getElementById("chatbotMinimizeBtn");
  if (chatbotMinimizeBtn) {
    // Remove any existing listeners first
    chatbotMinimizeBtn.removeEventListener("click", minimizeChatbot);
    chatbotMinimizeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[CHATBOT] Minimize button clicked");
      minimizeChatbot();
    });
    console.log("[CHATBOT] Minimize button event listener attached");
  } else {
    console.warn("[CHATBOT] Minimize button not found");
  }

  // Click on header to expand from minimized state
  const chatbotCard = document.getElementById("chatbotCard");
  if (chatbotCard) {
    const chatbotHeader = chatbotCard.querySelector(".chatbot-card-header");
    if (chatbotHeader) {
      chatbotHeader.addEventListener("click", (e) => {
        // Don't expand if clicking on control buttons
        if (!e.target.closest(".chatbot-controls")) {
          if (chatbotCard.classList.contains("minimized")) {
            console.log(
              "[CHATBOT] Header clicked - expanding from minimized state"
            );
            expandChatbot();
          }
        }
      });
      console.log("[CHATBOT] Header click event listener attached");
    }
  } else {
    console.warn("[CHATBOT] Chatbot card not found");
  }

  console.log("[CHATBOT] Chatbot card event listeners attached successfully");
}

// Set up controls when DOM is ready
document.addEventListener("DOMContentLoaded", setupChatbotCardControls);

// Also set up controls when the chatbot is opened
function openChatbot() {
  console.log("[CHATBOT] Opening chatbot card...");
  const chatbotCard = document.getElementById("chatbotCard");
  if (chatbotCard) {
    chatbotCard.classList.add("open");
    chatbotCard.classList.remove("minimized");

    // Set up controls when opening
    setTimeout(() => {
      setupChatbotCardControls();
      initializeChatbot();
    }, 100);

    console.log("[CHATBOT] Chatbot card opened successfully");
  } else {
    console.error("[CHATBOT] Chatbot card not found");
  }
}

// Add message to chat
function addMessage(content, sender) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = sender === "user" ? "👤" : "🤖";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  const messageText = document.createElement("p");
  messageText.textContent = content;

  messageContent.appendChild(messageText);
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageContent);

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  console.log(`[CHATBOT] Added ${sender} message:`, content);
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("[CHATBOT] DOM loaded, initializing chatbot components...");

  // Load user context from previous sessions
  loadUserContext();

  // Initialize customer service button
  initializeCustomerServiceButton();

  // Set up chatbot card controls
  setupChatbotCardControls();

  // Expose functions globally for debugging
  window.openChatbot = openChatbot;
  window.closeChatbot = closeChatbot;
  window.minimizeChatbot = minimizeChatbot;
  window.expandChatbot = expandChatbot;

  console.log("[CHATBOT] All chatbot functions exposed globally");
  console.log("[CHATBOT] Available functions:", {
    openChatbot: typeof window.openChatbot,
    closeChatbot: typeof window.closeChatbot,
    minimizeChatbot: typeof window.minimizeChatbot,
    expandChatbot: typeof window.expandChatbot,
  });
});

// Context management functions
function buildContextInfo() {
  const sessionDuration = Math.round(
    (new Date() - new Date(userContext.sessionStart)) / 1000 / 60
  );
  const contextParts = [];

  if (userContext.name) {
    contextParts.push(`User's name: ${userContext.name}`);
  }

  if (userContext.topicsDiscussed.length > 0) {
    contextParts.push(
      `Topics discussed: ${userContext.topicsDiscussed.slice(-3).join(", ")}`
    );
  }

  contextParts.push(`Session duration: ${sessionDuration} minutes`);
  contextParts.push(`Total messages: ${chatHistory.length}`);

  if (userContext.lastInteraction) {
    const timeSince = Math.round(
      (new Date() - new Date(userContext.lastInteraction)) / 1000
    );
    contextParts.push(`Time since last message: ${timeSince} seconds`);
  }

  return contextParts.join("\n");
}

function updateUserContext(userMessage, aiResponse) {
  console.log("[CHATBOT] Updating user context...");

  // Update last interaction time
  userContext.lastInteraction = new Date().toISOString();

  // Extract topics from user message
  const topics = extractTopics(userMessage);
  userContext.topicsDiscussed.push(...topics);

  // Keep only last 10 topics to avoid memory bloat
  if (userContext.topicsDiscussed.length > 10) {
    userContext.topicsDiscussed = userContext.topicsDiscussed.slice(-10);
  }

  // Try to extract user name if mentioned
  const nameMatch = userMessage.match(
    /(?:my name is|i'm|i am|call me)\s+([a-zA-Z]+)/i
  );
  if (nameMatch && !userContext.name) {
    userContext.name = nameMatch[1];
    console.log(`[CHATBOT] User name detected: ${userContext.name}`);
  }

  // Store context in localStorage for persistence
  try {
    localStorage.setItem("chatbot_context", JSON.stringify(userContext));
    console.log("[CHATBOT] Context saved to localStorage");
  } catch (error) {
    console.warn("[CHATBOT] Could not save context to localStorage:", error);
  }
}

function extractTopics(message) {
  const topics = [];
  const lowerMessage = message.toLowerCase();

  const topicKeywords = {
    widgets: ["widget", "upload", "component"],
    canvas: ["canvas", "draw", "drawing", "collaborate"],
    profile: ["profile", "account", "settings"],
    authentication: ["login", "sign in", "auth", "password"],
    timeline: ["timeline", "project", "management"],
    social: ["social", "friend", "follow", "share"],
    ai: ["ai", "artificial intelligence", "chatbot", "agent"],
    security: ["security", "safe", "vulnerability", "scan"],
    code: ["code", "programming", "development", "script"],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      topics.push(topic);
    }
  }

  return topics;
}

// Load context from localStorage on initialization
function loadUserContext() {
  try {
    const savedContext = localStorage.getItem("chatbot_context");
    if (savedContext) {
      const parsed = JSON.parse(savedContext);
      // Merge with current context, keeping session start time
      userContext = { ...parsed, sessionStart: userContext.sessionStart };
      console.log("[CHATBOT] User context loaded from localStorage");
    }
  } catch (error) {
    console.warn("[CHATBOT] Could not load context from localStorage:", error);
  }
}

// Simple caching system for AI responses
const responseCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getCachedResponse(message) {
  try {
    const cacheKey = generateCacheKey(message);
    const cached = responseCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("[CHATBOT] Cache hit for message");
      return cached.response;
    }

    // Remove expired entry
    if (cached) {
      responseCache.delete(cacheKey);
    }

    return null;
  } catch (error) {
    console.warn("[CHATBOT] Error checking cache:", error);
    return null;
  }
}

async function setCachedResponse(message, response) {
  try {
    const cacheKey = generateCacheKey(message);
    responseCache.set(cacheKey, {
      response: response,
      timestamp: Date.now(),
    });

    // Clean up old entries if cache gets too large
    if (responseCache.size > 50) {
      const entries = Array.from(responseCache.entries());
      const cutoff = Date.now() - CACHE_TTL;

      for (const [key, value] of entries) {
        if (value.timestamp < cutoff) {
          responseCache.delete(key);
        }
      }
    }

    console.log(`[CHATBOT] Response cached (${responseCache.size} entries)`);
  } catch (error) {
    console.warn("[CHATBOT] Error caching response:", error);
  }
}

function generateCacheKey(message) {
  // Simple hash function for cache keys
  let hash = 0;
  const str = message.toLowerCase().trim();

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString();
}

// Dynamic suggestion system
function initializeDynamicSuggestions() {
  console.log("[CHATBOT] Initializing dynamic suggestions...");
  updateSuggestions();
}

function updateSuggestions() {
  const suggestionChipsContainer = document.getElementById("suggestionChips");
  const suggestionsTitle = document.getElementById("suggestionsTitle");

  if (!suggestionChipsContainer) {
    console.warn("[CHATBOT] Suggestion chips container not found");
    return;
  }

  // Clear existing suggestions
  suggestionChipsContainer.innerHTML = "";

  // Get context-aware suggestions
  const suggestions = getContextualSuggestions();

  // Update title based on context
  if (userContext.topicsDiscussed.length > 0) {
    suggestionsTitle.textContent =
      "Based on our conversation, you might want to ask:";
  } else {
    suggestionsTitle.textContent = "Quick questions you can ask:";
  }

  // Create suggestion chips
  suggestions.forEach((suggestion) => {
    const chip = document.createElement("button");
    chip.className = "suggestion-chip";
    chip.textContent = suggestion.text;
    chip.setAttribute("data-question", suggestion.text);

    // Add click handler
    chip.addEventListener("click", () => {
      const chatInput = document.getElementById("chatInput");
      if (chatInput) {
        chatInput.value = suggestion.text;
        sendMessage();
      }
    });

    suggestionChipsContainer.appendChild(chip);
  });

  console.log(`[CHATBOT] Updated suggestions: ${suggestions.length} chips`);
}

function getContextualSuggestions() {
  const baseSuggestions = [
    "What is this application about?",
    "How do I upload a widget?",
    "What are the main features?",
    "How do I edit my profile?",
  ];

  // If no context, return base suggestions
  if (userContext.topicsDiscussed.length === 0) {
    return baseSuggestions.map((text) => ({ text, priority: 1 }));
  }

  // Get contextual suggestions based on topics discussed
  const contextualSuggestions = [];
  const recentTopics = userContext.topicsDiscussed.slice(-3);

  // Map topics to relevant suggestions
  const topicSuggestions = {
    widgets: [
      "How do I preview my widgets?",
      "What file types can I upload?",
      "How do I organize my widgets?",
    ],
    canvas: [
      "How do I collaborate on the canvas?",
      "What drawing tools are available?",
      "How do I save my canvas work?",
    ],
    profile: [
      "How do I change my profile picture?",
      "What information can I add to my profile?",
      "How do I make my profile public?",
    ],
    ai: [
      "What AI agents are available?",
      "How do I run a security scan?",
      "Can the AI help with code analysis?",
    ],
    security: [
      "How do I scan my code for vulnerabilities?",
      "What security features are available?",
      "How do I fix security issues?",
    ],
    code: [
      "How do I analyze my code quality?",
      "Can the AI generate documentation?",
      "What development tools are available?",
    ],
  };

  // Add suggestions based on recent topics
  recentTopics.forEach((topic) => {
    if (topicSuggestions[topic]) {
      topicSuggestions[topic].forEach((suggestion) => {
        contextualSuggestions.push({ text: suggestion, priority: 2 });
      });
    }
  });

  // Add some general follow-up suggestions
  contextualSuggestions.push(
    { text: "Tell me more about that", priority: 1 },
    { text: "What else can I do?", priority: 1 },
    { text: "Show me advanced features", priority: 1 }
  );

  // Remove duplicates and limit to 4 suggestions
  const uniqueSuggestions = contextualSuggestions
    .filter(
      (suggestion, index, self) =>
        index === self.findIndex((s) => s.text === suggestion.text)
    )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map((s) => s.text);

  return uniqueSuggestions.length > 0 ? uniqueSuggestions : baseSuggestions;
}

console.log("[CHATBOT] AI chatbot functionality loaded");
