

## Plano: Remover Bloqueio de Orientação Paisagem

### O que será feito
Remover o overlay que aparece quando o usuário gira o dispositivo para paisagem, e remover o CSS associado. O site funcionará normalmente em qualquer orientação.

### Alterações

1. **`src/App.tsx`** — Remover import e uso do `<OrientationLock />`, remover a função `lockOrientation` do useEffect

2. **`src/index.css`** — Remover o bloco CSS `@media (orientation: landscape)` que exibe o overlay

3. **`src/components/OrientationLock.tsx`** — Pode ser deletado (arquivo não mais usado)

