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
