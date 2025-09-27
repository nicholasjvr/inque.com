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
const JSZip = require("jszip");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

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

// Cloud Function: Reupload files for existing widget (replace files, keep metadata)
exports.reuploadWidgetFiles = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    console.log("[REUPLOAD WIDGET] Starting reupload process");

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { widgetId, files } = data;
    const userId = context.auth.uid;

    if (!widgetId || !files || !Array.isArray(files) || files.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "widgetId and files are required"
      );
    }

    try {
      // Load widget and validate ownership
      const widgetRef = db.collection("widgets").doc(widgetId);
      const widgetSnap = await widgetRef.get();
      if (!widgetSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Widget not found");
      }
      const widgetData = widgetSnap.data();
      if (widgetData.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You can only update your own widgets"
        );
      }

      // Upload new files under new uploadId
      const uploadResults = [];
      const uploadId = `upload_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!validateFile(file)) {
          console.warn(`[REUPLOAD WIDGET] Invalid file type: ${file.name}`);
          continue;
        }
        try {
          const fileRef = storage
            .bucket()
            .file(`uploads/${uploadId}/${file.name}`);

          const buffer = Buffer.from(file.data, "base64");
          const token = randomUUID();
          await fileRef.save(buffer, {
            metadata: {
              contentType: file.type || "application/octet-stream",
              metadata: {
                uploadedBy: userId,
                slot: widgetData.slot,
                originalName: file.name,
                firebaseStorageDownloadTokens: token,
              },
            },
          });

          const bucketName = fileRef.bucket.name;
          const encodedPath = encodeURIComponent(fileRef.name);
          const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

          uploadResults.push({
            fileName: file.name,
            downloadURL,
            size: buffer.length,
            type: file.type,
          });
        } catch (err) {
          console.error(`[REUPLOAD WIDGET] Error uploading ${file.name}:`, err);
          throw new functions.https.HttpsError(
            "internal",
            `Failed to upload ${file.name}`
          );
        }
      }

      // Optionally: delete previous upload folder to save space
      try {
        if (widgetData.uploadId) {
          const bucket = storage.bucket();
          await bucket.deleteFiles({
            prefix: `uploads/${widgetData.uploadId}/`,
          });
          console.log("[REUPLOAD WIDGET] Old files deleted");
        }
      } catch (cleanupError) {
        console.warn(
          "[REUPLOAD WIDGET] Cleanup failed (non-fatal)",
          cleanupError
        );
      }

      await widgetRef.update({
        files: uploadResults,
        uploadId: uploadId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[REUPLOAD WIDGET] Widget updated: ${widgetId}`);

      return {
        success: true,
        widgetId,
        files: uploadResults,
        uploadId,
        message: `Reuploaded ${uploadResults.length} files`,
      };
    } catch (error) {
      console.error("[REUPLOAD WIDGET] Function error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Reupload failed: " + error.message
      );
    }
  });

// ===== ZIP UPLOAD PIPELINE FUNCTIONS =====

// Helper function to validate manifest.json
function validateManifest(manifestContent) {
  try {
    const manifest = JSON.parse(manifestContent);

    // Required fields
    if (!manifest.name || typeof manifest.name !== "string") {
      throw new Error("Manifest must have a valid name");
    }

    if (!manifest.entry || typeof manifest.entry !== "string") {
      throw new Error("Manifest must specify an entry point (entry field)");
    }

    // Optional but recommended fields
    const validManifest = {
      name: manifest.name,
      version: manifest.version || "1.0.0",
      entry: manifest.entry,
      description: manifest.description || "",
      preview: manifest.preview || { width: 600, height: 400 },
      files: manifest.files || [],
      permissions: manifest.permissions || { externalFetch: false },
    };

    return validManifest;
  } catch (error) {
    throw new Error(`Invalid manifest.json: ${error.message}`);
  }
}

