

## Plano: Corrigir Negrito em Mensagens Não Lidas e Contador no Badge

### Diagnóstico

A infraestrutura já existe (ConversationsProvider, ConversationItem com estilos bold, badge no BottomNavigation). O problema provável é a **query de contagem de não lidas** na linha 147 do `useConversations.ts`:

```
.or(`read_by.is.null,not.read_by.cs.{${user.id}}`)
```

O operador `not.read_by.cs.{...}` dentro de `.or()` pode não funcionar corretamente com o PostgREST — a sintaxe para negar dentro de `or` é diferente. Isso faz com que `unreadCount` retorne sempre 0, quebrando tanto o negrito quanto o badge.

Além disso, quando o usuário abre o chat e lê as mensagens, o `read_by` pode não estar sendo atualizado corretamente, fazendo com que a contagem nunca mude.

### Alterações

**1. `src/hooks/useConversations.ts`** — Corrigir query de contagem de não lidas
- Trocar a query `.or(...)` por uma abordagem mais confiável usando `not` filter separado
- Usar `.not('read_by', 'cs', `{"${user.id}"}`)` como filtro direto ao invés de dentro do `.or()`
- Manter o filtro `read_by.is.null` tratado separadamente ou via RPC

**2. `src/hooks/useMessages.ts`** — Garantir que `read_by` é atualizado ao abrir chat
- Verificar se ao entrar no chat as mensagens recebidas são marcadas como lidas (adicionando o `user.id` ao array `read_by`)
- Após marcar como lidas, disparar `refetch` do ConversationsContext para atualizar badge

**3. `src/components/messages/ConversationItem.tsx`** — Sem alterações (estilos bold já estão corretos)

**4. `src/components/profile/BottomNavigation.tsx`** — Sem alterações (badge já usa `totalUnread` do contexto)

### Resumo
- Fix na query PostgREST para contar não lidas corretamente
- Garantir marcação de leitura ao abrir conversa
- Badge e negrito já funcionam — só dependem de `unreadCount > 0` retornar o valor correto

