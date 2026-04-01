
-- Create account_types table for dynamic account type management
CREATE TABLE public.account_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_types ENABLE ROW LEVEL SECURITY;

-- Everyone can view active account types
CREATE POLICY "Account types are viewable by everyone"
  ON public.account_types FOR SELECT
  TO public
  USING (true);

-- Admins can manage account types
CREATE POLICY "Admins can insert account types"
  ON public.account_types FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update account types"
  ON public.account_types FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete account types"
  ON public.account_types FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default account types
INSERT INTO public.account_types (name, slug, description, icon, display_order) VALUES
  ('Atleta', 'atleta', 'Perfil para jogadores de futebol', 'user', 1),
  ('Comissão Técnica', 'comissao_tecnica', 'Perfil para treinadores e staff técnico', 'clipboard', 2),
  ('Time', 'time', 'Perfil para clubes e equipes', 'shield', 3);
