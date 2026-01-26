
## Plano: Migrar Replay e Destaque para Páginas Dedicadas

### Objetivo
Converter as funcionalidades de criação de Replay e Destaque de modais/sheets para páginas dedicadas em tela cheia, seguindo o mesmo padrão implementado para `/create-post`.

---

### Arquitetura Proposta

```text
Antes:                              Depois:
┌────────────────────┐              ┌────────────────────┐
│  BottomNavigation  │              │  BottomNavigation  │
│         +          │              │         +          │
│  CreateMenuSheet   │              │  CreateMenuSheet   │
│         │          │              │         │          │
│    ┌────┴────┐     │              │    ┌────┴────┐     │
│    │ Sheets: │     │              │    │ Páginas:│     │
│    │ Replay  │     │              │    │/create- │     │
│    │Highlight│     │              │    │ replay  │     │
│    └─────────┘     │              │    │/create- │     │
│                    │              │    │highlight│     │
└────────────────────┘              └────────────────────┘
```

---

### Mudanças Necessárias

#### 1. Criar página `/create-replay` (src/pages/CreateReplay.tsx)

**Lógica a migrar do CreateReplaySheet:**
- Seleção de mídia (foto/vídeo) da galeria ou câmera
- Preview da mídia selecionada
- Seleção de música com trimmer
- Editor de texto/stickers (ReplayTextStickerEditor)
- Publicação do replay

**Estrutura da página:**
- Header com botão voltar e título "Novo Replay"
- Área de preview (40% da tela)
- Grid da galeria com tiles de câmera/vídeo
- Navegação para editor de texto ao avançar

---

#### 2. Criar página `/create-highlight` (src/pages/CreateHighlight.tsx)

**Lógica a migrar do AddHighlightSheet:**
- Campo de título do destaque
- Seleção múltipla de fotos/vídeos
- Grid com drag-and-drop para reordenar
- Upload e compressão de imagens
- Salvamento do destaque

**Estrutura da página:**
- Header com botão voltar e "Salvar"
- Campo de título
- Grid de mídia com opção de adicionar mais
- Indicador de progresso no upload

---

#### 3. Atualizar Rotas (src/App.tsx)

Adicionar novas rotas protegidas:
```tsx
<Route path="/create-replay" element={
  <ProtectedRoute>
    <PageTransition><CreateReplay /></PageTransition>
  </ProtectedRoute>
} />

<Route path="/create-highlight" element={
  <ProtectedRoute>
    <PageTransition><CreateHighlight /></PageTransition>
  </ProtectedRoute>
} />
```

---

#### 4. Atualizar BottomNavigation (src/components/profile/BottomNavigation.tsx)

**Mudanças:**
- Remover imports dos sheets (CreateReplaySheet, AddHighlightSheet, SelectHighlightSheet, EditHighlightSheet)
- Remover estados relacionados (isReplayOpen, isSelectHighlightOpen, etc.)
- Alterar `handleSelectOption`:
  - `"replay"` → `navigate("/create-replay")`
  - `"highlight"` → `navigate("/create-highlight")`

**Código simplificado:**
```tsx
const handleSelectOption = (option: CreateOption) => {
  switch (option) {
    case "post":
      navigate("/create-post");
      break;
    case "replay":
      navigate("/create-replay");
      break;
    case "highlight":
      navigate("/create-highlight");
      break;
    case "times":
      navigate("/select-teams");
      break;
    // ... championship e achievement continuam como sheets
  }
};
```

---

### Fluxo de Destaque Existente

O fluxo atual de destaque tem dois caminhos:
1. **Criar novo** → AddHighlightSheet
2. **Editar existente** → SelectHighlightSheet → EditHighlightSheet

**Nova abordagem:**
- `/create-highlight` mostrará a lista de destaques existentes no topo
- Usuário pode clicar em um existente para editar ou criar novo
- Tudo em uma única página com abas ou seções

---

### Detalhes Técnicos

#### CreateReplay.tsx
- Reutilizar lógica do CreateReplaySheet
- Usar `useDeviceCamera` e `useDeviceGallery`
- Manter ReplayTextStickerEditor como sub-view
- Navegar de volta com `navigate(-1)` ou para home após publicar

#### CreateHighlight.tsx
- Reutilizar lógica do AddHighlightSheet e SelectHighlightSheet
- Mostrar destaques existentes do usuário via `useUserHighlights`
- Permitir edição inline ou criar novo
- Usar `useAddHighlight` para salvar

---

### Arquivos a Criar
1. `src/pages/CreateReplay.tsx` - Página de criação de replay
2. `src/pages/CreateHighlight.tsx` - Página de criação/edição de destaque

### Arquivos a Modificar
1. `src/App.tsx` - Adicionar novas rotas
2. `src/components/profile/BottomNavigation.tsx` - Simplificar navegação

### Arquivos que Podem ser Removidos (após migração)
1. `src/components/feed/CreateReplaySheet.tsx` - Lógica migrada para página
2. `src/components/profile/AddHighlightSheet.tsx` - Lógica migrada para página
3. `src/components/profile/SelectHighlightSheet.tsx` - Lógica integrada na página
