// Enhanced Project Manager for Quip Management with WebGL Support
import { db, auth } from "../../core/firebase-core.js";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export async function createProject(projectId, metadata) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  await setDoc(doc(db, "projects", projectId), {
    ...metadata,
    owner: user.uid,
    created: new Date(),
  });
}

export async function listUserProjects() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  const querySnapshot = await getDocs(collection(db, "projects"));
  return querySnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((project) => project.owner === user.uid);
}

export async function deleteProject(projectId) {
  await deleteDoc(doc(db, "projects", projectId));
}

export async function updateProject(projectId, updates) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  const projectRef = doc(db, "projects", projectId);
  await setDoc(projectRef, updates, { merge: true });
}

export async function saveWidgetSlotMetadata(slotNumber, metadata) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  if (![1, 2, 3].includes(Number(slotNumber))) throw new Error("Invalid slot");

  await setDoc(
    doc(db, "users", user.uid),
    {
      widgets: {
        [`app-widget-${slotNumber}`]: metadata,
      },
    },
    { merge: true }
  );
}

// Enhanced Quip Management Functions
export async function createQuip(quipData) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const quipId = `quip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const enhancedQuipData = {
    ...quipData,
    id: quipId,
    userId: user.uid,
    type: "quip",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    webglEnabled: true,
    interactionCount: 0,
    lastInteracted: null,
    tags: quipData.tags || [],
    category: quipData.category || "general",
    isPublic: quipData.isPublic !== false, // Default to public
    performanceMetrics: {
      loadTime: null,
      frameRate: null,
      memoryUsage: null,
    },
  };

  await setDoc(doc(db, "quips", quipId), enhancedQuipData);
  console.log(`[QUIP MANAGER] Created quip: ${quipId}`);
  return quipId;
}

export async function updateQuip(quipId, updates) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const quipRef = doc(db, "quips", quipId);
  const enhancedUpdates = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(quipRef, enhancedUpdates);
  console.log(`[QUIP MANAGER] Updated quip: ${quipId}`);
}

export async function getUserQuips() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const quipsRef = collection(db, "quips");
  const querySnapshot = await getDocs(quipsRef);

  return querySnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((quip) => quip.userId === user.uid)
    .sort(
      (a, b) =>
        (b.createdAt?.toDate?.() || b.createdAt) -
        (a.createdAt?.toDate?.() || a.createdAt)
    );
}

export async function deleteQuip(quipId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  // Verify ownership before deletion
  const quipRef = doc(db, "quips", quipId);
  const quipDoc = await getDocs(quipRef);

  if (quipDoc.exists() && quipDoc.data().userId !== user.uid) {
    throw new Error("Unauthorized: You can only delete your own quips");
  }

  await deleteDoc(quipRef);
  console.log(`[QUIP MANAGER] Deleted quip: ${quipId}`);
}

export async function incrementQuipInteraction(quipId) {
  const quipRef = doc(db, "quips", quipId);
  await updateDoc(quipRef, {
    interactionCount: serverTimestamp(),
    lastInteracted: serverTimestamp(),
  });
}

export async function updateQuipPerformanceMetrics(quipId, metrics) {
  const quipRef = doc(db, "quips", quipId);
  await updateDoc(quipRef, {
    performanceMetrics: {
      ...metrics,
      lastUpdated: serverTimestamp(),
    },
  });
}
