

# Selo de Verificação Pago (estilo Instagram)

## Resumo
Criar um sistema de selo de verificação premium onde o usuário paga R$199,90/ano para obter um selo azul de verificado e o direito de alterar o nome de usuário. Por enquanto, sem integração de pagamento real -- apenas visual e lógica.

## O que muda para o usuário
- Nova seção "Verificação" nas Configurações do perfil
- Tela dedicada para solicitar/ver status da verificação
- Usuários verificados Premium ganham selo azul diferenciado e podem editar o username
- O selo atual verde (conta_verificada via email) continua existindo separadamente

## Plano Técnico

### 1. Migração de banco de dados
Adicionar colunas na tabela `profiles`:
- `is_verified_premium` (boolean, default false) -- selo pago
- `verified_premium_at` (timestamptz, nullable) -- data de ativação
- `verified_premium_expires_at` (timestamptz, nullable) -- expiração (1 ano)

### 2. Página de Verificação Premium (`src/pages/settings/Verification.tsx`)
- Exibe o plano: R$199,90/ano
- Benefícios listados: selo verificado, alterar username
- Botão "Obter Verificação" que por enquanto apenas mostra toast "Em breve! Pagamento será integrado"
- Se já verificado, mostra status e data de expiração

### 3. Adicionar item no menu de Configurações
- Em `ProfileSettingsSheet.tsx` e `settings/Index.tsx`: novo item "Verificação Premium" com ícone `verified` na seção Conta

### 4. Alterar lógica de username no EditProfile
- Atualmente o campo username é readonly para todos
- Se `is_verified_premium === true` e não expirado, habilitar edição do username (mostrar Input ao invés do div estático)

### 5. Selo visual diferenciado
- Selo premium: azul (como Instagram) usando ícone `verified` com fundo azul
- Selo atual (conta_verificada): mantém verde como está
- Prioridade de exibição: premium > conta_verificada > nenhum
- Atualizar `ProfileInfo.tsx`, `FeedPost.tsx`, `LikesSheet.tsx` e demais locais que exibem o selo

### 6. Rota no App.tsx
- Adicionar rota `/settings/verification` protegida

### Arquivos principais afetados
- **Novo**: `src/pages/settings/Verification.tsx`
- **Editar**: `src/pages/settings/EditProfile.tsx` (username editável para premium)
- **Editar**: `src/pages/settings/Index.tsx` (menu item)
- **Editar**: `src/components/profile/ProfileSettingsSheet.tsx` (menu item)
- **Editar**: `src/components/profile/ProfileInfo.tsx` (selo azul)
- **Editar**: `src/components/feed/FeedPost.tsx` (selo azul)
- **Editar**: `src/App.tsx` (rota)
- **Migration**: adicionar colunas no profiles

