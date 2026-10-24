self.addEventListener("push", (event) => {
  let data = {
    title: "Findr — Campus Lost & Found",
    body: "Findr par ek naya item report hua hai.",
    url: "./"
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "./assets/favicon.png",
badge: "./assets/favicon.png",
      data: { url: data.url || "./" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "./",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});
