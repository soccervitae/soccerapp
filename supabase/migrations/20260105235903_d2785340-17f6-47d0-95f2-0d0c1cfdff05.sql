-- Add estado_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN estado_id integer REFERENCES public.estados(id);

-- Add index for better query performance
CREATE INDEX idx_profiles_estado_id ON public.profiles(estado_id);