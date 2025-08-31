import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  auth,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const usersContainer = document.getElementById("users-container");
  const chatModal = document.getElementById("chatModal");
  const chatWithUserEl = document.getElementById("chat-with-user");
  const closeChatBtn = document.getElementById("closeChat");
  const chatMessagesEl = document.getElementById("chat-messages");
  const chatMessageInput = document.getElementById("chat-message-input");
  const chatSendBtn = document.getElementById("chat-send-btn");

  // Error Modal Elements
  const errorModal = document.getElementById("errorModal");
  const errorTitle = document.getElementById("errorTitle");
  const errorMessage = document.getElementById("errorMessage");
  const errorRetryBtn = document.getElementById("errorRetryBtn");
  const errorCloseBtn = document.getElementById("errorCloseBtn");

  // State Management
  let currentUser = null;
  let unsubscribeFromChat = null;
  let currentChatRoomId = null;
  let isLoading = true;

  // Initialize the app
  initializeApp();

  function initializeApp() {
    // Set up error modal event listeners
    errorCloseBtn.addEventListener("click", hideErrorModal);
    errorRetryBtn.addEventListener("click", () => {
      hideErrorModal();
      fetchUsers();
    });

    // Set up chat modal event listeners
    closeChatBtn.addEventListener("click", closeChat);
    chatSendBtn.addEventListener("click", sendMessage);
    chatMessageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      if (user) {
        console.log("User authenticated:", user.uid);
        fetchUsers();
      } else {
        console.log("No user authenticated");
        showEmptyState("Please log in to view users");
      }
    });
  }

  // === ERROR HANDLING ===
  function showErrorModal(title, message, retryFunction = null) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorModal.classList.add("show");

    // Store retry function if provided
    if (retryFunction) {
      errorRetryBtn.onclick = () => {
        hideErrorModal();
        retryFunction();
      };
    }
  }

  function hideErrorModal() {
    errorModal.classList.remove("show");
  }

  function logError(error, context = "Unknown") {
    console.error(`Error in ${context}:`, error);

    // Determine error type and show appropriate message
    let title = "Error";
    let message = "An unexpected error occurred.";

    if (error.code === "permission-denied") {
      title = "Access Denied";
      message =
        "You don't have permission to access this feature. Please log in.";
    } else if (error.code === "unavailable") {
      title = "Connection Error";
      message =
        "Unable to connect to the server. Please check your internet connection.";
    } else if (error.code === "not-found") {
      title = "Not Found";
      message = "The requested resource was not found.";
    } else if (error.message.includes("recaptcha")) {
      title = "Security Check Failed";
      message = "The security verification failed. Please try again.";
    }

    showErrorModal(title, message);
  }

  // === LOADING STATES ===
  function showLoading() {
    isLoading = true;
    usersContainer.innerHTML = `
      <div class="users-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading Users...</div>
      </div>
    `;
  }

  function showEmptyState(message) {
    isLoading = false;
    usersContainer.innerHTML = `
      <div class="users-empty">
        <h3>No Users Found</h3>
        <p>${message}</p>
      </div>
    `;
  }

  // === USER FETCHING ===
  const fetchUsers = async () => {
    if (!usersContainer) return;

    showLoading();

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = [];

      usersSnapshot.forEach((doc) => {
        if (currentUser && doc.id === currentUser.uid) return; // Don't show current user
        users.push({ id: doc.id, ...doc.data() });
      });

      if (users.length === 0) {
        showEmptyState("No other users found. Be the first to join!");
        return;
      }

      renderUsers(users);
    } catch (error) {
      logError(error, "fetchUsers");
      showEmptyState("Failed to load users. Please try again.");
    }
  };

  function renderUsers(users) {
    isLoading = false;
    usersContainer.innerHTML = "";

    users.forEach((userData) => {
      const card = createUserCard(userData);
      usersContainer.appendChild(card);
    });
  }

  function createUserCard(userData) {
    const card = document.createElement("div");
    card.className = "user-card";
    card.dataset.uid = userData.id;
    card.dataset.name = userData.name;

    card.innerHTML = `
      <div class="user-card-pic" style="background-image: url(${
        userData.photoURL || "assets/imgs/portal_placeholder.gif"
      })"></div>
      <h3 class="user-card-name">${userData.name || "Anonymous User"}</h3>
      <div class="user-card-hover">
        <button class="chat-btn">Chat</button>
        <a href="/?user=${
          userData.id
        }" class="view-profile-btn">View Profile</a>
      </div>
    `;

    // Add event listeners
    const chatBtn = card.querySelector(".chat-btn");
    chatBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleChatClick(userData);
    });

    return card;
  }

  function handleChatClick(userData) {
    if (!currentUser) {
      showErrorModal(
        "Login Required",
        "Please log in to start a chat with other users.",
        () => {
          // Redirect to login or show login modal
          window.location.href = "/";
        }
      );
      return;
    }

    openChat(userData.id, userData.name);
  }

  // === CHAT FUNCTIONALITY ===
  function openChat(otherUserId, otherUserName) {
    try {
      chatWithUserEl.textContent = `Chat with ${otherUserName}`;

      // Create a consistent chat room ID
      const uids = [currentUser.uid, otherUserId].sort();
      currentChatRoomId = `chat_${uids[0]}_${uids[1]}`;

      chatMessagesEl.innerHTML = ""; // Clear previous messages
      chatModal.style.display = "flex";

      // Listen for new messages
      const messagesRef = collection(
        db,
        "chats",
        currentChatRoomId,
        "messages"
      );
      const q = query(messagesRef, orderBy("timestamp", "asc"), limit(50));

      unsubscribeFromChat = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const msgData = change.doc.data();
              addMessageToChat(msgData);
            }
          });
          // Scroll to the bottom
          chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        },
        (error) => {
          logError(error, "chatListener");
        }
      );
    } catch (error) {
      logError(error, "openChat");
    }
  }

  function addMessageToChat(msgData) {
    const messageEl = document.createElement("div");
    messageEl.className = "message";
    messageEl.classList.add(
      msgData.senderId === currentUser.uid ? "sent" : "received"
    );
    messageEl.textContent = msgData.text;
    chatMessagesEl.appendChild(messageEl);
  }

  async function sendMessage() {
    const messageText = chatMessageInput.value.trim();
    if (messageText === "" || !currentChatRoomId || !currentUser) return;

    try {
      // Disable send button while sending
      chatSendBtn.disabled = true;
      chatSendBtn.textContent = "Sending...";

      const messagesRef = collection(
        db,
        "chats",
        currentChatRoomId,
        "messages"
      );
      await addDoc(messagesRef, {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });

      chatMessageInput.value = "";
    } catch (error) {
      logError(error, "sendMessage");
      showErrorModal(
        "Send Failed",
        "Failed to send message. Please try again."
      );
    } finally {
      // Re-enable send button
      chatSendBtn.disabled = false;
      chatSendBtn.textContent = "Send";
    }
  }

  function closeChat() {
    chatModal.style.display = "none";
    if (unsubscribeFromChat) {
      unsubscribeFromChat();
      unsubscribeFromChat = null;
    }
    currentChatRoomId = null;
    chatMessageInput.value = "";
  }

  // === GLOBAL ERROR HANDLER ===
  window.addEventListener("error", (event) => {
    logError(event.error, "Global Error");
  });

  window.addEventListener("unhandledrejection", (event) => {
    logError(event.reason, "Unhandled Promise Rejection");
  });

  // === RECAPTCHA ERROR HANDLER ===
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "recaptcha-error") {
      showErrorModal(
        "Security Check Failed",
        "The security verification failed. Please refresh the page and try again."
      );
    }
  });
});
