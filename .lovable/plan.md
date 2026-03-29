

## Plano: Tema escuro no CreateMenuSheet

### O que muda
Aplicar o mesmo tema escuro das páginas de criação (bg-black, zinc-900, white text) no sheet do menu "O que você quer criar?".

### Alterações no arquivo `src/components/feed/CreateMenuSheet.tsx`

1. **ResponsiveModalContent**: adicionar classes `!bg-black !border-zinc-800`
2. **Título**: adicionar `text-white`
3. **Botões de opção**: trocar `bg-muted/50 hover:bg-muted` por `bg-zinc-900 hover:bg-zinc-800 border border-white/10`
4. **Textos**: trocar `text-foreground` por `text-white` e `text-muted-foreground` por `text-zinc-400`
5. **Banner admin**: manter as cores amber existentes (já funciona em fundo escuro)
6. **Overlay**: adicionar `overlayClassName="bg-black/80"` para consistência

