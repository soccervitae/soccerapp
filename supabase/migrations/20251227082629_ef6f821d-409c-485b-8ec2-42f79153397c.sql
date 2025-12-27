-- 1. Remover a política problemática
DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;

-- 2. Criar função SECURITY DEFINER para verificar se usuário é participante
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conv_id AND user_id = check_user_id
  );
$$;

-- 3. Criar função para verificar se conversa é nova (sem participantes)
CREATE OR REPLACE FUNCTION public.is_new_conversation(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conv_id
  );
$$;

-- 4. Criar nova política de INSERT usando as funções
CREATE POLICY "Users can add participants to conversations" 
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  (user_id = auth.uid())
  OR public.is_new_conversation(conversation_id)
  OR public.is_conversation_participant(conversation_id, auth.uid())
);