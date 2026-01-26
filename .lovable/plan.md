
## Plano: Redesign da Página CreateReplay com UI Moderna e Fundo Preto

### Objetivo
Transformar a página de criação de Replay em uma experiência visual mais moderna e imersiva, com fundo completamente preto e elementos de UI estilo Instagram/TikTok.

---

### Mudanças de Design Propostas

#### 1. Fundo e Tema Geral
- **Fundo principal**: Preto sólido (`bg-black`) em toda a página
- **Seção de galeria**: Fundo escuro com gradiente sutil (`bg-zinc-950` ou `bg-neutral-950`)
- **Remover bordas claras**: Substituir `border-border` por bordas escuras sutis

#### 2. Header Redesenhado
- Fundo transparente com blur (`bg-black/60 backdrop-blur-xl`)
- Botão de fechar com estilo minimalista (ícone branco sem fundo)
- Título "Novo Replay" em branco
- Botão "Avançar" com estilo mais destacado (fundo primary quando ativo)

#### 3. Área de Preview Melhorada
- Manter fundo preto
- Adicionar gradiente escuro na parte inferior para os controles
- Controles flutuantes com glassmorphism mais pronunciado
- Indicador de música com animação de vinil/disco girando

#### 4. Grid de Galeria Modernizado
- Tiles de ação (Galeria, Foto, Vídeo) com design glassmorphism
- Ícones com brilho/glow sutil
- Bordas arredondadas maiores nos tiles
- Seleção com borda brilhante ao invés de escala
- Indicador de seleção com gradiente animado

#### 5. Detalhes Visuais
- Usar `zinc-900`, `zinc-800` para tons intermediários
- Textos em `white`, `white/80`, `white/60` para hierarquia
- Spinners de loading em branco
- Tabs de filtro (All/Photos/Videos) com estilo pill

---

### Estrutura Visual Proposta

```text
┌─────────────────────────────────────┐
│  ✕          Novo Replay    Avançar  │  ← Header transparente com blur
├─────────────────────────────────────┤
│                                     │
│                                     │
│         [PREVIEW MÍDIA]             │  ← Área de preview 45%
│                                     │
│    ┌──────────────────────────┐     │
│    │ 🎵 Música · Artista      │     │  ← Indicador de música
│    └──────────────────────────┘     │
│  [⬜]          [✨] [🎵]            │  ← Controles flutuantes
├─────────────────────────────────────┤
│  [Galeria] [Foto] [Vídeo] [Multi]   │  ← Action tiles com glow
├─────────────────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│  │   │ │   │ │   │ │   │           │  ← Grid de galeria
│  └───┘ └───┘ └───┘ └───┘           │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│  │   │ │   │ │   │ │   │           │
│  └───┘ └───┘ └───┘ └───┘           │
└─────────────────────────────────────┘
```

---

### Alterações Técnicas

#### Arquivo: `src/pages/CreateReplay.tsx`

**Container Principal:**
```tsx
// De:
<div className="h-screen w-full flex flex-col bg-background">

// Para:
<div className="h-screen w-full flex flex-col bg-black">
```

**Header:**
```tsx
// De:
<div className="flex items-center justify-between px-4 py-3 border-b border-border">

// Para:
<div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl">
```

**Botões do Header:**
```tsx
// De:
<button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted">
  <span className="text-foreground">close</span>

// Para:
<button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
  <span className="text-white">close</span>
```

**Botão Avançar:**
```tsx
// De:
<Button variant="ghost" className="text-primary">

// Para:
<Button 
  className={`rounded-full px-4 ${
    hasSelection 
      ? 'bg-primary text-white hover:bg-primary/90' 
      : 'bg-white/10 text-white/40'
  }`}
>
```

**Seção de Galeria:**
```tsx
// De:
<div className="flex-1 flex flex-col min-h-0 bg-background">

// Para:
<div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
```

**Tiles de Ação (Galeria, Foto, Vídeo):**
```tsx
// De:
<button className="bg-muted flex flex-col items-center">
  <div className="w-10 h-10 bg-blue-500/20 rounded-full">

// Para:
<button className="bg-zinc-900/80 backdrop-blur-sm rounded-lg flex flex-col items-center border border-white/5 hover:border-white/20">
  <div className="w-11 h-11 bg-gradient-to-br from-blue-500/30 to-blue-600/10 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/10">
```

**Itens da Galeria:**
```tsx
// De:
className={`... ${isSelected ? 'scale-90 rounded-lg' : ''}`}

// Para:
className={`... ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black rounded-sm' : ''}`}
```

**Loading States:**
```tsx
// De:
<div className="border-2 border-primary border-t-transparent">

// Para:
<div className="border-2 border-white border-t-transparent">
```

**Textos e Labels:**
```tsx
// De:
<span className="text-muted-foreground">

// Para:
<span className="text-white/60">
```

---

### Elementos de UI Modernos a Adicionar

1. **Tile de Multi-seleção**: Adicionar botão para ativar seleção múltipla na barra de ações
2. **Gradiente no Preview**: Adicionar gradiente escuro na parte inferior do preview
3. **Animação no Indicador de Música**: Adicionar ícone de vinil girando
4. **Hover States**: Transições suaves com `transition-all duration-200`
5. **Safe Area Insets**: Garantir compatibilidade com notch/dynamic island

---

### Paleta de Cores

| Elemento | Cor |
|----------|-----|
| Fundo principal | `#000000` (black) |
| Fundo galeria | `#0a0a0a` (zinc-950) |
| Tiles de ação | `#18181b` (zinc-900) |
| Bordas | `rgba(255,255,255,0.05)` |
| Texto primário | `#ffffff` |
| Texto secundário | `rgba(255,255,255,0.6)` |
| Accent | `#426F42` (primary) |

---

### Arquivos a Modificar

1. **`src/pages/CreateReplay.tsx`** - Aplicar todas as mudanças de estilo descritas acima

### Resultado Esperado
Uma página de criação de Replay com visual moderno e imersivo, seguindo tendências de design de apps como Instagram Stories, TikTok e CapCut, com fundo escuro e elementos glassmorphism.
