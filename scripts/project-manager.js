// scripts/project-manager.js
import { db, auth } from "./firebase-init.js";
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
