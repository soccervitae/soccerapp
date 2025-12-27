-- 1. Remover políticas existentes
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

-- 2. Criar política PERMISSIVE para INSERT
CREATE POLICY "Users can create conversations" 
ON public.conversations
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Criar política PERMISSIVE para SELECT
CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.is_conversation_participant(id, auth.uid())
);