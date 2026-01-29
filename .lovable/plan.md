
Contexto e diagnóstico (com base no código atual)
- O autoplay “mutado” via IntersectionObserver já existe em `src/components/feed/FeedPost.tsx` (linhas ~161-203).
- Porém o ícone de áudio (botão volume) hoje apenas faz `setIsMusicMuted(!isMusicMuted)` e NÃO chama `audio.play()` no clique.
- Em muitos navegadores (especialmente iOS/Safari), áudio criado com `new Audio()` pode falhar em tocar via scroll/observer (sem gesto do usuário). Mesmo que o autoplay mutado funcione em alguns browsers, o “desmutar” precisa garantir que o áudio esteja efetivamente em reprodução.
- Resultado típico: o usuário clica no ícone, o estado muda, mas como o áudio nunca “iniciou” ou foi pausado/limpo, nada toca.

Objetivo
- Garantir que:
  1) Quando o post entra na viewport, tentamos iniciar o áudio mutado (melhor esforço).
  2) Quando o usuário clicar no ícone de áudio (gesto explícito), nós forçamos o início do playback no próprio handler do clique, para cumprir políticas de autoplay.
  3) No feed do perfil e no feed da home, a experiência seja idêntica (ambos usam `FeedPost`, então o fix é centralizado).

Plano de implementação (frontend)
1) Ajustar o gerenciamento de “visibilidade” do post (viewport)
   - Em `FeedPost.tsx`, criar um state/flag `isMusicInView` (boolean) que o IntersectionObserver atualiza:
     - Quando `entry.isIntersecting && entry.intersectionRatio >= 0.6`: `setIsMusicInView(true)`
     - Quando sai: `setIsMusicInView(false)` e `pause()`
   - Isso permite que o clique no ícone saiba se deve tocar imediatamente.

2) Não recriar o IntersectionObserver quando `isMusicMuted` muda
   - Hoje o effect do observer depende de `isMusicMuted`, o que pode causar recriações e efeitos colaterais (pausa/cleanup) na troca de mute.
   - Trocar para:
     - remover `isMusicMuted` da lista de dependências do observer
     - manter um `isMusicMutedRef` (useRef) sincronizado em um effect separado:
       - `isMusicMutedRef.current = isMusicMuted`
     - no observer, usar `audio.muted = isMusicMutedRef.current` antes do `play()` (para manter o estado atualizado sem recriar observer)

3) Garantir “play” no clique do botão de volume (a correção principal)
   - No botão de música (linhas ~674-687):
     - Ao clicar:
       1) `e.stopPropagation()`
       2) Calcular o próximo estado (`nextMuted = !isMusicMuted`) e setar `setIsMusicMuted(nextMuted)`
       3) Se o post estiver visível (`isMusicInView === true`):
          - Garantir que `musicAudioRef.current` existe (se não, criar `new Audio(musicAudioUrl)` e configurar `loop`)
          - Setar `currentTime = musicStartSeconds`
          - Setar `muted = nextMuted`
          - Chamar `play()` imediatamente dentro do handler
            - Se `play()` falhar, não travar UI; opcionalmente exibir um toast “Toque para habilitar o áudio” (só se fizer sentido no design)
     - Isso faz o áudio começar de verdade quando o usuário interage, resolvendo iOS/Safari e qualquer cenário onde o observer não “pegou”.

4) Evitar múltiplos áudios tocando ao mesmo tempo (melhoria importante)
   - Reaproveitar o padrão já usado em `PostMusicPlayer.tsx`:
     - Criar, no topo do `FeedPost.tsx`, variáveis de módulo:
       - `let currentlyPlayingFeedMusic: HTMLAudioElement | null = null;`
       - `let currentlyPlayingFeedMusicStop: (() => void) | null = null;`
     - Antes de dar play em um novo post, parar o anterior:
       - se `currentlyPlayingFeedMusicStop` existir e for de outro audio, chamar.
     - Definir o “stop” do post atual como função que pausa e reseta se necessário.
   - Benefícios:
     - Evita cacofonia ao rolar e ter vários posts com música “em view”
     - Mantém comportamento consistente com player global.

5) Corrigir loop/trecho (opcional, mas recomendado)
   - Hoje o código usa `loop = true` e define `currentTime = musicStartSeconds`, mas não respeita `musicEndSeconds`.
   - Se vocês usam recorte (start/end), implementar:
     - listener `timeupdate` (ou intervalo leve) para, ao passar de `musicEndSeconds`, voltar para `musicStartSeconds`.
   - Isso evita que o preview “pule” para fora do trecho esperado.

6) Checklist de validação (passo a passo)
   - Home feed (`/`):
     - Rolando: post com música entra na viewport → deve tentar tocar mutado (pode variar por navegador).
     - Clicar no ícone de volume → deve tocar audível imediatamente (principal teste).
   - Profile feed (aba “Posts” do perfil):
     - Mesmo comportamento (já usa `FeedPost`), então o ícone deve aparecer e tocar igual.
   - iOS/Safari (se possível):
     - Testar especificamente o clique no ícone (deve resolver).
   - Verificar que ao sair da viewport:
     - o áudio pausa
     - ao entrar em outro post com música, o anterior para

Arquivos que serão modificados
- `src/components/feed/FeedPost.tsx`
  - Adicionar `isMusicInView`
  - Ref `isMusicMutedRef`
  - Ajustar effect do IntersectionObserver (tirar dependência de `isMusicMuted`, setar `isMusicInView`)
  - Alterar onClick do botão de música para chamar `play()` quando apropriado
  - (Opcional) adicionar controle de “apenas um áudio tocando”
  - (Opcional) respeitar `musicEndSeconds`

Riscos/observações
- Se o `musicAudioUrl` vier de uma fonte que bloqueia streaming/cors/redirects, `Audio.play()` pode falhar. O ajuste do clique resolve a maior parte dos bloqueios por “user gesture”, mas ainda assim é bom acompanhar erros no console.
- Se o usuário clicar no ícone quando o post não está suficientemente visível, a lógica deve decidir: ou toca mesmo assim, ou espera até ficar em view. Eu recomendo: tocar apenas se `isMusicInView` (para evitar áudio “fantasma” fora da tela).

Critério de sucesso
- Ao clicar no ícone de volume em um post com música (home feed e profile feed), a música começa a tocar audivelmente sem precisar de “recarregar”, mesmo após scroll.
