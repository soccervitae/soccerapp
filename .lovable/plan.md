

## Plano: Landing Page com tema branco e visual suave

### O que muda
Converter a Landing Page do tema escuro (verde escuro `#102216`, cards `#1a3d26`) para um tema branco/claro, suave e moderno, mantendo o verde como cor de destaque.

### Alterações em `src/pages/Landing.tsx`

1. **Container principal** (linha 87): `bg-[#102216] text-white` → `bg-white text-foreground`

2. **Hero Section** (linhas 100-119):
   - Gradient overlay: trocar `from-[#102216]` por `from-white`
   - Título: `text-white` → `text-foreground`
   - Subtítulo: `text-white/80` → `text-muted-foreground`

3. **Features Section** (linhas 124-156):
   - Label "Recursos": `text-[#1cb15c]` → `text-primary` (manter verde como accent)
   - Título da seção: `text-white` → `text-foreground`
   - Descrição da seção: `text-white/60` → `text-muted-foreground`
   - Cards: `border-white/10 bg-[#1a3d26]` → `border-border/40 bg-card shadow-sm`
   - Hover dos cards: `hover:border-[#1cb15c]/50` → `hover:border-primary/30`
   - Ícone circle: `bg-[#1cb15c]/20` → `bg-primary/10`
   - Ícone cor: `text-[#1cb15c]` → `text-primary`
   - Título do card: `text-white` → `text-foreground`
   - Descrição do card: `text-white/60` → `text-muted-foreground`

4. **Account Types Section** (linhas 160-208): mesmas trocas dos cards de features

5. **CTA Section** (linhas 211-231):
   - Título/texto: `text-white` → `text-foreground`, `text-white/60` → `text-muted-foreground`
   - Botões: `bg-[#1cb15c]` → `bg-primary hover:bg-primary/90`

6. **Footer** (linhas 234-249):
   - Border: `border-white/10` → `border-border/30`
   - Links: `text-white/60 hover:text-white` → `text-muted-foreground hover:text-foreground`
   - Copyright: `text-white/40` → `text-muted-foreground/60`

