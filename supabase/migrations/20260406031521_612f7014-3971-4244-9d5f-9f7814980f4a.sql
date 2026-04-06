ALTER TABLE public.verification_requests ADD COLUMN document_type text DEFAULT 'rg';
ALTER TABLE public.verification_requests ADD COLUMN ai_validation_result jsonb;
ALTER TABLE public.verification_requests ADD COLUMN ai_validated boolean DEFAULT false;

ALTER TABLE public.profiles ADD COLUMN identity_document_type text;