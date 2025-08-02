# API Reference

This document provides detailed information about the application's API endpoints, data structures, and integration points.

## 🔐 Authentication API

### Firebase Authentication Methods

#### User Registration

```javascript
// Register a new user
const authManager = new SocialAuthManager();
await authManager.registerUser({
  email: "user@example.com",
  password: "securepassword",
  displayName: "John Doe",
  username: "johndoe",
});
```

#### User Login

```javascript
// Email/password login
await authManager.loginUser({
  email: "user@example.com",
  password: "securepassword",
});

// OAuth login
await authManager.loginWithProvider("google");
await authManager.loginWithProvider("github");
```

#### User Logout

```javascript
await authManager.logout();
```

### User Profile Management

#### Get User Profile

```javascript
const userProfile = await authManager.getUserProfile(userId);
```

#### Update User Profile

```javascript
await authManager.updateUserProfile({
  displayName: "New Name",
  bio: "Updated bio",
  photoURL: "https://example.com/avatar.jpg",
});
```

## 📦 Widget Management API

### Widget Upload

#### Upload Widget Files

```javascript
const widgetUploadManager = new WidgetUploadManager();
await widgetUploadManager.uploadWidgetFiles(files, userId, widgetId);
```

#### Save Widget to Database

```javascript
await widgetUploadManager.saveWidgetToDatabase({
  id: "widget-123",
  userId: "user-456",
  title: "My Awesome Widget",
  description: "A cool interactive widget",
  files: [
    {
      name: "index.html",
      url: "https://storage.googleapis.com/...",
      type: "text/html",
    },
  ],
  visibility: "public",
});
```

### Widget Retrieval

#### Get User Widgets

```javascript
const widgets = await getWidgetsByUser(userId);
```

#### Get Public Widgets

```javascript
const publicWidgets = await getPublicWidgets();
```

## 👥 Social Features API

### Follow/Unfollow Users

#### Follow User

```javascript
await authManager.followUser(targetUserId);
```

#### Unfollow User

```javascript
await authManager.unfollowUser(targetUserId);
```

### Notifications

#### Create Notification

```javascript
await createNotification(userId, {
  type: "follow",
  message: "John Doe started following you",
  data: {
    followerId: "user-123",
    followerName: "John Doe",
  },
});
```

#### Mark Notification as Read

```javascript
await markNotificationAsRead(notificationId);
```

#### Get User Notifications

```javascript
const notifications = await getUserNotifications(userId);
```

## 📊 Database Collections

### Users Collection

```javascript
{
  uid: "string",                    // Firebase Auth UID
  email: "string",                  // User email
  displayName: "string",            // Display name
  photoURL: "string",               // Profile picture URL
  username: "string",               // Unique username
  bio: "string",                    // User bio
  level: "number",                  // User level (1-100)
  type: "string",                   // User type (creator, viewer, admin)
  role: "string",                   // User role (GUEST, USER, ADMIN)
  followers: ["userIds"],           // Array of follower UIDs
  following: ["userIds"],           // Array of following UIDs
  createdAt: "timestamp",           // Account creation time
  lastActive: "timestamp"           // Last activity time
}
```

### Widgets Collection

```javascript
{
  id: "string",                     // Unique widget ID
  userId: "string",                 // Creator's UID
  title: "string",                  // Widget title
  description: "string",            // Widget description
  files: [{                         // Array of widget files
    name: "string",                 // File name
    url: "string",                  // File URL
    type: "string"                  // MIME type
  }],
  visibility: "public|private",     // Widget visibility
  createdAt: "timestamp",           // Creation time
  updatedAt: "timestamp"            // Last update time
}
```

### Notifications Collection

```javascript
{
  id: "string",                     // Unique notification ID
  userId: "string",                 // Recipient UID
  type: "follow|like|comment|widget", // Notification type
  message: "string",                // Notification message
  data: "object",                   // Additional data
  read: "boolean",                  // Read status
  createdAt: "timestamp"            // Creation time
}
```

## 🔧 Firebase Configuration

### Firebase Core Setup

```javascript
// core/firebase-core.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## 🛡️ Security Rules

### Firestore Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile and public profiles
    match /users/{userId} {
      allow read: if request.auth != null &&
        (request.auth.uid == userId || resource.data.visibility == 'public');
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Widgets can be read by public, written by owner
    match /widgets/{widgetId} {
      allow read: if resource.data.visibility == 'public';
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Notifications can be read/written by recipient
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### Storage Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId;
    }

    // Widget files can be read by public, written by owner
    match /widgets/{widgetId}/{allPaths=**} {
      allow read: if true; // Public read access
      allow write: if request.auth != null &&
        request.auth.uid == resource.metadata.userId;
    }
  }
}
```

## 🔄 Real-time Listeners

### User Profile Changes

```javascript
import { doc, onSnapshot } from "firebase/firestore";

const unsubscribe = onSnapshot(doc(db, "users", userId), (doc) => {
  if (doc.exists()) {
    const userData = doc.data();
    updateUIWithUserData(userData);
  }
});
```

### Notifications

```javascript
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const notificationsQuery = query(
  collection(db, "notifications"),
  where("userId", "==", currentUserId),
  orderBy("createdAt", "desc")
);

const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      addNotificationToUI(change.doc.data());
    }
  });
});
```

## 🚀 Error Handling

### Common Error Codes

```javascript
const errorMessages = {
  "auth/user-not-found": "User not found",
  "auth/wrong-password": "Incorrect password",
  "auth/email-already-in-use": "Email already registered",
  "auth/weak-password": "Password is too weak",
  "storage/unauthorized": "Unauthorized file access",
  "firestore/permission-denied": "Permission denied",
};
```

### Error Handling Pattern

```javascript
try {
  await authManager.loginUser(credentials);
} catch (error) {
  const userFriendlyMessage = authManager.getUserFriendlyError(error);
  showToast(userFriendlyMessage, "error");
}
```

## 📱 Browser Compatibility

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features

- ES6 Modules
- Fetch API
- Local Storage
- File API
- Drag and Drop API

## 🔍 Debugging

### Debug Logging

```javascript
// Enable debug logging
const DEBUG = {
  log: (message, data = null) => {
    console.log(`[DEBUG] ${message}`, data || "");
  },
  error: (message, error = null) => {
    console.error(`[DEBUG ERROR] ${message}`, error || "");
  },
};
```

### Performance Monitoring

```javascript
// Monitor API calls
const performanceMonitor = {
  startTimer: (operation) => {
    console.time(`[PERF] ${operation}`);
  },
  endTimer: (operation) => {
    console.timeEnd(`[PERF] ${operation}`);
  },
};
```

---

For more detailed information, see the [Architecture Documentation](architecture.md) and [Getting Started Guide](getting-started.md).
