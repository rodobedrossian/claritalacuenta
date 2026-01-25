-- Add "Credit Card Payment" category if it doesn't exist
INSERT INTO public.categories (name, type)
SELECT 'Credit Card Payment', 'expense'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE name = 'Credit Card Payment'
);