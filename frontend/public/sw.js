self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body,
        icon: '/favicon.ico',
        image: payload.image, // Display visual sacred art directly in notification card
        badge: '/favicon.ico',
        data: {
          url: payload.url || '/'
        }
      };

      event.waitUntil(
        self.registration.showNotification(payload.title || '🪔 Krishna Bodha', options)
      );
    } catch (e) {
      console.error('Error parsing push data:', e);
      // Fallback plain text notification
      event.waitUntil(
        self.registration.showNotification('🪔 Krishna Bodha Shloka', {
          body: event.data.text(),
          icon: '/favicon.ico'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Open the specific shloka URL when notification is clicked
  const shlokaUrl = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/';
    
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // If a window is already open, focus it and redirect
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(shlokaUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(shlokaUrl);
      }
    })
  );
});
