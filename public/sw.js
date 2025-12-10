// Service Worker for Push Notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Bạn có thông báo mới",
    icon: "/assets/images/logo_batcomman.jpg",
    badge: "/assets/images/logo_batcomman.jpg",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: [
      {
        action: "open",
        title: "Xem ngay",
      },
      {
        action: "close",
        title: "Đóng",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Bát Cơm Mặn", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle service worker installation
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
