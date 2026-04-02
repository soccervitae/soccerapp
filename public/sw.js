/// <reference lib="webworker" />

// This file is imported by VitePWA's workbox-generated service worker via importScripts.
// Only push notification and message handling logic goes here.
// Do NOT add install/activate/fetch handlers — workbox manages those.

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

    if (navigator.setAppBadge) {
      navigator.setAppBadge().catch(() => {});
    }
  }

  if (event.data?.type === 'UPDATE_APP_BADGE') {
    const { count } = event.data;
    if (navigator.setAppBadge && count > 0) {
      navigator.setAppBadge(count).catch(() => {});
    } else if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch(() => {});
    }
  }

  if (event.data?.type === 'SHOW_CALL_NOTIFICATION') {
    const { callerName, callType, conversationId, callerId } = event.data;
    
    const callTypeText = callType === 'video' ? 'Videochamada' : 'Chamada de voz';
    
    const extendedVibration = [
      300, 200, 300, 200, 300, 500,
      300, 200, 300, 200, 300, 500,
      300, 200, 300, 200, 300, 500,
      300, 200, 300, 200, 300, 500,
    ];
    
    self.registration.showNotification(`${callerName} está ligando`, {
      body: callTypeText,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: extendedVibration,
      tag: `call-${conversationId}`,
      requireInteraction: true,
      renotify: true,
      silent: false,
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
