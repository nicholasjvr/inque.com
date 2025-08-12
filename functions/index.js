/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { Buffer } = require("buffer");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { randomUUID } = require("crypto");

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

const runtimeOpts = {
  timeoutSeconds: 300,
  memory: "1GB",
};

// Helper function to validate file types
const allowedTypes = [
  "text/html",
  "text/css",
  "application/javascript",
  "application/json",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/webp",
  "text/javascript",
  "application/x-javascript",
];

const allowedExtensions = [
  ".html",
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".json",
  ".webp",
];

function validateFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return (
    allowedExtensions.includes(ext) ||
    (file.type && allowedTypes.includes(file.type))
  );
}

// Cloud Function: Upload Widget Files
exports.uploadWidgetFiles = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    console.log("[UPLOAD WIDGET] Starting widget upload function");

    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { files, slot, widgetData } = data;
    const userId = context.auth.uid;

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No files provided"
      );
    }

    try {
      console.log(
        `[UPLOAD WIDGET] Processing ${files.length} files for slot ${slot}`
      );

      const uploadResults = [];
      const uploadId = `upload_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file
        if (!validateFile(file)) {
          console.warn(`[UPLOAD WIDGET] Invalid file type: ${file.name}`);
          continue;
        }

        try {
          // Create storage reference
          const fileRef = storage
            .bucket()
            .file(`uploads/${uploadId}/${file.name}`);

          // Upload file with Firebase download token metadata
          const buffer = Buffer.from(file.data, "base64");
          const token = randomUUID();
          await fileRef.save(buffer, {
            metadata: {
              contentType: file.type || "application/octet-stream",
              metadata: {
                uploadedBy: userId,
                slot: slot,
                originalName: file.name,
                firebaseStorageDownloadTokens: token,
              },
            },
          });

          // Construct Firebase Storage download URL using token
          const bucketName = fileRef.bucket.name;
          const encodedPath = encodeURIComponent(fileRef.name);
          const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

          uploadResults.push({
            fileName: file.name,
            downloadURL: downloadURL,
            size: buffer.length,
            type: file.type,
          });

          console.log(`[UPLOAD WIDGET] Successfully uploaded: ${file.name}`);
        } catch (error) {
          console.error(`[UPLOAD WIDGET] Error uploading ${file.name}:`, error);
          throw new functions.https.HttpsError(
            "internal",
            `Failed to upload ${file.name}`
          );
        }
      }

      // Save widget metadata to Firestore
      const widgetId = `widget_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const widgetDoc = {
        id: widgetId,
        userId: userId,
        slot: slot,
        title: (widgetData && widgetData.title) || "Untitled Widget",
        description: (widgetData && widgetData.description) || "",
        files: uploadResults,
        uploadId: uploadId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        stats: {
          views: 0,
          likes: 0,
          shares: 0,
          downloads: 0,
        },
      };

      await db.collection("widgets").doc(widgetId).set(widgetDoc);

      // Add widget ID to user's profile
      await db
        .collection("users")
        .doc(userId)
        .update({
          widgets: admin.firestore.FieldValue.arrayUnion(widgetId),
        });

      console.log(`[UPLOAD WIDGET] Widget metadata saved with ID: ${widgetId}`);

      return {
        success: true,
        widgetId: widgetId,
        uploadId: uploadId,
        files: uploadResults,
        message: `Successfully uploaded ${uploadResults.length} files`,
      };
    } catch (error) {
      console.error("[UPLOAD WIDGET] Function error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Upload failed: " + error.message
      );
    }
  });

// Cloud Function: Upload Profile Photo
exports.uploadProfilePhoto = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    console.log("[UPLOAD PROFILE] Starting profile photo upload");

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { file } = data;
    const userId = context.auth.uid;

    if (!file || !file.data) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No file provided"
      );
    }

    try {
      // Validate image file
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedImageTypes.includes(file.type)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid image type"
        );
      }

      // Create storage reference
      const fileRef = storage
        .bucket()
        .file(`users/${userId}/profile-photo.jpg`);

      // Upload file
      const buffer = Buffer.from(file.data, "base64");
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            uploadedBy: userId,
            originalName: file.name,
          },
        },
      });

      // Add Firebase download token and construct URL
      const token = randomUUID();
      await fileRef.setMetadata({
        metadata: {
          uploadedBy: userId,
          originalName: file.name,
          firebaseStorageDownloadTokens: token,
        },
      });

      const bucketName = fileRef.bucket.name;
      const encodedPath = encodeURIComponent(fileRef.name);
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

      // Update user profile in Firestore
      await db.collection("users").doc(userId).update({
        photoURL: downloadURL,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `[UPLOAD PROFILE] Profile photo uploaded for user: ${userId}`
      );

      return {
        success: true,
        photoURL: downloadURL,
        message: "Profile photo uploaded successfully",
      };
    } catch (error) {
      console.error("[UPLOAD PROFILE] Function error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Profile photo upload failed: " + error.message
      );
    }
  });

// Cloud Function: Delete Widget
exports.deleteWidget = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    console.log("[DELETE WIDGET] Starting widget deletion");

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { widgetId } = data;
    const userId = context.auth.uid;

    if (!widgetId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Widget ID required"
      );
    }

    try {
      // Get widget data
      const widgetDoc = await db.collection("widgets").doc(widgetId).get();

      if (!widgetDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Widget not found");
      }

      const widgetData = widgetDoc.data();

      // Check if user owns the widget
      if (widgetData.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You can only delete your own widgets"
        );
      }

      // Delete files from storage
      if (widgetData.uploadId) {
        const bucket = storage.bucket();
        const [files] = await bucket.getFiles({
          prefix: `uploads/${widgetData.uploadId}/`,
        });

        if (files.length > 0) {
          await bucket.deleteFiles({
            prefix: `uploads/${widgetData.uploadId}/`,
          });
          console.log(
            `[DELETE WIDGET] Deleted ${files.length} files from storage`
          );
        }
      }

      // Delete widget document
      await db.collection("widgets").doc(widgetId).delete();

      // Remove widget ID from user's profile
      await db
        .collection("users")
        .doc(userId)
        .update({
          widgets: admin.firestore.FieldValue.arrayRemove(widgetId),
        });

      console.log(`[DELETE WIDGET] Widget deleted: ${widgetId}`);

      return {
        success: true,
        message: "Widget deleted successfully",
      };
    } catch (error) {
      console.error("[DELETE WIDGET] Function error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Widget deletion failed: " + error.message
      );
    }
  });

// Cloud Function: Get Widget Download URLs
exports.getWidgetDownloadUrls = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    console.log("[GET DOWNLOAD URLS] Starting download URL generation");

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { widgetId } = data;

    if (!widgetId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Widget ID required"
      );
    }

    try {
      const widgetDoc = await db.collection("widgets").doc(widgetId).get();

      if (!widgetDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Widget not found");
      }

      const widgetData = widgetDoc.data();

      // Return the stored download URLs (token-based) to avoid signed URL permissions
      const downloadUrls = (widgetData.files || []).map((f) => ({
        fileName: f.fileName,
        downloadURL: f.downloadURL,
        type: f.type,
      }));

      console.log(
        `[GET DOWNLOAD URLS] Returning ${downloadUrls.length} stored download URLs`
      );

      return {
        success: true,
        downloadUrls: downloadUrls,
      };
    } catch (error) {
      console.error("[GET DOWNLOAD URLS] Function error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate download URLs: " + error.message
      );
    }
  });
