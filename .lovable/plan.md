
## Plano: Corrigir Autoplay de Música nos Posts do Feed

### Problema Identificado
A música nos posts do feed não está tocando quando o usuário rola a página porque:

1. O estado `isMusicMuted` inicia como `true` (linha 72)
2. O IntersectionObserver (linhas 161-198) só toca a música se `!isMusicMuted` (linha 176)
3. Como a música começa mutada, o play nunca é executado quando o post fica visível
4. O observer não re-executa quando o usuário desmuta a música

---

### Solução

Alterar a lógica para que a música **sempre toque** quando o post ficar visível, mas de forma **mutada por padrão**. Isso segue o mesmo padrão dos vídeos que auto-play mutados.

---

### Mudanças Técnicas

**Arquivo:** `src/components/feed/FeedPost.tsx`

**1. Criar o Audio ao entrar na viewport e tocar mutado**

Atualizar o useEffect do IntersectionObserver (linhas 161-198):

```tsx
// Music autoplay on viewport intersection (for image posts with music)
useEffect(() => {
  if (!hasMusicTrack || !musicAudioUrl || post.media_type === "video") return;
  if (!mediaContainerRef.current) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          // Start playing music when visible
          if (!musicAudioRef.current) {
            musicAudioRef.current = new Audio(musicAudioUrl);
            musicAudioRef.current.loop = true;
          }
          musicAudioRef.current.currentTime = musicStartSeconds;
          musicAudioRef.current.muted = isMusicMuted;  // ← Usar muted property
          musicAudioRef.current.play().catch(() => {});
        } else {
          // Pause music when not visible
          if (musicAudioRef.current) {
            musicAudioRef.current.pause();
          }
        }
      });
    },
    { threshold: [0, 0.6, 1] }
  );

  observer.observe(mediaContainerRef.current);
  return () => {
    observer.disconnect();
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
  };
}, [hasMusicTrack, musicAudioUrl, post.media_type, musicStartSeconds, isMusicMuted]);
```

**2. Atualizar o toggle de mute (linhas 200-208)**

Alterar para usar a propriedade `muted` do audio ao invés de pause/play:

```tsx
// Handle music mute toggle
useEffect(() => {
  if (!musicAudioRef.current) return;
  musicAudioRef.current.muted = isMusicMuted;
}, [isMusicMuted]);
```

---

### Fluxo Corrigido

```text
Post entra na viewport (60% visível)
         │
         ▼
Criar Audio (se necessário)
         │
         ▼
audio.currentTime = startSeconds
audio.muted = isMusicMuted (true por padrão)
audio.play()
         │
         ▼
Música tocando (mas mutada)
         │
         ▼
Usuário clica no botão 🔊
         │
         ▼
isMusicMuted = false
audio.muted = false
         │
         ▼
Música agora audível! ✓
```

---

### Por que isso funciona?

1. **Autoplay sempre funciona**: Navegadores permitem autoplay mutado
2. **Consistente com vídeos**: Mesmo padrão já usado para vídeos no feed
3. **Experiência do usuário**: Um clique para ativar o som
4. **Sem bugs de timing**: A música começa a tocar independente do estado de mute

---

### Arquivos a Modificar

1. **`src/components/feed/FeedPost.tsx`**
   - Atualizar useEffect do IntersectionObserver (linhas 161-198)
   - Simplificar useEffect do toggle de mute (linhas 200-208)
