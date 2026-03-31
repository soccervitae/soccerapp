

## Plano: Sistema de Notificação PWA para Mensagens no Chat

### Situação Atual
O projeto **já possui** a infraestrutura de notificações:
- Badge no ícone de mensagens no menu inferior (via `totalUnread`)
- Service Worker com suporte a push notifications
- Realtime subscription para novas mensagens
- `MessageNotificationProvider` montado globalmente

### O que falta
1. **App Badge API** — mostrar badge no ícone do PWA instalado (na home screen)
2. **Garantir que o badge atualiza em tempo real** quando o app está em background
3. **Solicitar permissão de notificação** automaticamente ao entrar no app

### Alterações

**1. Adicionar App Badge API ao `useConversations.ts`**
- Quando `totalUnread` mudar, chamar `navigator.setAppBadge(count)` para atualizar o badge no ícone do PWA na home screen
- Chamar `navigator.clearAppBadge()` quando count for 0

**2. Atualizar `usePushNotifications.ts`**
- Adicionar auto-request de permissão quando o app roda como PWA
- Melhorar o `showNotification` para incluir o badge count no payload

**3. Atualizar `public/sw.js`**
- Adicionar lógica para atualizar o app badge quando receber notificação push
- Manter badge sincronizado mesmo com app em background

**4. Adicionar prompt de permissão no `Index.tsx` (feed)**
- Mostrar botão/banner pedindo permissão de notificação na primeira vez que o usuário abre o app como PWA

### Detalhes Técnicos
- `navigator.setAppBadge()` é suportado em Chrome/Edge PWA (Android e Desktop)
- O service worker já está configurado e funcional
- O realtime do Supabase já escuta novas mensagens globalmente
- O badge no bottom navigation já funciona — este plano adiciona o badge no ícone do PWA na home screen e garante notificações push funcionais

