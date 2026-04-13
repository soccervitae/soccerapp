

## Plan: Adicionar Video Trimmer ao fluxo de criação de Post

### Resumo
Quando o usuario adicionar um vídeo com mais de 90 segundos no Post, o Video Trimmer (já existente em `VideoTrimmer.tsx`) será exibido para ele escolher qual trecho de 90 segundos deseja usar — mesmo comportamento já implementado em Replay e Destaque.

### Mudanças

#### 1. Atualizar `CreatePost.tsx`
- Importar `VideoTrimmer` de `@/components/feed/VideoTrimmer`
- Adicionar `"video-trimmer"` ao tipo `ViewMode`
- Adicionar estados: `pendingTrimVideo` (url + file do vídeo aguardando corte)
- No `useEffect` de `preSelectedMedia`: ao detectar vídeo, verificar duração. Se > 90s, mostrar o trimmer em vez de ir direto para o editor
- Adicionar handler `handleTrimConfirm(startTime, endTime)` que salva o vídeo cortado e volta ao modo default
- Nos inputs de galeria existentes (quando o usuario adiciona vídeo manualmente), aplicar a mesma verificação de duração
- Renderizar `<VideoTrimmer>` quando `viewMode === "video-trimmer"`

#### 2. Arquivos modificados
- `src/pages/CreatePost.tsx`

