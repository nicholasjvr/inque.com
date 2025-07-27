// Firebase setup helper functions
import { db, auth, storage } from "./firebase-init.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

export const initializeUserProfile = async (user) => {
  try {
    console.log("Initializing user profile for:", user.uid);

    // Check if profile already exists
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // Create new profile
      const newProfile = {
        name: user.displayName || user.email.split("@")[0],
        bio: "A new user ready to create amazing things.",
        lvl: "LVL • 1",
        type: "TYPE • NEWB",
        role: "ROLE • USER",
        photoURL:
          user.photoURL ||
          "https://i.pinimg.com/originals/3c/69/1d/3c691d9047d7fb33383a8b417c8e9b67.jpg",
        email: user.email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), newProfile);
      console.log("User profile created successfully");
      return newProfile;
    } else {
      // Update last login
      await setDoc(
        doc(db, "users", user.uid),
        {
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );
      console.log("User profile updated");
      return userDoc.data();
    }
  } catch (error) {
    console.error("Error initializing user profile:", error);
    throw error;
  }
};

export const createWidgetSlots = async (userId) => {
  try {
    console.log("Creating widget slots for user:", userId);

    const placeholderHtml = new Blob(
      [
        `<html>
        <head><title>Widget Placeholder</title></head>
        <body style='display:flex;align-items:center;justify-content:center;height:100vh;background:#222;color:#fff;font-family:Arial,sans-serif;'>
          <div style='text-align:center;'>
            <h2>Widget Placeholder</h2>
            <p>This is a placeholder widget.</p>
            <p>Upload your files to replace this!</p>
            <img src='https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif' alt='Placeholder' style='max-width:200px;border-radius:10px;'/>
          </div>
        </body>
      </html>`,
      ],
      { type: "text/html" }
    );

    for (let i = 1; i <= 3; i++) {
      const storageRef = ref(
        storage,
        `users/${userId}/app-widget-${i}/index.html`
      );
      await uploadBytes(storageRef, placeholderHtml);
      console.log(`Created widget slot ${i}`);
    }

    console.log("All widget slots created successfully");
  } catch (error) {
    console.error("Error creating widget slots:", error);
    throw error;
  }
};
