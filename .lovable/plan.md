

# Remover tipo de conta "Escolinha de Futebol"

## Resumo
Remover todas as referências ao tipo de conta "Escolinha de Futebol" em 12 arquivos do projeto. Onde houver condições `|| account_type === 'escolinha'`, serão simplificadas para apenas `account_type === 'time'`.

## Arquivos a editar

### 1. `src/pages/Landing.tsx`
- Deletar o bloco inteiro do objeto "Escolinha de Futebol" no array `featuresByAccount` (o 4º item)

### 2. `src/pages/Auth.tsx`
- Remover `<SelectItem value="escolinha">` do seletor de tipo de conta
- Simplificar `isTeamOrSchool` para `accountType === "time"`
- Remover ternários que referenciam "escolinha" nos labels/placeholders

### 3. `src/pages/CompleteProfile.tsx`
- Simplificar todas as condições `|| account_type === 'escolinha'` para apenas `=== 'time'`
- Remover placeholders e labels específicos de escolinha

### 4. `src/pages/Profile.tsx`
- Simplificar `isTeamOrSchool` para `account_type === 'time'`

### 5. `src/pages/Explore.tsx`
- Remover condição de escolinha no label de tipo de conta
- Simplificar para mostrar apenas "Time de Futebol"

### 6. `src/pages/settings/EditProfile.tsx`
- Simplificar `isTeamOrSchool` e remover referências a escolinha nos placeholders/labels

### 7. `src/pages/admin/Users.tsx`
- Remover `<SelectItem value="escolinha">` do filtro
- Remover badge de "Escolinha" na listagem

### 8. `src/components/admin/ViewUserSheet.tsx`
- Remover referências a escolinha nos badges e condições

### 9. `src/components/feed/FeedPost.tsx`
- Simplificar condição para mostrar label apenas para `'time'`

### 10. `src/components/feed/CreateMenuSheet.tsx`
- Simplificar `isTeamOrSchool` para apenas `'time'`

### 11. `src/components/profile/ProfileInfo.tsx`
- Remover todas as referências a escolinha nas condições e labels

### 12. `src/components/profile/AboutTab.tsx`
- Simplificar label de tipo de conta para apenas "Time de Futebol"

## Padrão de mudança
Em todos os arquivos, o padrão é:
- `account_type === 'time' || account_type === 'escolinha'` → `account_type === 'time'`
- `isTeamOrSchool` → `isTeamAccount` (ou manter o nome mas remover a parte escolinha)
- Ternários `=== 'time' ? 'X' : 'Y'` onde Y era escolinha → valor direto para time
- Remover opções de seleção e badges de escolinha

