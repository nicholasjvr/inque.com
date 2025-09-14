// Minimal chatbot module to satisfy builds and enable basic behavior
// Exposes a global initializer used by main.js

console.log("[CHATBOT] Chatbot module loaded");

window.initializeChatbot = function initializeChatbot() {
  console.log("[CHATBOT] initializeChatbot called");
};

export {}; // keep as ES module
