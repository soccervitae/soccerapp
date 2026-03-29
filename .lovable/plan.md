

## Plano: Perfil diferenciado para Time e Escolinha

### Resumo
Criar um layout de perfil adaptado para contas do tipo `time` e `escolinha`, removendo informações pessoais de atleta e adicionando abas específicas como Elenco/Atletas e Sobre/Informações.

### Detecção do tipo de conta
- Ler `account_type` do perfil (`atleta`, `comissao_tecnica`, `time`, `escolinha`)
- Criar helper: `isTeamOrSchool = account_type === 'time' || account_type === 'escolinha'`

### Alterações no ProfileInfo

**`src/components/profile/ProfileInfo.tsx`**
- Ocultar stats físicos (idade, altura, peso, pé) quando `isTeamOrSchool`
- Ocultar posição/função no subtítulo — mostrar apenas `@username` ou bio
- No header, manter avatar/capa mas pode usar emblema como avatar (sem mudança estrutural, o time configura seu avatar normalmente)

### Alterações nas abas do perfil

**`src/pages/Profile.tsx`**
- Quando `isTeamOrSchool`, usar abas: **Posts**, **Vídeos**, **Fotos**, **Elenco**, **Campeonatos**, **Sobre**
- Remover abas: Times, Conquistas
- Adicionar novas `TabsTrigger` e `TabsContent` para:
  - **Elenco** (icon: `groups`) — lista de atletas vinculados
  - **Sobre** (icon: `info`) — informações do time/escolinha

### Novos componentes

1. **`src/components/profile/SquadTab.tsx`** (Elenco)
   - Por enquanto, exibir placeholder "Elenco em breve" ou lista simples
   - Futuramente poderá vincular atletas ao time via tabela de relacionamento

2. **`src/components/profile/AboutTab.tsx`** (Sobre)
   - Exibir informações do perfil: bio completa, localização (estado), data de criação
   - Layout em cards com ícones

### Detalhes técnicos

- O `account_type` já existe na tabela `profiles` e nos types do Supabase
- Não precisa de migração — apenas leitura do campo existente
- A lógica de `isOfficialAccount` existente serve de modelo para a condicional `isTeamOrSchool`
- O `tabOrder` será ajustado dinamicamente baseado no `account_type`

### Arquivos modificados
- `src/components/profile/ProfileInfo.tsx` — ocultar stats e posição
- `src/pages/Profile.tsx` — abas condicionais + novos tab contents
- `src/components/profile/SquadTab.tsx` — novo componente
- `src/components/profile/AboutTab.tsx` — novo componente

