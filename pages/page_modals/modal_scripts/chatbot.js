console.log("[CHATBOT] Initializing AI chatbot...");

// Chatbot state
let chatHistory = [];
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

  // Add suggestion chip event listeners
  const suggestionChips = document.querySelectorAll(".suggestion-chip");
  suggestionChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const question = chip.textContent.trim();
      chatInput.value = question;
      sendMessage();
    });
  });

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

    // Add to chat history
    chatHistory.push({ role: "user", content: message });
    chatHistory.push({ role: "assistant", content: response });
  } catch (error) {
    console.error("[CHATBOT] Error getting AI response:", error);
    removeTypingIndicator();
    addMessage("Sorry, I encountered an error. Please try again.", "ai");
  }
}

// Get AI response using Genkit
async function getAIResponse(message) {
    console.log('[CHATBOT] Getting AI response for:', message);
    
    try {
      // Import configuration and Google AI
      const { AI_CONFIG, getApiKey, isAIConfigured } = await import('./config/ai-config.js');
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      // Check if AI is properly configured
      if (!isAIConfigured()) {
        console.warn('[CHATBOT] AI not configured, using fallback responses');
        throw new Error('AI not configured');
      }
      
      // Initialize Google AI with API key from config
      const genAI = new GoogleGenerativeAI(getApiKey());
      
      // Create a simple prompt for application features
      const prompt = `You are a helpful AI assistant for a web application. The user asked: "${message}"
      
      This application has the following features:
      - User authentication and profiles
      - Widget upload and management system
      - Interactive canvas for drawing and collaboration
      - Timeline-based project management
      - Social features and user interactions
      - File upload and storage capabilities
      
      Please provide a helpful, friendly response explaining how these features work or answering the user's question. Keep responses concise but informative (max ${AI_CONFIG.MAX_RESPONSE_LENGTH} characters).`;
      
      // Get response from Gemini
      const model = genAI.getGenerativeModel({ model: AI_CONFIG.MODEL });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      console.log('[CHATBOT] AI response received:', response);
      return response;
      
    } catch (error) {
      console.error('[CHATBOT] Error with AI integration:', error);
      
      // Use fallback responses from config
      try {
        const { AI_CONFIG } = await import('./config/ai-config.js');
        
        // Check if message contains keywords for fallback responses
        const lowerMessage = message.toLowerCase();
        for (const [keyword, response] of Object.entries(AI_CONFIG.FALLBACK_RESPONSES)) {
          if (lowerMessage.includes(keyword)) {
            return response;
          }
        }
        
        return AI_CONFIG.FALLBACK_RESPONSES.default;
      } catch (configError) {
        console.error('[CHATBOT] Error loading config:', configError);
        return 'I\'m here to help you understand this application! You can ask me about features, widgets, the canvas, profiles, or how to use different parts of the platform.';
      }
    }
  }
  
  // Add a message to the chat
  function addMessage(content, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'ai' ? '🤖' : '👤';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('p');
    messageText.textContent = content;
    
    messageContent.appendChild(messageText);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    console.log(`[CHATBOT] Added ${sender} message:`, content);
  }
  
  // Send message to AI and get response
  async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message || isTyping) return;
    
    console.log('[CHATBOT] Sending message:', message);
    
    // Add user message to chat
    addMessage('user', message);
    
    // Clear input
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
      // Get AI response
      const response = await getAIResponse(message);
      
      // Remove typing indicator
      removeTypingIndicator();
      
      // Add AI response
      addMessage('ai', response);
      
      console.log('[CHATBOT] AI response received:', response);
    } catch (error) {
      console.error('[CHATBOT] Error getting AI response:', error);
      
      // Remove typing indicator
      removeTypingIndicator();
      
      // Show error message
      addMessage('ai', 'Sorry, I encountered an error. Please try again or ask a different question.');
    }
  }
  
  // Get AI response using Genkit API
  async function getAIResponse(message) {
    try {
      // Import AI config
      const { AI_CONFIG } = await import('./config/ai-config.js');
      
      if (!AI_CONFIG.GOOGLE_AI_API_KEY) {
        throw new Error('AI API key not configured');
      }
      
      console.log('[CHATBOT] Making API request to Google AI...');
      
      // Make request to Google AI API (Gemini)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.MODEL}:generateContent?key=${AI_CONFIG.GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful AI assistant for a web application called "inque". This application has the following features:
              
              - User profiles and authentication
              - Widget management (upload, preview, display)
              - Interactive canvas for drawing and collaboration
              - Timeline management
              - Social features
              - Project management
              
              The user is asking: "${message}"
              
              Please provide a helpful, friendly response that explains features or answers their question. Keep responses concise (under 200 words) and focus on being helpful. If they ask about something not in the app, politely redirect them to the app's features.`
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('[CHATBOT] AI response received from API');
        return aiResponse;
      } else {
        throw new Error('Invalid response format from AI API');
      }
      
    } catch (error) {
      console.error('[CHATBOT] Error in getAIResponse:', error);
      
      // Fallback to predefined responses
      const fallbackResponses = {
        'what is this application about': 'This is "inque" - a web application for creative collaboration! It includes user profiles, widget management, interactive canvas, timeline management, and social features.',
        'how do i upload a widget': 'To upload a widget, click on "Widget Studio" in your profile settings. You can upload HTML, CSS, and JavaScript files, preview them, and then publish them to your profile.',
        'what are the main features': 'The main features include: user profiles, widget management, interactive canvas for drawing, timeline management, social features, and project management tools.',
        'how do i edit my profile': 'Click on your profile picture or name to open the profile editor. You can change your name, bio, profile picture, and other settings there.',
        'help': 'I can help you understand the features of this application! Ask me about widgets, the canvas, profiles, or any other aspect of the platform.'
      };
      
      const lowerMessage = message.toLowerCase();
      for (const [key, response] of Object.entries(fallbackResponses)) {
        if (lowerMessage.includes(key)) {
          return response;
        }
      }
      
      return 'I\'m here to help you understand this application! You can ask me about features, widgets, the canvas, profiles, or how to use different parts of the platform.';
    }
  }
  
  // Initialize chatbot functionality
  function initializeChatbot() {
    console.log('[CHATBOT] Initializing chatbot...');
    
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    
    if (!chatInput || !sendChatBtn) {
      console.error('[CHATBOT] Required chatbot elements not found');
      return;
    }
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Send message on button click
    sendChatBtn.addEventListener('click', sendMessage);
    
    // Handle suggestion chips
    suggestionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const question = chip.getAttribute('data-question');
        if (question) {
          console.log('[CHATBOT] Suggestion chip clicked:', question);
          document.getElementById('chatInput').value = question;
          sendMessage();
        }
      });
    });
    
    console.log('[CHATBOT] Chatbot initialized successfully');
  }
  
  // Show typing indicator
  function showTypingIndicator() {
    isTyping = true;
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing';
    typingDiv.id = 'typingIndicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('p');
    messageText.textContent = 'Thinking...';
    
    messageContent.appendChild(messageText);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(messageContent);
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    console.log('[CHATBOT] Showing typing indicator');
  }
  
  // Remove typing indicator
  function removeTypingIndicator() {
    isTyping = false;
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
      typingIndicator.remove();
      console.log('[CHATBOT] Removed typing indicator');
    }
  }
  
  // Open chatbot modal
  function openChatbot() {
    console.log('[CHATBOT] Opening chatbot modal...');
    const chatbotModal = document.getElementById('chatbotModal');
    if (chatbotModal) {
      chatbotModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      
      // Initialize chatbot when modal opens
      setTimeout(() => {
        initializeChatbot();
      }, 100);
      
      console.log('[CHATBOT] Chatbot modal opened successfully');
    } else {
      console.error('[CHATBOT] Chatbot modal not found');
    }
  }
  
  // Close chatbot modal
  function closeChatbot() {
    console.log('[CHATBOT] Closing chatbot modal...');
    const chatbotModal = document.getElementById('chatbotModal');
    if (chatbotModal) {
      chatbotModal.style.display = 'none';
      document.body.style.overflow = '';
      console.log('[CHATBOT] Chatbot modal closed successfully');
    }
  }
  
  // Wire up chatbot close buttons
  document.addEventListener('DOMContentLoaded', () => {
    const chatbotCloseBtns = document.querySelectorAll('.chatbot-close-button');
    chatbotCloseBtns.forEach(btn => {
      btn.addEventListener('click', closeChatbot);
    });
    
    // Close on backdrop click
    const chatbotModal = document.getElementById('chatbotModal');
    if (chatbotModal) {
      chatbotModal.addEventListener('click', (e) => {
        if (e.target === chatbotModal) {
          closeChatbot();
        }
      });
    }
    
    console.log('[CHATBOT] Chatbot event listeners attached');
  });
  
  // Add message to chat
  function addMessage(sender, content) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('p');
    messageText.textContent = content;
    
    messageContent.appendChild(messageText);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    console.log(`[CHATBOT] Added ${sender} message:`, content);
  }
  
  // Global typing state
  let isTyping = false;
  
  console.log('[CHATBOT] AI chatbot functionality loaded');