// Helper function to extract zip file
async function extractZip(zipBuffer) {
  console.log("[ZIP PIPELINE] Starting zip extraction");

  const zip = await JSZip.loadAsync(zipBuffer);
  const extractedFiles = [];

  // Extract all files from zip
  for (const [filePath, file] of Object.entries(zip.files)) {
    // Skip directories
    if (file.dir) continue;

    // Skip hidden files and dangerous paths
    if (
      filePath.startsWith(".") ||
      filePath.includes("../") ||
      filePath.startsWith("/")
    ) {
      console.warn(
        `[ZIP PIPELINE] Skipping potentially dangerous file: ${filePath}`
      );
      continue;
    }

    // Validate file type
    const ext = path.extname(filePath).toLowerCase();
    if (
      !allowedExtensions.includes(ext) &&
      !allowedExtensions.includes("." + filePath.split(".").pop())
    ) {
      console.warn(
        `[ZIP PIPELINE] Skipping unsupported file type: ${filePath}`
      );
      continue;
    }

    try {
      const content = await file.async("nodebuffer");
      extractedFiles.push({
        path: filePath,
        content: content,
        size: content.length,
        type: getContentType(filePath),
      });

      console.log(
        `[ZIP PIPELINE] Extracted file: ${filePath} (${content.length} bytes)`
      );
    } catch (error) {
      console.error(`[ZIP PIPELINE] Failed to extract ${filePath}:`, error);
      throw new Error(`Failed to extract ${filePath}: ${error.message}`);
    }
  }

  console.log(
    `[ZIP PIPELINE] Successfully extracted ${extractedFiles.length} files`
  );
  return extractedFiles;
}

// Helper function to get content type from file path
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const typeMap = {
    ".html": "text/html",
    ".htm": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".txt": "text/plain",
    ".md": "text/markdown",
  };

  return typeMap[ext] || "application/octet-stream";
}

// Helper function to process images for preview
async function processImageForPreview(imageBuffer, fileName) {
  try {
    console.log(`[ZIP PIPELINE] Processing image for preview: ${fileName}`);

    // Resize image to max 800px width/height for preview
    const processedBuffer = await sharp(imageBuffer)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    console.log(
      `[ZIP PIPELINE] Image processed: ${fileName} (${imageBuffer.length} -> ${processedBuffer.length} bytes)`
    );
    return processedBuffer;
  } catch (error) {
    console.error(`[ZIP PIPELINE] Failed to process image ${fileName}:`, error);
    return imageBuffer; // Return original if processing fails
  }
}

// Main zip processing function
async function processZipUpload(zipBuffer, bundleId, userId, widgetData) {
  console.log(`[ZIP PIPELINE] Starting zip processing for bundle: ${bundleId}`);

  try {
    // Step 1: Extract zip
    const extractedFiles = await extractZip(zipBuffer);
    if (extractedFiles.length === 0) {
      throw new Error("No valid files found in zip archive");
    }

    // Step 2: Look for manifest.json
    let manifest = null;
    const manifestFile = extractedFiles.find(
      (f) => f.path.toLowerCase() === "manifest.json"
    );
    if (manifestFile) {
      try {
        const manifestContent = manifestFile.content.toString("utf8");
        manifest = validateManifest(manifestContent);
        console.log(`[ZIP PIPELINE] Valid manifest found: ${manifest.name}`);
      } catch (error) {
        console.warn(
          `[ZIP PIPELINE] Manifest validation failed: ${error.message}`
        );
        // Continue without manifest
      }
    }

    // Step 3: Find entry point
    let entryFile = null;
    if (manifest && manifest.entry) {
      entryFile = extractedFiles.find(
        (f) => f.path.toLowerCase() === manifest.entry.toLowerCase()
      );
    }

    // Fallback: look for index.html
    if (!entryFile) {
      entryFile = extractedFiles.find(
        (f) =>
          f.path.toLowerCase() === "index.html" ||
          f.path.toLowerCase() === "index.htm"
      );
    }

    if (!entryFile) {
      throw new Error(
        "No entry point found. Please include index.html or specify entry in manifest.json"
      );
    }

    console.log(`[ZIP PIPELINE] Using entry point: ${entryFile.path}`);

    // Step 4: Process and upload files
    const uploadResults = [];
    const processedFiles = [];

    for (const file of extractedFiles) {
      let processedContent = file.content;

      // Process images for preview optimization
      if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
        try {
          processedContent = await processImageForPreview(
            file.content,
            file.path
          );
        } catch (error) {
          console.warn(
            `[ZIP PIPELINE] Image processing failed for ${file.path}, using original`
          );
        }
      }

      // Upload to storage
      const fileName = path.basename(file.path);
      const filePath = `widgetBundles/${bundleId}/${file.path}`;
      const fileRef = storage.bucket().file(filePath);

      const token = randomUUID();
      await fileRef.save(processedContent, {
        metadata: {
          contentType: file.type,
          metadata: {
            uploadedBy: userId,
            bundleId: bundleId,
            originalPath: file.path,
            firebaseStorageDownloadTokens: token,
          },
        },
      });

      const bucketName = fileRef.bucket.name;
      const encodedPath = encodeURIComponent(fileRef.name);
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

      uploadResults.push({
        path: file.path,
        fileName: fileName,
        downloadURL: downloadURL,
        size: processedContent.length,
        type: file.type,
        originalSize: file.size,
      });

      processedFiles.push({
        path: file.path,
        content: processedContent,
        type: file.type,
      });

      console.log(`[ZIP PIPELINE] Processed and uploaded: ${file.path}`);
    }

    // Step 5: Generate entry points
    const entrypoints = {
      previewUrl: uploadResults.find((f) => f.path === entryFile.path)
        ?.downloadURL,
      fullUrl: uploadResults.find((f) => f.path === entryFile.path)
        ?.downloadURL,
    };

    if (!entrypoints.previewUrl) {
      throw new Error("Failed to generate preview URL for entry point");
    }

    console.log(`[ZIP PIPELINE] Generated entry points:`, entrypoints);

    return {
      success: true,
      manifest: manifest,
      entrypoints: entrypoints,
      files: uploadResults,
      fileCount: extractedFiles.length,
      totalSize: uploadResults.reduce((sum, f) => sum + f.size, 0),
    };
  } catch (error) {
    console.error(
      `[ZIP PIPELINE] Processing failed for bundle ${bundleId}:`,
      error
    );
    throw error;
  }
}

