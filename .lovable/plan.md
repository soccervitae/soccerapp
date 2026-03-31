

## Plano: Corrigir troca de abas no perfil quando sticky (sem recarregar)

### Problema
`ProfileTabs`, `ProfileContent` e `MainContent` são definidos como **funções-componente dentro do render** do `Profile`. Isso faz com que o React os trate como componentes **novos** a cada render — ao trocar de aba, o React desmonta e remonta toda a árvore, causando o efeito de "recarregar a página".

### Solução
Converter `ProfileTabs`, `ProfileContent` e `MainContent` de componentes inline para **JSX direto** (inline rendering), eliminando a recriação de componentes a cada render.

### Alterações — `src/pages/Profile.tsx`

1. **Remover as declarações de função** `ProfileTabs`, `ProfileContent` e `MainContent` (linhas ~555, ~699, ~728)
2. **Substituir `<ProfileTabs />`** por o JSX da `Tabs` diretamente inline em todos os lugares onde é usado (linhas 724, 789, 849)
3. **Substituir `<ProfileContent />`** pelo JSX inline (linha 732)
4. **Substituir `<MainContent />`** pelo JSX inline (linha 854)
5. Manter `<MediaViewers />` como está (não causa problema pois não depende de `activeTab`)

### Resultado
- Clicar nas abas quando sticky apenas troca o conteúdo sem desmontar/remontar
- Scroll preservation continua funcionando normalmente
- Nenhuma mudança visual ou funcional

