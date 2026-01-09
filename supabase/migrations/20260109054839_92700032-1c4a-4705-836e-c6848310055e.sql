-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can create teams" ON public.times;

-- Create new insert policy that allows authenticated users to insert teams
-- The user_id must match the authenticated user OR the user is an admin
CREATE POLICY "Users can create teams" 
ON public.times 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);