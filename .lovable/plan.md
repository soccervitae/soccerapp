

## Plan: Fluxo de postagem mobile com seleção de mídia via sheet e limite de 90s

### Resumo
Quando o usuario clicar em Post, Replay ou Destaque no menu de criação (mobile), ao invés de navegar diretamente para a página de criação, um sheet abrirá com o input nativo do dispositivo para selecionar mídia. Após selecionar, navega para a página de criação com a mídia já carregada. Vídeos terão limite de 90 segundos em todos os tipos de conteúdo.

### Mudanças

#### 1. Remover bloqueios Pro restantes
- **CreateReplay.tsx** (linhas 20-27): Remover o `useEffect` que redireciona usuários não-premium
- **CreateHighlight.tsx** (linhas 184-191): Remover o `useEffect` que redireciona usuários não-premium

#### 2. Remover restrição de vídeo para não-Pro no CreatePost
- **CreatePost.tsx** (linhas 772-794): Remover o condicional `isPro || isOfficialAccount` que esconde os botões de vídeo e mostra YouTube. Todos os usuários terão acesso a vídeo da galeria e gravação.

#### 3. Criar componente `MediaPickerSheet`
Novo arquivo `src/components/feed/MediaPickerSheet.tsx`:
- Recebe `open`, `onOpenChange`, `type` (post/replay/highlight)
- Abre como Drawer (mobile) usando o componente Drawer existente
- Dispara o input nativo de arquivo (`<input type="file">`) automaticamente ao abrir
- Para **Post**: aceita imagens e vídeos (`accept="image/*,video/*"`, multiple para imagens)
- Para **Replay**: aceita 1 imagem ou vídeo (`accept="image/*,video/*"`)
- Para **Highlight**: aceita imagens e vídeos (`accept="image/*,video/*"`, multiple)
- Valida duração do vídeo (max 90s) usando `<video>` element
- Exibe mensagem informativa: "Vídeos devem ter no máximo 90 segundos"
- Após seleção válida, navega para a página de criação passando arquivos via `location.state`

#### 4. Integrar MediaPickerSheet no fluxo de navegação
- **BottomNavigation.tsx**: No `handleSelectOption`, para post/replay/highlight, abrir o `MediaPickerSheet` em vez de navegar diretamente
- Adicionar estado para controlar qual tipo está sendo criado e se o sheet está aberto

#### 5. Atualizar páginas de criação para aceitar mídia pré-selecionada
- **CreatePost.tsx**: Ler arquivos de `location.state.preSelectedMedia` e popular `selectedMediaList`
- **CreateReplay.tsx**: Ler arquivo de `location.state.preSelectedMedia` e popular `capturedMedia`
- **CreateHighlight.tsx**: Ler arquivos de `location.state.preSelectedMedia` e popular `mediaItems`

#### 6. Validação de 90s em todos os fluxos
Adicionar validação nos 3 fluxos quando o usuário adiciona vídeos adicionais diretamente nas páginas de criação. Mostrar toast de erro "Vídeo excede o limite de 90 segundos" se falhar. Exibir aviso informativo nas áreas de seleção de mídia.

### Arquivos a criar
- `src/components/feed/MediaPickerSheet.tsx`

### Arquivos a modificar
- `src/components/profile/BottomNavigation.tsx` — integrar MediaPickerSheet
- `src/pages/CreatePost.tsx` — aceitar mídia via state, remover restrição Pro em vídeo, adicionar validação 90s
- `src/pages/CreateReplay.tsx` — aceitar mídia via state, remover bloqueio Pro
- `src/pages/CreateHighlight.tsx` — aceitar mídia via state, remover bloqueio Pro, adicionar validação 90s

