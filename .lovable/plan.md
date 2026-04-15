

## Plan: Página de Screenshots do Site para Admin

### Resumo
Criar uma nova página admin (`/admin/screenshots`) que renderiza o site em iframes com tamanhos mobile e desktop, permitindo ao admin capturar e baixar screenshots de qualquer página do app.

### Como funciona
- A página mostra dois iframes lado a lado (desktop) ou empilhados (mobile): um simulando tela mobile (390x844) e outro desktop (1280x720)
- O admin pode digitar qualquer rota do site (ex: `/`, `/explore`, `/auth`) para visualizar
- Botão "Capturar Screenshot" usa `html2canvas` na página atual para gerar uma imagem PNG que o admin pode baixar
- Como iframes de mesma origem, `html2canvas` consegue capturar o conteúdo

### Limitação importante
`html2canvas` não funciona cross-origin em iframes. Como alternativa mais confiável, usaremos a API nativa do navegador: o admin visualiza a página nos iframes e usa um botão que abre a rota em uma nova aba no tamanho desejado para fazer screenshot manual, OU usaremos uma abordagem com `iframe.contentDocument` + `html2canvas` (funciona por ser mesma origem).

### Abordagem final
- Dois previews via iframe (mobile 390px e desktop 1280px)
- Input para trocar a rota exibida
- Botão de download que captura o iframe via `html2canvas` no `contentDocument` do iframe
- Fallback: se a captura falhar, abre a rota em nova janela com dimensões definidas

### Arquivos a criar
1. **`src/pages/admin/Screenshots.tsx`** — Página com:
   - Input de rota (ex: `/`, `/explore`, `/auth`)
   - Dois iframes redimensionados (mobile e desktop) com `transform: scale()` para caber na tela
   - Botões de download individual (mobile/desktop)
   - Usa `html2canvas` para capturar cada iframe

### Arquivos a modificar
2. **`src/App.tsx`** — Adicionar import e rota `/admin/screenshots`
3. **`src/components/admin/AdminSidebar.tsx`** — Adicionar item "Screenshots" no menu com ícone `Camera`
4. **`package.json`** — Instalar `html2canvas`

### Detalhes técnicos
- Iframes apontam para a própria app (mesma origem), ex: `window.location.origin + rota`
- Mobile preview: 390x844 renderizado em escala ~0.4
- Desktop preview: 1280x720 renderizado em escala ~0.5
- `html2canvas(iframe.contentDocument.body)` para captura
- Download via `<a download>` com blob URL

