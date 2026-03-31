

## Plano: Tabs do Perfil Estilo Instagram (Sem Recarregar, Sem Mover Scroll)

### Problema
Dois problemas causam o efeito de "recarregar página" ao trocar abas:

1. **Animação de fade** — O `motion.div` que envolve os `TabsContent` tem `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`, causando fade-in em cada troca de aba
2. **Scroll restoration complexa demais** — O `useLayoutEffect` com múltiplos `restoreAll`, timeouts e RAFs causa saltos visuais. Quando as tabs estão sticky no topo, o scroll simplesmente não deveria mudar

### Solução (Estilo Instagram)
Quando as tabs estão fixas no topo, trocar de aba deve apenas substituir o conteúdo abaixo — sem animação, sem alterar scroll.

### Alterações — `src/pages/Profile.tsx`

**1. Remover animação de fade do conteúdo das tabs**
- Trocar o `motion.div` que envolve os `TabsContent` (linha 619-633) por uma `div` simples sem animação
- Manter o `drag="x"` para swipe se desejado, mas sem `initial`/`animate` de opacidade

**2. Simplificar `changeTabPreservingScroll`**
- Quando as tabs estão sticky (scroll >= tabsOffsetY), simplesmente trocar a aba sem mexer no scroll
- Quando NÃO está sticky, salvar e restaurar normalmente

**3. Simplificar `useLayoutEffect` de scroll**
- Quando `wasStickyRef.current` é true, não fazer nada (manter scroll onde está)
- Quando false (primeira visita à aba ou não sticky), scrollar para a posição salva ou para as tabs
- Remover os múltiplos timeouts e RAF redundantes

### Resultado
- Trocar aba com tabs sticky = conteúdo muda instantaneamente, scroll não se move
- Sem fade-in, sem saltos, comportamento idêntico ao Instagram

