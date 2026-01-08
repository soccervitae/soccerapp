-- Add admin role to soccervitae@gmail.com user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('9d01169e-44be-4651-9eab-221a7b7780ac', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;