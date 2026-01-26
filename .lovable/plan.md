
## Plano: Aplicar Layout Moderno da CreateReplay para CreateHighlight

### Objetivo
Transformar a página de criação de Destaque (CreateHighlight) no mesmo estilo visual moderno e imersivo da página CreateReplay, com fundo preto e elementos glassmorphism.

---

### Mudanças de Design

#### 1. Tema Geral
- **Fundo principal**: Preto sólido (`bg-black`) em toda a página
- **Seção de conteúdo**: Fundo escuro (`bg-zinc-950`)
- **Textos**: Brancos com variações de opacidade (`white`, `white/60`, `white/40`)

#### 2. Header Modernizado
- Fundo transparente com blur (`bg-black/60 backdrop-blur-xl`)
- Ícone de voltar em branco
- Título centralizado em branco
- Botão "Salvar" com estilo glassmorphism quando inativo, primary quando ativo

#### 3. Modo de Seleção (Select Mode)
- Cards de destaque com fundo `zinc-900/80` e bordas sutis `white/10`
- Hover com `white/20` para feedback visual
- Botão "Criar novo" com ícone em gradiente primary
- Avatares com bordas escuras

#### 4. Modo de Criação (Create Mode)
- Input com fundo `zinc-900` e borda `white/10`
- Grid de mídia com tiles glassmorphism
- Botão de adicionar mídia com gradiente
- Indicadores de seleção com glow

#### 5. Modo de Edição (Edit Mode)
- Manter consistência com modo de criação
- Progress bar com cores adaptadas ao tema escuro

---

### Estrutura Visual

```text
┌─────────────────────────────────────┐
│  ←       Destaques/Novo      Salvar │  ← Header transparente + blur
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ➕ Criar novo destaque      │    │  ← Card glassmorphism
│  └─────────────────────────────┘    │
│                                     │
│  ── Seus Destaques ──               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🖼 Destaque 1 · 5 mídias    │    │  ← Cards existentes
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 🖼 Destaque 2 · 3 mídias    │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

### Alterações Técnicas no CreateHighlight.tsx

#### Container Principal
```tsx
// De:
<div className="min-h-screen bg-background">

// Para:
<div className="min-h-screen bg-black">
```

#### Header
```tsx
// De:
<div className="sticky top-0 z-10 flex items-center ... border-b border-border bg-background">
  <button className="... hover:bg-muted">
    <ArrowLeft className="w-5 h-5" />

// Para:
<div className="sticky top-0 z-10 flex items-center ... bg-black/60 backdrop-blur-xl">
  <button className="... hover:bg-white/10 transition-all duration-200">
    <ArrowLeft className="w-5 h-5 text-white" />
  <span className="text-base font-semibold text-white">
```

#### Cards de Seleção
```tsx
// De:
<button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50">
  <div className="h-14 w-14 rounded-full bg-primary/10 flex ... border-2 border-dashed border-primary">

// Para:
<button className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-900/80 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-200">
  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex ... border-2 border-dashed border-primary/60 shadow-lg shadow-primary/10">
```

#### Avatares de Destaques Existentes
```tsx
// De:
<Avatar className="h-14 w-14 border-2 border-border">

// Para:
<Avatar className="h-14 w-14 border-2 border-white/20">
```

#### Labels e Textos
```tsx
// De:
<p className="text-sm font-medium text-muted-foreground">

// Para:
<p className="text-sm font-medium text-white/60">
```

#### Inputs
```tsx
// De:
<Input ... />

// Para:
<Input className="bg-zinc-900 border-white/10 text-white placeholder:text-white/40 focus:border-white/30" ... />
```

#### Tiles de Mídia
```tsx
// De:
<div className="w-20 h-20 rounded-lg bg-muted border-2 border-dashed border-border">

// Para:
<div className="w-20 h-20 rounded-lg bg-zinc-900/80 border-2 border-dashed border-white/20 backdrop-blur-sm">
```

#### Botões
```tsx
// De:
<Button type="submit" disabled={...} className="w-full">

// Para:
<Button 
  type="submit" 
  disabled={...} 
  className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200 disabled:bg-white/10 disabled:text-white/40"
>
```

#### Progress Bar (Edit Mode)
```tsx
// De:
<div className="flex flex-col gap-2 p-3 bg-muted rounded-lg">

// Para:
<div className="flex flex-col gap-2 p-3 bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-white/10">
```

#### Componentes SortableMedia e SortableExistingMedia
```tsx
// De:
<img ... className="... border-2 border-border" />
<div className="... bg-background/80 ...">

// Para:
<img ... className="... border-2 border-white/20" />
<div className="... bg-black/60 backdrop-blur-sm border border-white/10 ...">
```

---

### Paleta de Cores

| Elemento | Cor |
|----------|-----|
| Fundo principal | `#000000` (black) |
| Fundo conteúdo | `#0a0a0a` (zinc-950) |
| Cards/Tiles | `#18181b` (zinc-900) com opacity |
| Bordas | `rgba(255,255,255,0.1)` |
| Texto primário | `#ffffff` |
| Texto secundário | `rgba(255,255,255,0.6)` |
| Texto terciário | `rgba(255,255,255,0.4)` |
| Accent | `#426F42` (primary) |

---

### Arquivos a Modificar

1. **`src/pages/CreateHighlight.tsx`** - Aplicar todas as mudanças de estilo

### Resultado Esperado
Uma página de Destaque com o mesmo visual moderno e imersivo da página de Replay, mantendo consistência visual em todo o fluxo de criação de conteúdo.
