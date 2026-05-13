self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "FechaPro";
  const options = {
    body: data.body || "Voce tem uma nova atualizacao.",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: data.tag || "fechapro",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.endsWith(targetUrl)) return client.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});
