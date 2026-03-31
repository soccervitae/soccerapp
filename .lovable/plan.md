

## Plano: Restringir Vídeo, Replay e Destaque para Usuários Pro

### Resumo
Usuários sem o selo Pro (`is_verified_premium !== true`) não poderão:
1. Adicionar vídeos do dispositivo em posts (apenas links do YouTube)
2. Criar Replays
3. Criar Destaques

### Alterações

**1. `src/components/feed/CreateMenuSheet.tsx`**
- Adicionar verificação `is_verified_premium` do perfil
- Para usuários não-Pro: ocultar opções "Replay" e "Destaque", ou mostrar com cadeado e mensagem "Recurso exclusivo para assinantes Pro"
- Ao clicar, exibir toast informando que precisa do Plano Pro

**2. `src/pages/CreatePost.tsx`**
- Verificar `profile?.is_verified_premium`
- Se não é Pro: ocultar botões "Vídeo" (galeria) e "Gravar" (câmera)
- Adicionar botão "Link do YouTube" que permite colar URL de vídeo do YouTube
- O link do YouTube será salvo como `media_url` com `media_type: "video"`

**3. `src/pages/CreateReplay.tsx`**
- Adicionar verificação no topo: se não é Pro, redirecionar para `/` com toast "Recurso exclusivo do Plano Pro"

**4. `src/pages/CreateHighlight.tsx`**
- Mesma verificação: redirecionar usuários não-Pro com toast

### Detalhes do YouTube Link
- Adicionar input de texto para colar URL do YouTube na página CreatePost
- Validar formato de URL (`youtube.com/watch?v=` ou `youtu.be/`)
- Extrair o embed URL e salvar como `media_url`
- No post, o vídeo será exibido via iframe embed do YouTube

### Resumo Visual
- Não-Pro: botões de foto + link YouTube apenas em posts; sem replay/destaque
- Pro: acesso completo (vídeo dispositivo, gravar, replay, destaque)
- Conta oficial: acesso completo independente do Pro

