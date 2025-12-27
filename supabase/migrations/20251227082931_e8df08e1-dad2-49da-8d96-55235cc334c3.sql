-- 1. Remover a política de SELECT problemática
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

-- 2. Criar nova política de SELECT usando a função SECURITY DEFINER
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants
FOR SELECT
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
);