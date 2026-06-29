self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Phakathi Flow", body: event.data?.text() || "" };
  }

  const title = payload.title || "Phakathi Flow";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/brand/phakathi-holdings-icon.svg",
    badge: payload.badge || "/brand/phakathi-holdings-icon.svg",
    tag: payload.tag,
    data: payload.data || { url: payload.url || "/Notifications" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/Notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
