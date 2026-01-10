-- Add RLS policies for admins to manage achievement_types

-- Allow admins to insert achievement types
CREATE POLICY "Admins can insert achievement types"
ON public.achievement_types
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update achievement types
CREATE POLICY "Admins can update achievement types"
ON public.achievement_types
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete achievement types
CREATE POLICY "Admins can delete achievement types"
ON public.achievement_types
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));