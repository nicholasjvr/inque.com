// scripts/upload.js
import { storage, auth } from "./firebase-init.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

export async function uploadProjectFiles(files, projectId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  const fileURLs = {};

  for (let file of files) {
    const storageRef = ref(
      storage,
      `users/${user.uid}/projects/${projectId}/${file.name}`
    );
    await uploadBytes(storageRef, file);
    fileURLs[file.name] = await getDownloadURL(storageRef);
  }
  return fileURLs;
}

export async function uploadWidgetToSlot(files, slotNumber) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  if (![1, 2, 3].includes(Number(slotNumber))) throw new Error("Invalid slot");

  const fileURLs = {};

  try {
    for (let file of files) {
      console.log(`Uploading ${file.name} to slot ${slotNumber}...`);

      const storageRef = ref(
        storage,
        `users/${user.uid}/app-widget-${slotNumber}/${file.name}`
      );

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      console.log(`File ${file.name} uploaded successfully:`, snapshot);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      fileURLs[file.name] = downloadURL;

      console.log(`Download URL for ${file.name}:`, downloadURL);
    }

    console.log("All files uploaded successfully:", fileURLs);
    return fileURLs;
  } catch (error) {
    console.error("Upload error:", error);

    // Check for CORS-related errors
    if (error.message.includes('CORS') || error.message.includes('preflight') || error.message.includes('ERR_FAILED')) {
      throw new Error('Upload failed: CORS configuration issue. Please check the CORS setup guide (CORS_SETUP.md) or contact support.');
    }

    // Provide more specific error messages
    if (error.code === "storage/unauthorized") {
      throw new Error(
        "Upload failed: You are not authorized to upload files. Please make sure you are logged in."
      );
    } else if (error.code === "storage/quota-exceeded") {
      throw new Error(
        "Upload failed: Storage quota exceeded. Please contact support."
      );
    } else if (error.code === "storage/unauthenticated") {
      throw new Error("Upload failed: Please log in to upload files.");
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}

// Test function to verify upload functionality
export async function testUpload() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log("No user logged in, cannot test upload");
      return false;
    }

    // Create a simple test file
    const testContent =
      "<html><body><h1>Test Widget</h1><p>This is a test upload.</p></body></html>";
    const testFile = new File([testContent], "test.html", {
      type: "text/html",
    });

    console.log("Testing upload functionality...");
    const result = await uploadWidgetToSlot([testFile], 1);
    console.log("Test upload successful:", result);
    return true;
  } catch (error) {
    console.error("Test upload failed:", error);
    return false;
  }
}
