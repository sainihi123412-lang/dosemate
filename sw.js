// Dosemate Background Service Worker
// Enables notifications, alarms, and offline capability even when app is closed

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications or scheduled alarms
self.addEventListener("push", (event) => {
  let data = {
    title: "Dosemate Alarm 🔔",
    body: "Time for your daily wellness dose!",
    tag: "dosemate-alarm",
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [300, 100, 300, 100, 400], // Repeating alarm vibration pattern
    tag: data.tag,
    renotify: true,
    requireInteraction: true, // Alarm stays until dismissed or acted upon
    actions: [
      { action: "take", title: "✅ Take Dose Now" },
      { action: "out_2h", title: "🏃 I'm Out (+2 hrs)" },
      { action: "snooze", title: "⏰ Snooze 5m" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click when user taps notification while app is closed
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;

  if (action === "out_2h" || action === "out") {
    const delayMs = 2 * 60 * 60 * 1000;
    self.setTimeout(() => {
      self.registration.showNotification(
        `⏰ Back Home Reminder: ${event.notification.title.replace(/⏰\s*/, "")}`,
        {
          body: `Are you back home? Time for your scheduled dose!`,
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

  if (action === "reorder") {
    const url =
      event.notification.data?.reorderUrl ||
      "https://manmatters.com/home-alt?theme=reset&utm_source=google&utm_medium=brand&utm_campaign=Search_Brand_MM";
    event.waitUntil(
      self.clients.openWindow ? self.clients.openWindow(url) : Promise.resolve()
    );
    return;
  }

  if (action === "snooze") {
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

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});
