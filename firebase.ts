import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";

// Firebase Configuration from Vite environment variables (.env or Vercel Environment Variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Check if Firebase credentials have been supplied
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

const app = isFirebaseConfigured
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

// ─── Real-time Cloud Sync Helpers ──────────────────────────────────────────

/**
 * Persist user health profile to Firestore
 */
export async function saveProfileToCloud(uid: string, profile: any) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), { profile, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Error saving profile to cloud:", err);
  }
}

/**
 * Persist user trackers to Firestore
 */
export async function saveTrackersToCloud(uid: string, trackers: any[]) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), { trackers, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Error saving trackers to cloud:", err);
  }
}

/**
 * Persist user dose logs to Firestore
 */
export async function saveLogsToCloud(uid: string, logs: any[]) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), { logs, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Error saving logs to cloud:", err);
  }
}

/**
 * Persist user hair checkups to Firestore
 */
export async function saveCheckupsToCloud(uid: string, checkups: any[]) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), { checkups, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Error saving checkups to cloud:", err);
  }
}

/**
 * Subscribe to real-time changes from Firestore for the active user
 */
export function subscribeToUserCloudData(
  uid: string,
  onData: (data: { profile: any; trackers: any[]; logs: any[]; checkups: any[] }) => void
) {
  if (!db || !uid) return () => {};
  const userDocRef = doc(db, "users", uid);
  return onSnapshot(userDocRef, (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      onData({
        profile: d.profile || null,
        trackers: d.trackers || [],
        logs: d.logs || [],
        checkups: d.checkups || [],
      });
    }
  });
}
