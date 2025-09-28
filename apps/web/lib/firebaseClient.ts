"use client";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export function firebaseApp() {
  return getApps().length ? getApps()[0]! : initializeApp(config);
}

export async function loginWithGoogle() {
  const auth = getAuth(firebaseApp());
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const idToken = await cred.user.getIdToken(true);

  await fetch("/api/session/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  return cred.user;
}

export async function logout() {
  const auth = getAuth(firebaseApp());
  await signOut(auth);
  await fetch("/api/session/logout", { method: "POST" });
}
