-- 1. Remover política de INSERT antiga
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- 2. Criar nova política de INSERT para usuários autenticados
CREATE POLICY "Users can create conversations" 
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Corrigir também a política SELECT para usar authenticated
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations
FOR SELECT
TO authenticated
USING (
  public.is_conversation_participant(id, auth.uid())
);