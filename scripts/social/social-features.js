// Social Features Module for inque
class SocialFeaturesManager {
  constructor() {
    this.currentUser = null;
    this.following = new Set();
    this.followers = new Set();
    this.debugMode = true;
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[SOCIAL FEATURES] ${message}`, data || "");
    }
  }

  error(message, error = null) {
    console.error(`[SOCIAL FEATURES ERROR] ${message}`, error || "");
  }

  // Initialize social features
  async init() {
    this.log("Initializing Social Features Manager");

    // Listen for auth state changes
    this.setupAuthListener();

    // Setup event listeners
    this.setupEventListeners();

    this.log("Social Features Manager initialized");
  }

  // Setup auth state listener
  async setupAuthListener() {
    try {
      this.log("Setting up auth state listener");
      const { auth, onAuthStateChanged } = await import(
        "../../core/firebase-core.js"
      );
      this.log("Firebase imports successful", {
        auth: !!auth,
        onAuthStateChanged: !!onAuthStateChanged,
      });

      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        if (user) {
          await this.loadUserSocialData(user.uid);
        } else {
          this.following.clear();
          this.followers.clear();
        }
      });
    } catch (error) {
      this.error("Failed to setup auth listener", error);
    }
  }

  // Load user's social data
  async loadUserSocialData(userId) {
    try {
      const { db } = await import("../../core/firebase-core.js");
      const { doc, getDoc } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.following = new Set(userData.following || []);
        this.followers = new Set(userData.followers || []);
        this.log("User social data loaded", {
          following: this.following.size,
          followers: this.followers.size,
        });
      }
    } catch (error) {
      this.error("Failed to load user social data", error);
    }
  }

  // Follow a user
  async followUser(targetUserId) {
    try {
      if (!this.currentUser) {
        throw new Error("User must be logged in to follow others");
      }

      const currentUserId = this.currentUser.uid;

      if (currentUserId === targetUserId) {
        throw new Error("You cannot follow yourself");
      }

      if (this.following.has(targetUserId)) {
        throw new Error("You are already following this user");
      }

      const { db } = await import("../../core/firebase-core.js");
      const { doc, updateDoc, arrayUnion } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Add to current user's following list
      await updateDoc(doc(db, "users", currentUserId), {
        following: arrayUnion(targetUserId),
      });

      // Add to target user's followers list
      await updateDoc(doc(db, "users", targetUserId), {
        followers: arrayUnion(currentUserId),
      });

      // Update local state
      this.following.add(targetUserId);

      // Create follow notification
      await this.createFollowNotification(targetUserId, currentUserId);

      this.log("User followed successfully", { targetUserId });
      return { success: true };
    } catch (error) {
      this.error("Follow action failed", error);
      return { success: false, error: error.message };
    }
  }

  // Unfollow a user
  async unfollowUser(targetUserId) {
    try {
      if (!this.currentUser) {
        throw new Error("User must be logged in to unfollow others");
      }

      const currentUserId = this.currentUser.uid;

      if (!this.following.has(targetUserId)) {
        throw new Error("You are not following this user");
      }

      const { db } = await import("../../core/firebase-core.js");
      const { doc, updateDoc, arrayRemove } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Remove from current user's following list
      await updateDoc(doc(db, "users", currentUserId), {
        following: arrayRemove(targetUserId),
      });

      // Remove from target user's followers list
      await updateDoc(doc(db, "users", targetUserId), {
        followers: arrayRemove(currentUserId),
      });

      // Update local state
      this.following.delete(targetUserId);

      this.log("User unfollowed successfully", { targetUserId });
      return { success: true };
    } catch (error) {
      this.error("Unfollow action failed", error);
      return { success: false, error: error.message };
    }
  }

  // Like a widget
  async likeWidget(widgetId) {
    try {
      if (!this.currentUser) {
        throw new Error("User must be logged in to like widgets");
      }

      const { db } = await import("../../core/firebase-core.js");
      const { doc, updateDoc, arrayUnion, getDoc } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Get widget data
      const widgetDoc = await getDoc(doc(db, "widgets", widgetId));
      if (!widgetDoc.exists()) {
        throw new Error("Widget not found");
      }

      const widgetData = widgetDoc.data();
      const currentUserId = this.currentUser.uid;

      // Check if already liked
      if (widgetData.likes && widgetData.likes.includes(currentUserId)) {
        throw new Error("You have already liked this widget");
      }

      // Add like
      await updateDoc(doc(db, "widgets", widgetId), {
        likes: arrayUnion(currentUserId),
        "stats.likes": (widgetData.stats?.likes || 0) + 1,
      });

      // Create like notification
      await this.createLikeNotification(
        widgetData.userId,
        currentUserId,
        widgetId,
        widgetData.title
      );

      this.log("Widget liked successfully", { widgetId });
      return { success: true };
    } catch (error) {
      this.error("Like action failed", error);
      return { success: false, error: error.message };
    }
  }

  // Unlike a widget
  async unlikeWidget(widgetId) {
    try {
      if (!this.currentUser) {
        throw new Error("User must be logged in to unlike widgets");
      }

      const { db } = await import("../../core/firebase-core.js");
      const { doc, updateDoc, arrayRemove, getDoc } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Get widget data
      const widgetDoc = await getDoc(doc(db, "widgets", widgetId));
      if (!widgetDoc.exists()) {
        throw new Error("Widget not found");
      }

      const widgetData = widgetDoc.data();
      const currentUserId = this.currentUser.uid;

      // Check if liked
      if (!widgetData.likes || !widgetData.likes.includes(currentUserId)) {
        throw new Error("You have not liked this widget");
      }

      // Remove like
      await updateDoc(doc(db, "widgets", widgetId), {
        likes: arrayRemove(currentUserId),
        "stats.likes": Math.max(0, (widgetData.stats?.likes || 1) - 1),
      });

      this.log("Widget unliked successfully", { widgetId });
      return { success: true };
    } catch (error) {
      this.error("Unlike action failed", error);
      return { success: false, error: error.message };
    }
  }

  // Share a widget
  async shareWidget(widgetId, platform = "general") {
    try {
      if (!this.currentUser) {
        throw new Error("User must be logged in to share widgets");
      }

      const { db } = await import("../../core/firebase-core.js");
      const { doc, getDoc, updateDoc, increment } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Get widget data
      const widgetDoc = await getDoc(doc(db, "widgets", widgetId));
      if (!widgetDoc.exists()) {
        throw new Error("Widget not found");
      }

      const widgetData = widgetDoc.data();

      // Update share count
      await updateDoc(doc(db, "widgets", widgetId), {
        "stats.shares": increment(1),
      });

      // Create share notification
      await this.createShareNotification(
        widgetData.userId,
        this.currentUser.uid,
        widgetId,
        widgetData.title,
        platform
      );

      // Handle platform-specific sharing
      await this.handlePlatformSharing(widgetData, platform);

      this.log("Widget shared successfully", { widgetId, platform });
      return { success: true };
    } catch (error) {
      this.error("Share action failed", error);
      return { success: false, error: error.message };
    }
  }

  // Handle platform-specific sharing
  async handlePlatformSharing(widgetData, platform) {
    const shareUrl = `${window.location.origin}/widget/${widgetData.id}`;
    const shareText = `Check out this amazing widget: ${widgetData.title}`;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareText
          )}&url=${encodeURIComponent(shareUrl)}`
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            shareUrl
          )}`
        );
        break;
      case "copy":
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        this.showToast("Link copied to clipboard!", "success");
        break;
      case "native":
        if (navigator.share) {
          await navigator.share({
            title: widgetData.title,
            text: widgetData.description || shareText,
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          this.showToast("Link copied to clipboard!", "success");
        }
        break;
      default:
        // General sharing - copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        this.showToast("Link copied to clipboard!", "success");
    }
  }

  // Discover users
  async discoverUsers(limit = 10, excludeCurrentUser = true) {
    try {
      const { db } = await import("../../core/firebase-core.js");
      const {
        collection,
        query,
        where,
        orderBy,
        limit: firestoreLimit,
        getDocs,
      } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      let usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        firestoreLimit(limit)
      );

      if (excludeCurrentUser && this.currentUser) {
        usersQuery = query(
          collection(db, "users"),
          where("uid", "!=", this.currentUser.uid),
          orderBy("createdAt", "desc"),
          firestoreLimit(limit)
        );
      }

      const snapshot = await getDocs(usersQuery);
      const users = [];

      snapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          ...userData,
          isFollowing: this.following.has(doc.id),
        });
      });

      this.log("Users discovered", { count: users.length });
      return { success: true, users };
    } catch (error) {
      this.error("Failed to discover users", error);
      return { success: false, error: error.message };
    }
  }

  // Get user's feed
  async getUserFeed(limit = 20) {
    try {
      if (!this.currentUser) {
        throw new Error("User must be logged in to view feed");
      }

      const { db } = await import("../../core/firebase-core.js");
      const {
        collection,
        query,
        where,
        orderBy,
        limit: firestoreLimit,
        getDocs,
      } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Get widgets from followed users
      const followingArray = Array.from(this.following);
      const feedItems = [];

      if (followingArray.length > 0) {
        // Get widgets from followed users
        const widgetsQuery = query(
          collection(db, "widgets"),
          where("userId", "in", followingArray),
          where("isPublic", "==", true),
          orderBy("createdAt", "desc"),
          firestoreLimit(limit)
        );

        const widgetsSnapshot = await getDocs(widgetsQuery);
        widgetsSnapshot.forEach((doc) => {
          const widgetData = doc.data();
          feedItems.push({
            type: "widget",
            id: doc.id,
            data: widgetData,
            timestamp: widgetData.createdAt,
          });
        });
      }

      // Sort by timestamp
      feedItems.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());

      this.log("User feed loaded", { count: feedItems.length });
      return { success: true, feed: feedItems };
    } catch (error) {
      this.error("Failed to load user feed", error);
      return { success: false, error: error.message };
    }
  }

  // Create follow notification
  async createFollowNotification(targetUserId, followerId) {
    try {
      const { db } = await import("../../core/firebase-core.js");
      const { collection, addDoc, serverTimestamp } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Get follower's display name
      const { doc, getDoc } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );
      const followerDoc = await getDoc(doc(db, "users", followerId));
      const followerName = followerDoc.exists()
        ? followerDoc.data().displayName
        : "Someone";

      const notification = {
        userId: targetUserId,
        type: "follow",
        title: "New follower! 👥",
        message: `${followerName} started following you.`,
        icon: "👥",
        data: { followerId, action: "view_profile" },
        read: false,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "notifications"), notification);
      this.log("Follow notification created", { targetUserId, followerId });
    } catch (error) {
      this.error("Failed to create follow notification", error);
    }
  }

  // Create like notification
  async createLikeNotification(widgetOwnerId, likerId, widgetId, widgetTitle) {
    try {
      const { db } = await import("../../core/firebase-core.js");
      const { collection, addDoc, serverTimestamp } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Get liker's display name
      const { doc, getDoc } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );
      const likerDoc = await getDoc(doc(db, "users", likerId));
      const likerName = likerDoc.exists()
        ? likerDoc.data().displayName
        : "Someone";

      const notification = {
        userId: widgetOwnerId,
        type: "like",
        title: "New like! ❤️",
        message: `${likerName} liked your widget "${widgetTitle}".`,
        icon: "❤️",
        data: { widgetId, likerId, action: "view_widget" },
        read: false,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "notifications"), notification);
      this.log("Like notification created", {
        widgetOwnerId,
        likerId,
        widgetId,
      });
    } catch (error) {
      this.error("Failed to create like notification", error);
    }
  }

  // Create share notification
  async createShareNotification(
    widgetOwnerId,
    sharerId,
    widgetId,
    widgetTitle,
    platform
  ) {
    try {
      const { db } = await import("../../core/firebase-core.js");
      const { collection, addDoc, serverTimestamp } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );

      // Get sharer's display name
      const { doc, getDoc } = await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
      );
      const sharerDoc = await getDoc(doc(db, "users", sharerId));
      const sharerName = sharerDoc.exists()
        ? sharerDoc.data().displayName
        : "Someone";

      const platformNames = {
        twitter: "Twitter",
        facebook: "Facebook",
        linkedin: "LinkedIn",
        copy: "copied",
        native: "shared",
      };

      const platformName = platformNames[platform] || "shared";

      const notification = {
        userId: widgetOwnerId,
        type: "share",
        title: "Widget shared! 📤",
        message: `${sharerName} ${platformName} your widget "${widgetTitle}".`,
        icon: "📤",
        data: { widgetId, sharerId, platform, action: "view_widget" },
        read: false,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "notifications"), notification);
      this.log("Share notification created", {
        widgetOwnerId,
        sharerId,
        widgetId,
        platform,
      });
    } catch (error) {
      this.error("Failed to create share notification", error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Follow/Unfollow buttons
    document.addEventListener("click", async (e) => {
      if (e.target.matches(".follow-btn")) {
        e.preventDefault();
        const userId = e.target.dataset.userId;
        const isFollowing = e.target.dataset.following === "true";

        if (isFollowing) {
          await this.unfollowUser(userId);
        } else {
          await this.followUser(userId);
        }

        // Update button state
        this.updateFollowButton(e.target, !isFollowing);
      }
    });

    // Like/Unlike buttons
    document.addEventListener("click", async (e) => {
      if (e.target.matches(".like-btn")) {
        e.preventDefault();
        const widgetId = e.target.dataset.widgetId;
        const isLiked = e.target.dataset.liked === "true";

        if (isLiked) {
          await this.unlikeWidget(widgetId);
        } else {
          await this.likeWidget(widgetId);
        }

        // Update button state
        this.updateLikeButton(e.target, !isLiked);
      }
    });

    // Share buttons
    document.addEventListener("click", async (e) => {
      if (e.target.matches(".share-btn")) {
        e.preventDefault();
        const widgetId = e.target.dataset.widgetId;
        const platform = e.target.dataset.platform || "native";

        await this.shareWidget(widgetId, platform);
      }
    });
  }

  // Update follow button state
  updateFollowButton(button, isFollowing) {
    button.dataset.following = isFollowing.toString();
    button.textContent = isFollowing ? "Following" : "Follow";
    button.className = isFollowing ? "follow-btn following" : "follow-btn";
  }

  // Update like button state
  updateLikeButton(button, isLiked) {
    button.dataset.liked = isLiked.toString();
    button.innerHTML = isLiked ? "❤️ Liked" : "🤍 Like";
    button.className = isLiked ? "like-btn liked" : "like-btn";
  }

  // Show toast notification
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    const container =
      document.getElementById("toast-container") || document.body;
    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);

    // Manual close
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      toast.remove();
    });
  }
}

// Initialize the social features system
const socialFeatures = new SocialFeaturesManager();

// Expose globally for main.js access
window.socialFeatures = socialFeatures;

document.addEventListener("DOMContentLoaded", () => {
  socialFeatures.init();
});

export { SocialFeaturesManager };
