-- Update transactions that have text-based category "Tarjeta" to use the UUID
UPDATE public.transactions 
SET category = '2eee47f0-252a-4580-8672-0ec0bdd6f11d' 
WHERE category = 'Tarjeta';

-- Update transactions that have text-based category "Crédito" to use the UUID (if exists)
UPDATE public.transactions 
SET category = (SELECT id FROM public.categories WHERE name = 'Crédito' LIMIT 1)
WHERE category = 'Crédito' 
AND EXISTS (SELECT 1 FROM public.categories WHERE name = 'Crédito');