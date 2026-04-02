

# Chat Popup no Desktop (estilo redes sociais)

## Problema
Quando o usuário está no desktop e clica no botão de mensagem no perfil de outro usuário, ele é redirecionado para uma página inteira de chat (`/messages/:conversationId`). O usuário quer um chat flutuante no canto inferior direito, como Facebook Messenger e Instagram fazem no desktop.

## Solução
Criar um sistema de chat popup flutuante que aparece no canto inferior direito da tela quando o usuário está em desktop. No mobile, o comportamento atual (navegar para a página de chat) será mantido.

## Arquitetura

```text
┌─────────────────────────────────────────────┐
│  Qualquer página desktop                    │
│                                             │
│                          ┌──────────────┐   │
│                          │ Chat Popup   │   │
│                          │ ┌──────────┐ │   │
│                          │ │ Header   │ │   │
│                          │ │ Messages │ │   │
│                          │ │ Input    │ │   │
│                          │ └──────────┘ │   │
│                          └──────────────┘   │
└─────────────────────────────────────────────┘
```

## Plano de implementação

### 1. Criar contexto global de Chat Popup
- Novo arquivo: `src/contexts/ChatPopupContext.tsx`
- Estado global: `activeChat` (conversationId + participant info), `isOpen`, `isMinimized`
- Funções: `openChat(conversationId, participant)`, `closeChat()`, `toggleMinimize()`
- Envolver o App com este provider

### 2. Criar componente `DesktopChatPopup`
- Novo arquivo: `src/components/messages/DesktopChatPopup.tsx`
- Janela flutuante fixa no canto inferior direito (width: 380px, height: ~500px)
- Reutiliza os componentes existentes: `ChatHeader` (versão compacta), `MessageBubble`, `ChatInput`
- Usa os hooks existentes: `useMessages`, `useTypingIndicator`, `useMessageReactions`
- Estado minimizado: mostra apenas o header com nome e avatar
- Botão de fechar e minimizar no header
- Animação de entrada/saída suave

### 3. Modificar `ProfileInfo.tsx` - `handleMessageClick`
- No desktop (`!isMobile`), em vez de `navigate(/messages/${conversationId})`, chamar `openChat(conversationId, participant)` do contexto
- No mobile, manter o `navigate` atual

### 4. Modificar `RightSidebar.tsx` - `handleStartChat`
- Mesmo ajuste: no desktop, abrir popup em vez de navegar

### 5. Integrar no App
- Renderizar `DesktopChatPopup` globalmente no layout (apenas em desktop)
- O popup aparece sobre qualquer página sem mudar a rota

## Detalhes técnicos
- O popup usa `position: fixed` com `bottom: 20px; right: 20px` e `z-index: 50`
- Scroll automático para novas mensagens (reutiliza lógica do Chat.tsx)
- Suporte a reply, reactions, typing indicator (mesmos hooks)
- Shadow e border para destacar do conteúdo
- Transição com framer-motion para abrir/fechar

