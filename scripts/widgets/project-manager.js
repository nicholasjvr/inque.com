// scripts/project-manager.js
import { db, auth } from "../../core/firebase-core.js";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
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
