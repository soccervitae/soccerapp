-- Create a separate secure table for verification codes (no SELECT for public)
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  code_type text NOT NULL DEFAULT 'verification',
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, code_type)
);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- NO SELECT policy for public - only service_role can read
-- Only admins can view (for debugging)
CREATE POLICY "Admins can view verification codes"
ON public.verification_codes FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow service role to manage (implicit with service_role key)
-- No public INSERT/UPDATE/DELETE policies - all managed server-side

-- Now clear sensitive fields from profiles (nullify existing codes)
UPDATE public.profiles SET 
  codigo = NULL, 
  codigo_expira_em = NULL, 
  password_reset_code = NULL, 
  password_reset_expires_at = NULL,
  verification_attempts = 0,
  verification_locked_until = NULL;