/// <reference lib="webworker" />

const CACHE_NAME = 'soccervitae-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Nova mensagem recebida',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/messages',
      conversationId: data.conversationId,
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' },
    ],
    tag: data.tag || 'message-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Soccer Vitae', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;

  if (event.action === 'close') return;

  // Handle call notifications
  if (data?.isCall) {
    if (event.action === 'reject') {
      // Send message to reject the call
      event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clientList) => {
          for (const client of clientList) {
            client.postMessage({
              type: 'CALL_REJECTED_FROM_NOTIFICATION',
              callerId: data.callerId,
              conversationId: data.conversationId,
            });
          }
        })
      );
      return;
    }

    // Answer action or simple click - open/focus the chat
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'ANSWER_CALL_FROM_NOTIFICATION',
              callerId: data.callerId,
              conversationId: data.conversationId,
            });
            return;
          }
        }
        // Open new window at the chat with answerCall param
        if (self.clients.openWindow) {
          return self.clients.openWindow(`/messages/${data.conversationId}?answerCall=true`);
        }
      })
    );
    return;
  }

  // Handle regular message notifications
  const url = data?.url || '/messages';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: url,
          });
          return;
        }
      }
      // Open new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Message event for showing notifications from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, conversationId } = event.data;
    
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: { url, conversationId },
      tag: `message-${conversationId}`,
      renotify: true,
    });
  }

  // Handle call notifications
  if (event.data?.type === 'SHOW_CALL_NOTIFICATION') {
    const { callerName, callType, conversationId, callerId } = event.data;
    
    const callTypeText = callType === 'video' ? 'Videochamada' : 'Chamada de voz';
    
    self.registration.showNotification(`${callerName} está ligando`, {
      body: callTypeText,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200], // Vibração mais intensa para chamada
      tag: `call-${conversationId}`,
      requireInteraction: true, // Não desaparece automaticamente
      renotify: true,
      actions: [
        { action: 'answer', title: 'Atender' },
        { action: 'reject', title: 'Recusar' },
      ],
      data: { 
        conversationId, 
        callerId,
        callType,
        isCall: true,
        url: `/messages/${conversationId}`,
      },
    });
  }
});
