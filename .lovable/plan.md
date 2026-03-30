

## Redesign do Banner — Layout Moderno e Profissional

### Visão Geral
Redesenhar o banner hero da Landing page com um visual mais sofisticado e profissional, mantendo o SoccerShowcase como background.

### Mudanças no Banner (Landing.tsx, linhas 102-130)

1. **Layout centralizado** — Trocar o alinhamento à esquerda por conteúdo centralizado, dando mais presença e equilíbrio visual
2. **Overlay com gradiente mais sofisticado** — Usar um gradiente radial escuro (do centro para as bordas) em vez do gradiente linear simples, criando profundidade
3. **Tipografia refinada** — Subtítulo menor em uppercase com tracking largo acima do título principal ("A REDE SOCIAL DO FUTEBOL"), título grande e impactante centralizado
4. **Logo centralizada** acima do subtítulo
5. **Linha decorativa verde** (accent bar) abaixo do título — uma linha fina de 60px na cor primary para dar acabamento
6. **Botões lado a lado** — "Baixar App" (mobile) ou "Começar Agora" + "Saiba Mais" (desktop, outline) centralizados abaixo da linha
7. **Borda inferior com gradiente** — Uma borda sutil na parte inferior do banner usando a cor primary com fade para transparência, separando elegantemente do conteúdo abaixo
8. **Altura ajustada** — `min-h-[240px] md:min-h-[360px]` para dar mais respiro no desktop

### Resultado Esperado
Banner escuro com imagem de fundo, conteúdo centralizado, tipografia hierárquica clara, accent line verde e visual limpo e corporativo.

