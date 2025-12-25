-- Add trusted_until column to track when device trust expires
ALTER TABLE public.user_devices 
ADD COLUMN IF NOT EXISTS trusted_until timestamp with time zone;

-- Create RLS policy for users to register their own devices
CREATE POLICY "Users can register their own devices"
ON public.user_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create RLS policy for users to update their own devices
CREATE POLICY "Users can update their own devices"
ON public.user_devices
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);