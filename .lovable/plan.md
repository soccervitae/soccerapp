

## Plano: Layout Desktop para Página de Perfil

### Objetivo
Aplicar o mesmo layout de 3 colunas usado na página Home (Index.tsx) à página de Perfil quando acessada por desktop: sidebar esquerda com menu, conteúdo do perfil centralizado, e sidebar direita com sugestões de usuários e trending.

### Layout Desktop (≥768px)

```text
┌─────────────────────────────────────────────────────┐
│                   DesktopHeader                     │
├──────────┬────────────────────────┬─────────────────┤
│          │                        │                 │
│ Desktop  │   Conteúdo do Perfil   │  RightSidebar   │
│ Sidebar  │   (max-w-2xl, centro)  │  (sugestões +   │
│ (menu)   │                        │   trending)     │
│  w-64    │  ProfileHeader         │    w-80         │
│          │  ProfileInfo           │                 │
│          │  Highlights            │                 │
│          │  Tabs + Feed           │                 │
│          │                        │                 │
└──────────┴────────────────────────┴─────────────────┘
```

### Mudanças

**Arquivo: `src/pages/Profile.tsx`**

1. Importar `useIsMobile`, `DesktopHeader`, `DesktopSidebar`, `RightSidebar`
2. No retorno final, detectar se é desktop com `useIsMobile()`
3. Se desktop: renderizar o layout com `DesktopHeader` + 3 colunas (`DesktopSidebar` | conteúdo centralizado em `max-w-2xl` | `RightSidebar`), sem `BottomNavigation` e sem `ProfileHeader` fixo (usar o do DesktopHeader)
4. Se mobile: manter o layout atual sem mudanças
5. Remover `pb-24` no desktop (não tem bottom nav)

### Resultado
A página de perfil no desktop terá a mesma estrutura visual do feed principal, com navegação lateral e sidebar de sugestões, semelhante a redes sociais como Twitter/X.

