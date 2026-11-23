// firebase-messaging-sw.js
// MUST be at root (/firebase-messaging-sw.js) for Firebase Cloud Messaging to work.
// This service worker handles background push notifications AND local scheduled alarms.

importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

// ─── IndexedDB helpers (shared between app and SW) ────────────────────────
const DB_NAME = "dosemate_alarms_v1";
const STORE = "scheduled_alarms";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = self.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAlarms() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return [];
  }
}

async function removeAlarm(id) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve;
    });
  } catch (e) {}
}

// ─── SW Install & Activate ────────────────────────────────────────────────
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  // Start the alarm polling loop immediately
  startAlarmLoop();
});

// ─── Local Scheduled Alarm Loop (checks every minute) ────────────────────
// This runs while the browser is open (even if tab is closed).
// For fully-closed browser, FCM push is used below.
let alarmLoopStarted = false;

function startAlarmLoop() {
  if (alarmLoopStarted) return;
  alarmLoopStarted = true;

  async function tick() {
    const now = new Date();
    const hhmm = now.toTimeString().slice(0, 5); // "HH:MM"
    const dateKey = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const alarms = await getAlarms();
    for (const alarm of alarms) {
      if (alarm.time === hhmm && alarm.date !== dateKey) {
        // Update date so it only fires once per day
        try {
          const db = await openDB();
          const tx = db.transaction(STORE, "readwrite");
          tx.objectStore(STORE).put({ ...alarm, date: dateKey });
        } catch (e) {}

        self.registration.showNotification(`⏰ Time for ${alarm.productName}!`, {
          body: `Take ${alarm.dailyDose} unit · ${alarm.mealTiming || "After meal"} · ${alarm.remaining ?? "?"} left`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          vibrate: [300, 100, 300, 100, 400],
          tag: `dose-alarm-${alarm.id}`,
          renotify: true,
          requireInteraction: true,
          data: { trackerId: alarm.id, url: "/" },
          actions: [
            { action: "take", title: "✅ Take Dose" },
            { action: "out_2h", title: "🏃 I'm Out (+2 hrs)" },
            { action: "snooze", title: "⏰ Snooze 5m" },
          ],
        });
      }
    }

    // Schedule next tick at the start of the next minute
    const secondsToNextMinute = 60 - new Date().getSeconds();
    self.setTimeout(tick, secondsToNextMinute * 1000);
  }

  // Start first tick at next whole minute
  const secondsToNextMinute = 60 - new Date().getSeconds();
  self.setTimeout(tick, secondsToNextMinute * 1000);
}

// ─── Handle Notification Action Clicks ────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const trackerId = event.notification.data?.trackerId;

  if (action === "out_2h" || action === "out") {
    // Postpone alarm by 2 hours when user is away from home
    const delayMs = 2 * 60 * 60 * 1000;
    const title = event.notification.title;
    self.setTimeout(() => {
      self.registration.showNotification(
        title.includes("Back Home") ? title : `⏰ Back Home Reminder: ${title.replace(/⏰\s*/, "")}`,
        {
          body: `Are you back? Time for your scheduled wellness dose!`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          vibrate: [300, 100, 300, 100, 400],
          tag: "dosemate-out-postponed",
          requireInteraction: true,
          actions: [
            { action: "take", title: "✅ Take Dose" },
            { action: "snooze", title: "⏰ Snooze 5m" },
          ],
        }
      );
    }, delayMs);
    return;
  }

  if (action === "snooze") {
    // Re-fire after 5 minutes
    self.setTimeout(() => {
      self.registration.showNotification(event.notification.title, {
        body: event.notification.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: [300, 100, 300],
        tag: event.notification.tag + "-snoozed",
        requireInteraction: true,
        actions: [
          { action: "take", title: "✅ Take Dose" },
          { action: "dismiss", title: "Dismiss" },
        ],
      });
    }, 5 * 60 * 1000);
    return;
  }

  // "take" or tap → open/focus app
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.postMessage({ type: "DOSE_TAKEN_FROM_NOTIFICATION", trackerId });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
  );
});

// ─── FCM: Firebase Cloud Messaging for fully-closed browser ───────────────
// Firebase config is injected at runtime by the app via postMessage
let firebaseInitialized = false;

self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG" && !firebaseInitialized) {
    try {
      firebase.initializeApp(event.data.config);
      firebase.messaging();
      firebaseInitialized = true;
    } catch (e) {
      // Already initialized or config missing — ignore
    }
  }

  // App schedules a postponed return reminder (e.g. "I'm out, remind in X hours")
  if (event.data?.type === "SCHEDULE_POSTPONED_ALARM") {
    const { productName, delayMs, timeString } = event.data;
    self.setTimeout(() => {
      self.registration.showNotification(`⏰ Back Home Reminder: ${productName}`, {
        body: `It's ${timeString}. Time for your dose now that you're back home!`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: [300, 100, 300, 100, 400],
        tag: `dosemate-back-home-${Date.now()}`,
        requireInteraction: true,
        actions: [
          { action: "take", title: "✅ Take Dose" },
          { action: "snooze", title: "⏰ Snooze 5m" },
        ],
      });
    }, delayMs || 3600000);
  }
  if (event.data?.type === "SYNC_ALARMS") {
    openDB().then((db) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      for (const alarm of event.data.alarms || []) {
        store.put(alarm);
      }
    });
    startAlarmLoop();
  }
});

// Handle FCM background push messages (sent by Firebase when browser is fully closed)
self.addEventListener("push", (event) => {
  let data = {
    title: "⏰ Dosemate Alarm",
    body: "Time for your daily wellness dose!",
    tag: "dosemate-fcm-alarm",
  };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [300, 100, 300, 100, 400],
      tag: data.tag,
      renotify: true,
      requireInteraction: true,
      actions: [
        { action: "take", title: "✅ Take Dose" },
        { action: "snooze", title: "⏰ Snooze 5m" },
      ],
    })
  );
});
