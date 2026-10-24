
const FINDR_URL = "https://aman13raj.github.io/Findr-campus-lost-found/";

self.addEventListener("push", (event) => {
  let data = {
    title: "Findr — Campus Lost & Found",
    body: "Findr par ek naya item report hua hai.",
    url: FINDR_URL,
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
      data: {
        url: data.url || FINDR_URL,
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || FINDR_URL;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windows) => {
        for (const client of windows) {
          if (
            client.url.startsWith(FINDR_URL) &&
            "focus" in client
          ) {
            await client.navigate(targetUrl);
            return client.focus();
          }
        }

        return clients.openWindow(targetUrl);
      })
  );
});
