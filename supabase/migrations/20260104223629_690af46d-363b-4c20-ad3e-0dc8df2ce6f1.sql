-- Add funcao column to profiles table for technical staff functions
ALTER TABLE public.profiles 
ADD COLUMN funcao bigint NULL;