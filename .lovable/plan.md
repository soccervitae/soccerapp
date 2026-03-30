

# Animação de Futebol na PwaHome

## Resumo
Criar uma animação estilo Lottie usando Framer Motion com elementos de futebol (bola, campo, jogador) abaixo do slogan "Onde talentos encontram oportunidades" na página PWA Home.

## O que será criado

Uma animação contínua com:
- Bola de futebol (⚽) quicando/girando
- Linhas de campo aparecendo suavemente
- Efeito de partículas/brilho ao redor
- Loop infinito, leve e fluido

## Arquivos

1. **Novo: `src/components/pwa/SoccerAnimation.tsx`**
   - Componente com Framer Motion
   - Bola de futebol animada com bounce e rotação contínuos
   - Silhueta de jogador chutando (usando emoji ou SVG inline)
   - Partículas verdes (cor primária) ao redor da bola
   - Animação de "campo" com linhas aparecendo

2. **Editar: `src/pages/PwaHome.tsx`**
   - Importar e renderizar `SoccerAnimation` entre o texto do slogan e os botões

## Detalhes técnicos
- Usar `framer-motion` (já instalado) para todas as animações
- Animações com `repeat: Infinity` para loop contínuo
- Emojis ⚽ e SVG paths simples para os elementos visuais
- Componente leve, sem dependências externas adicionais