// Cloud Function: Upload Widget Bundle (ZIP)
exports.uploadWidgetBundle = functions
  .runWith({
    ...runtimeOpts,
    timeoutSeconds: 540, // 9 minutes for large zips
    memory: "2GB",
  })
  .https.onCall(async (data, context) => {
    console.log("[UPLOAD BUNDLE] Starting widget bundle upload");

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { zipFile, slot, widgetData } = data;
    const userId = context.auth.uid;

    if (!zipFile || !zipFile.data) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ZIP file is required"
      );
    }

    try {
      // Create bundle document
      const bundleId = `bundle_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const bundleRef = db.collection("widgetBundles").doc(bundleId);

      // Initialize bundle document
      await bundleRef.set({
        ownerUid: userId,
        status: "processing",
        slot: slot,
        title: widgetData?.title || "Untitled Widget",
        description: widgetData?.description || "",
        tags: widgetData?.tags || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[UPLOAD BUNDLE] Created bundle document: ${bundleId}`);

      // Process the zip file
      const zipBuffer = Buffer.from(zipFile.data, "base64");
      const result = await processZipUpload(
        zipBuffer,
        bundleId,
        userId,
        widgetData
      );

      // Update bundle with results
      await bundleRef.update({
        status: "ready",
        manifest: result.manifest,
        entrypoints: result.entrypoints,
        files: result.files,
        fileCount: result.fileCount,
        totalSize: result.totalSize,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Add bundle ID to user's profile
      await db
        .collection("users")
        .doc(userId)
        .update({
          widgetBundles: admin.firestore.FieldValue.arrayUnion(bundleId),
        });

      console.log(`[UPLOAD BUNDLE] Bundle processing completed: ${bundleId}`);

      return {
        success: true,
        bundleId: bundleId,
        entrypoints: result.entrypoints,
        manifest: result.manifest,
        message: `Successfully processed ${result.fileCount} files`,
      };
    } catch (error) {
      console.error("[UPLOAD BUNDLE] Function error:", error);

      // Update bundle status to failed
      if (typeof bundleId !== "undefined") {
        try {
          await db.collection("widgetBundles").doc(bundleId).update({
            status: "failed",
            error: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (updateError) {
          console.error(
            "[UPLOAD BUNDLE] Failed to update bundle status:",
            updateError
          );
        }
      }

      throw new functions.https.HttpsError(
        "internal",
        "Bundle upload failed: " + error.message
      );
    }
  });
