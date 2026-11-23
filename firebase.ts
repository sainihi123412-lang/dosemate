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
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase Configuration from Vite environment variables (.env or Vercel Environment Variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// FCM VAPID key for push subscriptions (get from Firebase Console → Cloud Messaging → Web Push certificates)
const FCM_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

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

// ─── FCM Messaging (background push notifications) ────────────────────────

let messaging: any = null;
try {
  if (app && "serviceWorker" in navigator) {
    messaging = getMessaging(app);
  }
} catch (e) {
  // Messaging not available (e.g. not in a secure context)
}

/**
 * Request FCM push notification permission and get device token.
 * Returns the FCM token string, or null if unavailable.
 */
export async function requestFCMToken(): Promise<string | null> {
  if (!messaging || !FCM_VAPID_KEY) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.warn("[Dosemate] FCM getToken failed:", err);
    return null;
  }
}

/**
 * Listen for foreground FCM messages (when app tab is open).
 * Returns an unsubscribe function.
 */
export function onFCMMessage(callback: (payload: any) => void): () => void {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

/**
 * Save FCM token to Firestore so server can target this device.
 */
export async function saveFCMTokenToCloud(uid: string, token: string) {
  if (!db || !uid || !token) return;
  try {
    await setDoc(
      doc(db, "users", uid),
      { fcmTokens: { [token]: true }, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    console.error("[Dosemate] Error saving FCM token:", err);
  }
}

// ─── IndexedDB Alarm Scheduler ────────────────────────────────────────────
// Stores alarm schedule locally so the Service Worker can fire alarms
// even when the app tab is not in the foreground.

const IDB_NAME = "dosemate_alarms_v1";
const IDB_STORE = "scheduled_alarms";

function openAlarmDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore(IDB_STORE, { keyPath: "id" });
    };
    req.onsuccess = (e: any) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export interface AlarmEntry {
  id: string;
  productName: string;
  time: string;      // "HH:MM"
  dailyDose: number;
  mealTiming: string;
  remaining: number;
  date?: string;     // last fired date YYYY-MM-DD (set by SW)
}

/**
 * Write all active alarms to IndexedDB and sync to Service Worker.
 * Call this whenever trackers change.
 */
export async function syncAlarmsToSW(alarms: AlarmEntry[]) {
  // Write to IndexedDB
  try {
    const db = await openAlarmDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.clear();
      for (const alarm of alarms) {
        store.put(alarm);
      }
      tx.oncomplete = () => resolve();
    });
  } catch (e) {
    console.warn("[Dosemate] IndexedDB write failed:", e);
  }

  // Also post directly to SW in case it is already running
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: "SYNC_ALARMS", alarms });
  } catch (e) {
    // SW not ready yet — IndexedDB write is enough
  }
}

// ─── Send Firebase config to SW for FCM initialization ───────────────────
export async function sendFirebaseConfigToSW() {
  if (!isFirebaseConfigured) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: "FIREBASE_CONFIG",
      config: firebaseConfig,
    });
  } catch (e) {}
}

// ─── Real-time Cloud Sync Helpers ──────────────────────────────────────────

export async function saveProfileToCloud(uid: string, profile: any) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), { profile, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Error saving profile to cloud:", err);
  }
}

export async function saveTrackersToCloud(uid: string, trackers: any[]) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), { trackers, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Error saving trackers to cloud:", err);
  }
}

export async function saveLogsToCloud(uid: string, logs: any[]) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), { logs, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Error saving logs to cloud:", err);
  }
}

export async function saveCheckupsToCloud(uid: string, checkups: any[]) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), { checkups, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Error saving checkups to cloud:", err);
  }
}

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
