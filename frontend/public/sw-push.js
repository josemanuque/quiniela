// Service worker push event handlers — imported by the Workbox-generated SW.
// Handles incoming push notifications and notification click routing.

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: { url: data.url ?? '/app/matches' },
      tag: data.tag ?? 'quiniela',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/app/matches'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.endsWith(url))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
