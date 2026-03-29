

## Plano: Página Home branca e suave + tipo de conta para atletas

### O que muda

1. **Cor de fundo branca e visual mais suave** — remover tons escuros/verdes do feed, suavizar bordas e separadores
2. **Mostrar tipo de conta para atletas** — exibir "Atleta" antes da posição no header dos posts de atletas

### Alterações

#### 1. `src/components/feed/FeedPost.tsx`
- Na seção do header do post (linha ~658-702), adicionar lógica para perfis de atleta: mostrar "Atleta" como tipo de conta quando `account_type` for `'atleta'` ou quando não for `time`/`escolinha` e tiver `position_name`
- Formato: `Atleta · Meio-campista` em vez de apenas `Meio-campista`
- Trocar `border-b border-border` do `<article>` por `border-b border-border/40` para separadores mais suaves

#### 2. `src/components/feed/FeedHeader.tsx`
- Manter fundo branco `bg-background/95`, trocar borda para `border-border/30` — mais suave

#### 3. `src/components/feed/FeedStories.tsx`
- Trocar `border-b border-border` por `border-b border-border/30` para suavizar
- O botão "+" do replay já usa `bg-nav-active` (verde) — manter, é um accent

#### 4. `src/pages/Index.tsx`
- Manter `bg-background` (já é branco no light mode)

### Detalhes técnicos

No header do post, a lógica de exibição abaixo do nome ficará:
- **Time/Escolinha**: "Time de Futebol" ou "Escolinha de Futebol" (sem mudança)
- **Atleta** (account_type === 'atleta' ou perfil com position_name): "Atleta · {posição}"
- **Sem tipo**: mostrar apenas posição ou música como já está

