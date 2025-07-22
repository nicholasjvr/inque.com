import { auth, db, storage } from "../script.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements for Auth Modal
  const authModal = document.getElementById("authModal");
  const authCloseBtn = document.querySelector(".auth-close-button");
  const loginForm = document.getElementById("loginForm");
  const signUpForm = document.getElementById("signUpForm");
  const showSignUp = document.getElementById("showSignUp");
  const showLogin = document.getElementById("showLogin");
  const authModalTitle = document.getElementById("authModalTitle");
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const githubLoginBtn = document.getElementById("githubLoginBtn");

  // DOM Elements for Profile Banner & Edit
  const profilePicContainer = document.querySelector(".profile-pic-container");
  const profileName = document.querySelector(".profile-name");
  const profileBio = document.querySelector(".profile-bio");
  const profileLvl = document.getElementById("profileLvl");
  const profileType = document.getElementById("profileType");
  const profileRole = document.getElementById("profileRole");
  const profileStatusIndicator = document.getElementById(
    "profileStatusIndicator"
  );
  const profileStatus = document.getElementById("profileStatus");
  const editProfileQuickBtn = document.getElementById("editProfileQuickBtn");
  const editProfileModal = document.getElementById("editProfileModal");
  const editProfileForm = document.getElementById("editProfileForm");
  const editPhotoInput = document.getElementById("editPhoto");
  const editProfileCloseBtn = document.querySelector(
    ".edit-profile-close-button"
  );

  // DOM Elements for Sidebar
  const sidebarAvatar = document.querySelector(".sidebar-avatar");
  const sidebarUserName = document.querySelector(".sidebar-user-name");
  const sidebarUserEmail = document.querySelector(".sidebar-user-email");
  const sidebarUserStatus = document.querySelector(".sidebar-user-status");
  const sidebarStatusDot = document.querySelector(".status-dot");
  const sidebarLoginBtn = document.getElementById("sidebarLoginBtn");
  const sidebarUserActions = document.getElementById("sidebarUserActions");
  const sidebarEditProfileBtn = document.getElementById(
    "sidebarEditProfileBtn"
  );
  const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");

  // DOM Elements for Sidebar Stats
  const sidebarStats = document.querySelector(".sidebar-stats");
  const sidebarLvl = document.getElementById("sidebarLvl");
  const sidebarType = document.getElementById("sidebarType");
  const sidebarRole = document.getElementById("sidebarRole");

  // DOM Elements for Notifications
  const notificationCount = document.getElementById("notificationCount");
  const notificationList = document.getElementById("notificationList");
  const markAllReadBtn = document.getElementById("markAllReadBtn");

  let currentUserProfile = null;
  let selectedFile = null;
  let notificationUnsubscribe = null; // For cleaning up real-time listeners

  const defaultProfile = {
    name: "Welcome to inque!",
    bio: "This is a space to create, share, and display your interactive projects. Sign up to start building your personal widget dashboard.",
    lvl: "LVL • ?",
    type: "TYPE • ?",
    role: "ROLE • GUEST",
    photoURL:
      "https://i.pinimg.com/originals/3c/69/1d/3c691d9047d7fb33383a8b417c8e9b67.jpg",
  };

  // ===== NOTIFICATION SYSTEM =====

  // Create a new notification in Firestore
  const createNotification = async (userId, notificationData) => {
    try {
      const notification = {
        userId: userId,
        type: notificationData.type || "system",
        title: notificationData.title,
        message: notificationData.message,
        read: false,
        timestamp: serverTimestamp(),
        data: notificationData.data || {},
        icon: notificationData.icon || "🔔",
      };

      await addDoc(collection(db, "notifications"), notification);
      console.log("Notification created:", notification);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async (userId) => {
    try {
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("read", "==", false)
      );

      const querySnapshot = await getDocs(notificationsQuery);
      const updatePromises = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);
      console.log("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Set up real-time notification listener
  const setupNotificationListener = (userId) => {
    // Clean up previous listener if exists
    if (notificationUnsubscribe) {
      notificationUnsubscribe();
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    notificationUnsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        // Clear current notifications
        notificationList.innerHTML = "";

        let unreadCount = 0;
        let hasNotifications = false;

        snapshot.forEach((doc) => {
          const notification = { id: doc.id, ...doc.data() };
          hasNotifications = true;

          if (!notification.read) {
            unreadCount++;
          }

          // Create notification element
          const notificationItem = createNotificationElement(notification);
          notificationList.appendChild(notificationItem);
        });

        // Update notification count
        if (notificationCount) {
          notificationCount.textContent = unreadCount;
          notificationCount.style.display =
            unreadCount > 0 ? "inline-block" : "none";
        }

        // Show/hide mark all as read button
        if (markAllReadBtn) {
          markAllReadBtn.style.display =
            unreadCount > 0 ? "inline-block" : "none";
        }

        // Show empty state if no notifications
        if (!hasNotifications) {
          const emptyItem = document.createElement("div");
          emptyItem.className = "notification-item empty-notification";
          emptyItem.innerHTML =
            '<span class="notification-text">No new notifications</span>';
          notificationList.appendChild(emptyItem);
        }
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );
  };

  // Create notification element
  const createNotificationElement = (notification) => {
    const notificationItem = document.createElement("div");
    notificationItem.className = `notification-item ${notification.type} ${
      notification.read ? "read" : "unread"
    }`;
    notificationItem.dataset.notificationId = notification.id;

    const timestamp = notification.timestamp
      ? new Date(notification.timestamp.toDate()).toLocaleString()
      : "Just now";

    notificationItem.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-icon">${notification.icon}</span>
          <span class="notification-title">${notification.title}</span>
          ${!notification.read ? '<span class="unread-indicator"></span>' : ""}
        </div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${timestamp}</div>
      </div>
      <button class="notification-close" aria-label="Dismiss notification">&times;</button>
    `;

    // Add click handler to mark as read
    notificationItem.addEventListener("click", (e) => {
      if (!e.target.classList.contains("notification-close")) {
        markNotificationAsRead(notification.id);
        handleNotificationAction(notification);
      }
    });

    // Add close button handler
    const closeBtn = notificationItem.querySelector(".notification-close");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notificationItem.remove();
    });

    return notificationItem;
  };

  // Handle notification actions based on type
  const handleNotificationAction = (notification) => {
    switch (notification.type) {
      case "mention":
        // Navigate to the post where user was mentioned
        if (notification.data.postId) {
          console.log("Navigate to post:", notification.data.postId);
          // window.location.href = `/post/${notification.data.postId}`;
        }
        break;
      case "like":
        // Navigate to the liked post
        if (notification.data.postId) {
          console.log("Navigate to liked post:", notification.data.postId);
          // window.location.href = `/post/${notification.data.postId}`;
        }
        break;
      case "follow":
        // Navigate to the follower's profile
        if (notification.data.followerId) {
          console.log(
            "Navigate to follower profile:",
            notification.data.followerId
          );
          // window.location.href = `/?user=${notification.data.followerId}`;
        }
        break;
      case "widget":
        // Open the widget
        if (notification.data.widgetId) {
          console.log("Open widget:", notification.data.widgetId);
          // openWidgetModal(notification.data.widgetPath, notification.data.widgetTitle);
        }
        break;
      default:
        console.log("Notification clicked:", notification);
    }
  };

  // Add local notification (for immediate feedback)
  const addLocalNotification = (message, type = "info") => {
    const notificationItem = document.createElement("div");
    notificationItem.className = `notification-item ${type} local`;
    notificationItem.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <span class="notification-icon">🔔</span>
          <span class="notification-title">System</span>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-time">Just now</div>
      </div>
      <button class="notification-close" aria-label="Dismiss notification">&times;</button>
    `;

    // Remove empty notification if it exists
    const emptyNotification = notificationList.querySelector(
      ".empty-notification"
    );
    if (emptyNotification) {
      emptyNotification.remove();
    }

    notificationList.insertBefore(
      notificationItem,
      notificationList.firstChild
    );

    // Update notification count
    const currentCount = parseInt(notificationCount.textContent || "0") + 1;
    if (notificationCount) {
      notificationCount.textContent = currentCount;
      notificationCount.style.display = "inline-block";
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notificationItem.parentNode) {
        notificationItem.remove();
        const newCount = Math.max(0, currentCount - 1);
        if (notificationCount) {
          notificationCount.textContent = newCount;
          notificationCount.style.display =
            newCount > 0 ? "inline-block" : "none";
        }

        // Show empty message if no notifications
        if (notificationList.children.length === 0) {
          const emptyItem = document.createElement("div");
          emptyItem.className = "notification-item empty-notification";
          emptyItem.innerHTML =
            '<span class="notification-text">No new notifications</span>';
          notificationList.appendChild(emptyItem);
        }
      }
    }, 5000);

    // Add close button handler
    const closeBtn = notificationItem.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      notificationItem.remove();
    });
  };

  // Create sample notifications for testing
  const createSampleNotifications = async (userId) => {
    const sampleNotifications = [
      {
        type: "mention",
        title: "You were mentioned",
        message: "@developer mentioned you in their latest post",
        icon: "👋",
        data: { postId: "sample-post-1", mentionedBy: "developer" },
      },
      {
        type: "like",
        title: "New like",
        message: 'Someone liked your widget "Quote Builder"',
        icon: "❤️",
        data: { postId: "sample-post-2", likedBy: "user123" },
      },
      {
        type: "follow",
        title: "New follower",
        message: "designer_pro joined your followers",
        icon: "👥",
        data: { followerId: "designer_pro" },
      },
      {
        type: "widget",
        title: "Widget featured",
        message: 'Your widget "Quote Builder" was featured on the homepage',
        icon: "⭐",
        data: {
          widgetId: "quote-builder",
          widgetPath: "widgets/app-widget-1/widget.html",
        },
      },
    ];

    for (const notification of sampleNotifications) {
      await createNotification(userId, notification);
    }
  };

  const updateProfileBanner = (profileData, isLoggedIn = false) => {
    currentUserProfile = profileData;

    // Update profile name
    if (profileName) {
      profileName.textContent = profileData.name;
    }

    // Update profile bio
    if (profileBio) {
      profileBio.textContent = profileData.bio;
    }

    // Update profile stats
    if (profileLvl) {
      profileLvl.textContent = profileData.lvl.replace("LVL • ", "");
    }
    if (profileType) {
      profileType.textContent = profileData.type.replace("TYPE • ", "");
    }
    if (profileRole) {
      profileRole.textContent = profileData.role.replace("ROLE • ", "");
    }

    // Update profile picture
    if (profilePicContainer) {
      profilePicContainer.style.backgroundImage = `url(${
        profileData.photoURL || defaultProfile.photoURL
      })`;
    }

    // Update status indicator
    if (profileStatusIndicator) {
      if (isLoggedIn) {
        profileStatusIndicator.className = "profile-status-indicator online";
      } else {
        profileStatusIndicator.className = "profile-status-indicator offline";
      }
    }

    // Update status badge
    if (profileStatus) {
      const statusBadge = profileStatus.querySelector(".status-badge");
      if (statusBadge) {
        statusBadge.className = `status-badge ${isLoggedIn ? "user" : "guest"}`;
        statusBadge.textContent = isLoggedIn ? "User" : "Guest";
      }
    }

    // Update sidebar profile pic
    if (sidebarAvatar) {
      sidebarAvatar.style.backgroundImage = `url(${
        profileData.photoURL || defaultProfile.photoURL
      })`;
    }
  };

  const updateSidebarUserInfo = (
    profileData,
    isLoggedIn = false,
    userEmail = null
  ) => {
    if (sidebarAvatar) {
      sidebarAvatar.style.backgroundImage = `url(${
        profileData.photoURL || defaultProfile.photoURL
      })`;
    }

    if (sidebarUserName) {
      sidebarUserName.textContent = isLoggedIn ? profileData.name : "Guest";
    }

    // Update email display
    if (sidebarUserEmail) {
      if (isLoggedIn && userEmail) {
        sidebarUserEmail.textContent = userEmail;
        sidebarUserEmail.style.display = "block";
      } else {
        sidebarUserEmail.style.display = "none";
      }
    }

    if (sidebarUserStatus && sidebarStatusDot) {
      if (isLoggedIn) {
        sidebarUserStatus.innerHTML =
          '<span class="status-dot logged-in"></span> Logged in';
      } else {
        sidebarUserStatus.innerHTML =
          '<span class="status-dot guest"></span> Not logged in';
      }
    }

    // Show/hide correct buttons
    if (sidebarLoginBtn) {
      sidebarLoginBtn.style.display = isLoggedIn ? "none" : "block";
    }

    if (sidebarUserActions) {
      sidebarUserActions.style.display = isLoggedIn ? "block" : "none";
    }

    // Show/hide stats section
    if (sidebarStats) {
      sidebarStats.style.display = isLoggedIn ? "block" : "none";
    }

    // Update stats values
    if (sidebarLvl) {
      sidebarLvl.textContent = isLoggedIn
        ? profileData.lvl.replace("LVL • ", "")
        : "?";
    }
    if (sidebarType) {
      sidebarType.textContent = isLoggedIn
        ? profileData.type.replace("TYPE • ", "")
        : "?";
    }
    if (sidebarRole) {
      sidebarRole.textContent = isLoggedIn
        ? profileData.role.replace("ROLE • ", "")
        : "GUEST";
    }
  };

  // Quick Actions Event Listeners
  const quickActionBtns = document.querySelectorAll(".quick-action-btn");
  quickActionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      console.log(`Quick action clicked: ${action}`);

      switch (action) {
        case "newWidget":
          alert("Create new widget functionality coming soon!");
          break;
        case "shareProfile":
          if (navigator.share) {
            navigator.share({
              title: "Check out my profile!",
              url: window.location.href,
            });
          } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Profile URL copied to clipboard!");
          }
          break;
        case "settings":
          alert("Settings panel coming soon!");
          break;
        case "testNotifications":
          if (auth.currentUser) {
            createSampleNotifications(auth.currentUser.uid);
            addLocalNotification(
              "Sample notifications created! Check the sidebar.",
              "success"
            );
          } else {
            addLocalNotification(
              "Please log in to test notifications.",
              "info"
            );
          }
          break;
      }
    });
  });

  // Notification Functions
  const addNotification = (message, type = "info") => {
    const notificationItem = document.createElement("div");
    notificationItem.className = `notification-item ${type}`;
    notificationItem.innerHTML = `<span class="notification-text">${message}</span>`;

    // Remove empty notification if it exists
    const emptyNotification = notificationList.querySelector(
      ".empty-notification"
    );
    if (emptyNotification) {
      emptyNotification.remove();
    }

    notificationList.insertBefore(
      notificationItem,
      notificationList.firstChild
    );

    // Update notification count
    const currentCount = notificationList.children.length;
    if (notificationCount) {
      notificationCount.textContent = currentCount;
      notificationCount.style.display =
        currentCount > 0 ? "inline-block" : "none";
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notificationItem.parentNode) {
        notificationItem.remove();
        const newCount = notificationList.children.length;
        if (notificationCount) {
          notificationCount.textContent = newCount;
          notificationCount.style.display =
            newCount > 0 ? "inline-block" : "none";
        }

        // Show empty message if no notifications
        if (newCount === 0) {
          const emptyItem = document.createElement("div");
          emptyItem.className = "notification-item empty-notification";
          emptyItem.innerHTML =
            '<span class="notification-text">No new notifications</span>';
          notificationList.appendChild(emptyItem);
        }
      }
    }, 5000);
  };

  // Toggle forms
  showSignUp.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    signUpForm.style.display = "block";
    authModalTitle.textContent = "Sign Up";
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    signUpForm.style.display = "none";
    loginForm.style.display = "block";
    authModalTitle.textContent = "Login";
  });

  // Open/Close Modal
  if (sidebarLoginBtn) {
    sidebarLoginBtn.addEventListener("click", () => {
      authModal.style.display = "block";
    });
  }

  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", () => {
      authModal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === authModal) {
      authModal.style.display = "none";
    }
  });

  // Sidebar auth button event listeners
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          console.log("User signed out.");
        })
        .catch((error) => {
          console.error("Sign out error:", error);
        });
    });
  }

  // Handle Auth State Changes
  onAuthStateChanged(auth, async (user) => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileUserId = urlParams.get("user");

    if (user) {
      // Always show logged-in user's info in sidebar
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const sidebarProfile = userDoc.exists() ? userDoc.data() : defaultProfile;
      updateSidebarUserInfo(sidebarProfile, true, user.email);

      // Show profile banner for viewed profile (could be self or other)
      if (profileUserId) {
        fetchAndDisplayProfile(profileUserId);
      } else {
        updateProfileBanner(sidebarProfile, true);
      }
    } else {
      // Not logged in
      updateSidebarUserInfo(defaultProfile, false);
      updateProfileBanner(defaultProfile, false);
    }
  });

  // Social Provider Login
  const handleProviderLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Logged in with provider:", result.user);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      alert(error.message);
      console.error("Provider login error:", error);
    }
  };

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
      handleProviderLogin(new GoogleAuthProvider());
    });
  }

  if (githubLoginBtn) {
    githubLoginBtn.addEventListener("click", () => {
      handleProviderLogin(new GithubAuthProvider());
    });
  }

  // Sign Up
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      grecaptcha.enterprise.ready(async () => {
        const token = await grecaptcha.enterprise.execute(
          "6Ldt0YYrAAAAAKyNgAPO8Te96_m5innDHsSkppQc",
          { action: "SIGNUP" }
        );
        console.log("reCAPTCHA token (Sign Up):", token);

        const email = document.getElementById("signUpEmail").value;
        const password = document.getElementById("signUpPassword").value;

        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCredential.user;

          // This part creates the user's "directory" (document) in Firestore!
          const newUserProfile = {
            name: email.split("@")[0],
            bio: "A new user ready to create amazing things.",
            lvl: "LVL • 1",
            type: "TYPE • NEWB",
            role: "ROLE • USER",
            photoURL: defaultProfile.photoURL,
          };
          await setDoc(doc(db, "users", user.uid), newUserProfile);

          // Seed widget folders in Firebase Storage with placeholder index.html
          const placeholderHtml = new Blob(
            [
              `<html><body style='display:flex;align-items:center;justify-content:center;height:100vh;background:#222;color:#fff;'><div><h2>Widget Placeholder</h2><img src='https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif' alt='Placeholder' style='max-width:200px;'/></div></body></html>`,
            ],
            { type: "text/html" }
          );
          for (let i = 1; i <= 3; i++) {
            const storageRef = ref(
              storage,
              `users/${user.uid}/app-widget-${i}/index.html`
            );
            try {
              await uploadBytes(storageRef, placeholderHtml);
            } catch (err) {
              console.error(
                `Failed to seed app-widget-${i} for user ${user.uid}:`,
                err
              );
            }
          }

          console.log("Signed up and profile created:", user);
        } catch (error) {
          alert(error.message);
          console.error("Sign up error:", error);
        }
      });
    });
  }
  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      grecaptcha.enterprise.ready(async () => {
        const token = await grecaptcha.enterprise.execute(
          "6Ldt0YYrAAAAAKyNgAPO8Te96_m5innDHsSkppQc",
          { action: "LOGIN" }
        );
        console.log("reCAPTCHA token (Login):", token);

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            console.log("Logged in:", userCredential.user);
          })
          .catch((error) => {
            alert(error.message);
            console.error("Login error:", error);
          });
      });
    });
  }

  // Logout
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          console.log("User signed out.");
        })
        .catch((error) => {
          console.error("Sign out error:", error);
        });
    });
  }

  // Mark All Read Button Event Listener
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", () => {
      if (auth.currentUser) {
        markAllNotificationsAsRead(auth.currentUser.uid);
        addLocalNotification("All notifications marked as read!", "success");
      } else {
        addLocalNotification(
          "Please log in to mark all notifications as read.",
          "info"
        );
      }
    });
  }
});
