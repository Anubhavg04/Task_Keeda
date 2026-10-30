self.addEventListener('push', (event) => {
  let notification = {
    title: 'TaskFlow update',
    body: 'Open TaskFlow to see what needs your attention.',
    url: '/',
  };

  if (event.data) {
    try {
      notification = { ...notification, ...event.data.json() };
    } catch {
      notification.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: '/taskflow-icon.svg',
    badge: '/taskflow-icon.svg',
    tag: 'taskflow-update',
    data: { url: notification.url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = typeof event.notification.data?.url === 'string'
    ? event.notification.data.url
    : '/';

  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
    const target = new URL(path, self.location.origin);
    const targetUrl = target.origin === self.location.origin ? target.href : new URL('/', self.location.origin).href;
    const appClient = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (appClient) {
      await appClient.navigate(targetUrl);
      return appClient.focus();
    }
    return self.clients.openWindow(targetUrl);
  }));
});
