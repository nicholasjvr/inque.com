import { db, auth } from "../../../script.js";
import {
  collection,
  getDocs,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const usersContainer = document.getElementById("users-container");
  const chatModal = document.getElementById("chatModal");
  const chatWithUserEl = document.getElementById("chat-with-user");
  const closeChatBtn = document.getElementById("closeChat");
  const chatMessagesEl = document.getElementById("chat-messages");
  const chatMessageInput = document.getElementById("chat-message-input");
  const chatSendBtn = document.getElementById("chat-send-btn");

  let currentUser = null;
  let unsubscribeFromChat = null;
  let currentChatRoomId = null;

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    fetchUsers();
  });

  const fetchUsers = async () => {
    if (!usersContainer) return;
    usersContainer.innerHTML = ""; // Clear existing users

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      usersSnapshot.forEach((doc) => {
        if (currentUser && doc.id === currentUser.uid) return; // Don't show current user

        const userData = doc.data();
        const card = document.createElement("div");
        card.className = "user-card";
        card.dataset.uid = doc.id;
        card.dataset.name = userData.name;

        card.innerHTML = `
                  <div class="user-card-pic" style="background-image: url(${
                    userData.photoURL || "assets/imgs/portal_placeholder.gif"
                  })"></div>
                  <h3 class="user-card-name">${userData.name}</h3>
                  <div class="user-card-hover">
                      <button class="chat-btn">Chat</button>
                      <a href="/?user=${
                        doc.id
                      }" class="view-profile-btn">View Profile</a>
                  </div>
              `;

        const chatBtn = card.querySelector(".chat-btn");
        chatBtn.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent card click from firing
          if (!currentUser) {
            alert("Please log in to start a chat.");
            return;
          }
          openChat(doc.id, userData.name);
        });

        // The whole card is no longer a single chat link.
        // card.addEventListener("click", () => {
        //   if (!currentUser) {
        //     alert("Please log in to start a chat.");
        //     return;
        //   }
        //   openChat(doc.id, userData.name);
        // });

        usersContainer.appendChild(card);
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      usersContainer.innerHTML = "<p>Could not load users.</p>";
    }
  };

  const openChat = (otherUserId, otherUserName) => {
    chatWithUserEl.textContent = `Chat with ${otherUserName}`;

    // Create a consistent chat room ID
    const uids = [currentUser.uid, otherUserId].sort();
    currentChatRoomId = `chat_${uids[0]}_${uids[1]}`;

    chatMessagesEl.innerHTML = ""; // Clear previous messages
    chatModal.style.display = "flex";

    // Listen for new messages
    const messagesRef = collection(db, "chats", currentChatRoomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"), limit(50));

    unsubscribeFromChat = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msgData = change.doc.data();
          const messageEl = document.createElement("div");
          messageEl.className = "message";
          messageEl.classList.add(
            msgData.senderId === currentUser.uid ? "sent" : "received"
          );
          messageEl.textContent = msgData.text;
          chatMessagesEl.appendChild(messageEl);
        }
      });
      // Scroll to the bottom
      chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    });
  };

  const sendMessage = async () => {
    const messageText = chatMessageInput.value.trim();
    if (messageText === "" || !currentChatRoomId || !currentUser) return;

    try {
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
      console.error("Error sending message:", error);
    }
  };

  chatSendBtn.addEventListener("click", sendMessage);
  chatMessageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  closeChatBtn.addEventListener("click", () => {
    chatModal.style.display = "none";
    if (unsubscribeFromChat) {
      unsubscribeFromChat();
      unsubscribeFromChat = null;
    }
    currentChatRoomId = null;
  });
});
