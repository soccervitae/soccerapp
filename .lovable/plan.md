

## Plano: Melhorar Estilo de Mensagens Não Lidas (Estilo Instagram)

### Situação Atual
O sistema **já possui** negrito e badge, mas pode ser melhorado para ficar mais parecido com o Instagram.

### Alterações

**1. `src/components/messages/ConversationItem.tsx`**
- Tornar o nome do remetente mais destacado com `font-extrabold` (ao invés de `font-bold`)
- Tornar o preview da mensagem em `font-semibold text-foreground` (mais forte que o atual `font-medium`)
- Tornar o horário também em negrito quando não lido
- Manter o badge de contagem com estilo mais proeminente (cor primary sólida)

**2. `src/components/profile/BottomNavigation.tsx`**
- O badge no ícone de chat já funciona via `totalUnread` -- sem alterações necessárias aqui, já está correto

### Resumo das Mudanças Visuais
- Nome: `font-bold` → `font-extrabold` quando não lido
- Preview da mensagem: `font-medium` → `font-semibold` quando não lido  
- Horário: adicionar `font-semibold text-foreground` quando não lido
- Badge: manter como está (já funcional)

Apenas 1 arquivo editado: `ConversationItem.tsx`

