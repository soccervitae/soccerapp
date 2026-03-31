

## Plano: Corrigir Realtime de Mensagens e Notificação de Não Lidas

### Diagnóstico

A tabela `messages` **já está** na publicação `supabase_realtime` e as subscriptions existem nos hooks. O problema está em dois pontos:

1. **`useConversations` é instanciado separadamente** em `BottomNavigation` e em `Messages.tsx` — cada instância cria seu próprio estado e subscription. O `BottomNavigation` tem sua própria instância que faz fetch completo (N+1 queries por conversa), o que pode ser lento e não refletir mudanças imediatamente.

2. **`handleNewMessage` captura `fetchConversations` stale** — `fetchConversations` não é memoizada com `useCallback`, mas `handleNewMessage` é um `useCallback` que não a inclui nas deps. Isso pode causar problemas onde o realtime callback não atualiza o estado corretamente.

3. **Sem contexto compartilhado** — cada componente que chama `useConversations()` cria uma instância independente com subscriptions duplicadas e estados separados, então o badge no `BottomNavigation` pode não atualizar quando a lista em `Messages.tsx` atualiza.

### Alterações

**1. Criar `ConversationsContext`** (novo arquivo `src/contexts/ConversationsContext.tsx`)
- Mover a lógica do `useConversations` para um Context Provider
- Instanciar UMA VEZ no nível do app (em `App.tsx` dentro de routes autenticadas)
- Todas as chamadas a `useConversations()` retornam o MESMO estado compartilhado
- Isso garante que quando uma mensagem nova chega via realtime, TODOS os componentes veem a atualização (badge + lista)

**2. Corrigir memoização em `useConversations`**
- Envolver `fetchConversations` em `useCallback` com deps `[user]`
- Incluir `fetchConversations` nas deps de `handleNewMessage`
- Garantir que o channel subscription se recrie corretamente quando as callbacks mudam

**3. Atualizar `BottomNavigation.tsx`**
- Usar o novo `useConversationsContext()` ao invés de `useConversations()`

**4. Atualizar `Messages.tsx`**
- Usar o novo `useConversationsContext()` ao invés de `useConversations()`

**5. Atualizar `App.tsx`**
- Envolver routes autenticadas com `<ConversationsProvider>`

### Resultado
- Mensagens aparecem em tempo real no chat (já funciona via `useMessages`)
- Badge no ícone de mensagens atualiza instantaneamente quando chega mensagem nova
- Notificação de não lidas funciona corretamente porque o estado é compartilhado
- Menos subscriptions duplicadas = melhor performance

### Arquivos Modificados
- `src/contexts/ConversationsContext.tsx` (novo)
- `src/hooks/useConversations.ts` (memoização)
- `src/components/profile/BottomNavigation.tsx` (usar contexto)
- `src/pages/Messages.tsx` (usar contexto)
- `src/App.tsx` (adicionar provider)

