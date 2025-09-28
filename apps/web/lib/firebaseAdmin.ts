import { initializeApp, getApps, applicationDefault, cert } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { Firestore } from "@google-cloud/firestore";

function ensureAdmin() {
  if (!getApps().length) {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        } as any),
      });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }
}

export function adminAuth() {
  ensureAdmin();
  return getAdminAuth();
}

let _db: Firestore | null = null;
export function firestoreAdmin() {
  if (!_db) _db = new Firestore();
  return _db;
}
