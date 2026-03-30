
Objetivo: corrigir de forma definitiva o header no PWA para que ele fique abaixo da barra de notificação do celular, visível e clicável em iPhone/Android.

1. Confirmar a causa real
- O problema persiste mesmo com `apple-mobile-web-app-status-bar-style="default"` porque o app ainda usa `viewport-fit=cover` em `index.html`.
- Com `cover`, o viewport invade a safe area do topo no modo standalone, então os headers `fixed top-0` continuam começando “por trás” da barra do sistema.

2. Aplicar a correção global correta
- Em `index.html`, ajustar a meta viewport removendo `viewport-fit=cover`.
- Manter `apple-mobile-web-app-status-bar-style="default"`.
- Isso faz o app se comportar como no navegador: o conteúdo começa abaixo da barra do sistema, sem hack manual por pixel.

3. Preservar consistência dos headers
- Não mexer header por header agora, porque os componentes já seguem um padrão consistente (`fixed top-0 ... h-16`).
- Manter a altura atual dos headers.
- Evitar voltar com `padding-top` fixo, pois isso varia por aparelho e cria desalinhamentos.

4. Revisar espaçamentos de conteúdo abaixo dos headers
- Verificar as páginas principais que usam header fixo e offset manual (`pt-14`, `pt-16`, `pt-12`) para garantir que continuem alinhadas após a correção global.
- Prioridade de revisão:
  - `src/components/feed/FeedHeader.tsx` + `src/pages/Index.tsx`
  - `src/components/profile/ProfileHeader.tsx` + `src/pages/Profile.tsx`
  - `src/pages/Explore.tsx`
  - `src/pages/Messages.tsx`
  - páginas de `src/pages/settings/*`

5. Ajustes finos onde necessário
- Se algum conteúdo ficar muito próximo do header após remover `viewport-fit=cover`, ajustar apenas o offset da página correspondente.
- Exemplo: páginas com header `h-16` devem usar offset coerente com essa altura; hoje há casos com `pt-12` e `pt-14` que merecem padronização.

Resultado esperado
- No PWA, o header deixa de ficar sob a barra de sinal/Wi‑Fi/bateria.
- O header volta a ficar totalmente visível e clicável.
- O comportamento fica igual ao navegador, sem depender de padding artificial.

Detalhes técnicos
```text
Hoje:
meta viewport = ... viewport-fit=cover
+
header fixed top-0
=
viewport invade a safe area
=
header começa atrás da barra do sistema

Correção:
meta viewport sem viewport-fit=cover
+
status-bar-style = default
=
viewport começa abaixo da barra do sistema
=
header visível e clicável
```

Arquivos que devem ser alterados
- `index.html`
- Possivelmente ajustes pontuais de espaçamento em:
  - `src/pages/Index.tsx`
  - `src/pages/Profile.tsx`
  - `src/pages/Explore.tsx`
  - `src/pages/Messages.tsx`
  - `src/pages/settings/Index.tsx`
  - `src/pages/settings/MyPosts.tsx`
  - `src/pages/settings/Privacy.tsx`
  - `src/pages/settings/Saved.tsx`
  - `src/pages/settings/Verification.tsx`
