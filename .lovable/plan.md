

## Plano: Design Moderno Desktop para Página de Perfil

### Problema Atual
A página de perfil no desktop está com layout vertical centralizado "esticado" — parece uma versão mobile ampliada. Falta a estrutura horizontal típica de redes sociais como Twitter/Instagram desktop.

### Design Proposto

```text
┌──────────────────────────────────────────────────────────────┐
│                      DesktopHeader                           │
├─────────┬────────────────────────────────────────┬───────────┤
│         │  ┌──────────────────────────────────┐   │           │
│ Desktop │  │  Cover Photo (h-48, rounded-xl)  │   │  Right    │
│ Sidebar │  ├──────────────────────────────────┤   │  Sidebar  │
│         │  │ [Avatar]  Nome Completo           │   │           │
│         │  │           @username | Posição     │   │           │
│         │  │           Bio                     │   │           │
│         │  │  123 Torcedores  45 Torcendo      │   │           │
│         │  │  [Idade][Altura][Peso][Pé]        │   │           │
│         │  │  [Editar Perfil] [Compartilhar]   │   │           │
│         │  ├──────────────────────────────────┤   │           │
│         │  │  Highlights (horizontal scroll)   │   │           │
│         │  ├──────────────────────────────────┤   │           │
│         │  │  [Posts] [Times] [Vídeos] [...]   │   │           │
│         │  │  ─────────────────────────────    │   │           │
│         │  │  Feed / Grid content              │   │           │
│         │  └──────────────────────────────────┘   │           │
└─────────┴────────────────────────────────────────┴───────────┘
```

**Diferenças-chave vs atual (mobile-like):**
- Avatar ao lado esquerdo do nome (layout horizontal), não centralizado em cima
- Cover photo mais alta (h-48) com bordas arredondadas
- Stats e botões em linha horizontal, não empilhados
- Card com fundo e sombra envolvendo o perfil
- Physical stats em card mais compacto e horizontal

### Mudanças

**Arquivo: `src/components/profile/ProfileInfo.tsx`**
1. Receber prop `isDesktop` (boolean)
2. Quando `isDesktop=true`, renderizar layout alternativo:
   - Cover photo com `h-48 rounded-xl`
   - Avatar posicionado à esquerda com nome/bio ao lado (flexbox horizontal)
   - Stats (torcedores/torcendo) e physical stats inline
   - Botões de ação com tamanho adequado para desktop
   - Tudo dentro de um card com `bg-card rounded-xl shadow-sm`

**Arquivo: `src/pages/Profile.tsx`**
1. Passar `isDesktop={!isMobile}` para `ProfileInfo` no desktop layout
2. Remover `px-4` extra no container desktop do highlights
3. Envolver o conteúdo desktop em card arredondado

### Resultado
O perfil desktop terá aparência de rede social moderna com layout horizontal para info do usuário, cover photo destacada, e visual com cards arredondados — sem parecer uma tela mobile esticada.

