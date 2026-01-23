-- Add icon and color columns to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text DEFAULT 'circle';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color text DEFAULT '#6366f1';

-- Update existing categories with representative icons and colors
UPDATE public.categories SET icon = 'shopping-cart', color = '#22c55e' WHERE LOWER(name) IN ('supermercado', 'mercado', 'compras', 'grocery');
UPDATE public.categories SET icon = 'utensils', color = '#f97316' WHERE LOWER(name) IN ('delivery', 'comida', 'restaurante', 'restaurant', 'food');
UPDATE public.categories SET icon = 'shirt', color = '#8b5cf6' WHERE LOWER(name) IN ('ropa', 'clothing', 'indumentaria', 'fashion');
UPDATE public.categories SET icon = 'home', color = '#3b82f6' WHERE LOWER(name) IN ('servicios', 'hogar', 'home', 'utilities', 'alquiler', 'expensas');
UPDATE public.categories SET icon = 'car', color = '#14b8a6' WHERE LOWER(name) IN ('transporte', 'transport', 'auto', 'nafta', 'combustible', 'uber');
UPDATE public.categories SET icon = 'heart', color = '#ec4899' WHERE LOWER(name) IN ('salud', 'health', 'medicina', 'farmacia', 'gym', 'gimnasio');
UPDATE public.categories SET icon = 'plane', color = '#0ea5e9' WHERE LOWER(name) IN ('vacaciones', 'viaje', 'travel', 'turismo');
UPDATE public.categories SET icon = 'gift', color = '#f43f5e' WHERE LOWER(name) IN ('regalos', 'gifts', 'regalo');
UPDATE public.categories SET icon = 'coffee', color = '#a16207' WHERE LOWER(name) IN ('cafetería', 'cafe', 'coffee', 'bar');
UPDATE public.categories SET icon = 'smartphone', color = '#6366f1' WHERE LOWER(name) IN ('tecnología', 'tech', 'technology', 'electrónica', 'celular');
UPDATE public.categories SET icon = 'gamepad-2', color = '#a855f7' WHERE LOWER(name) IN ('entretenimiento', 'entertainment', 'ocio', 'streaming', 'netflix', 'spotify');
UPDATE public.categories SET icon = 'graduation-cap', color = '#0d9488' WHERE LOWER(name) IN ('educación', 'education', 'cursos', 'libros');
UPDATE public.categories SET icon = 'briefcase', color = '#64748b' WHERE LOWER(name) IN ('trabajo', 'work', 'salario', 'salary', 'sueldo', 'honorarios');
UPDATE public.categories SET icon = 'trending-up', color = '#10b981' WHERE LOWER(name) IN ('inversión', 'investment', 'inversiones', 'dividendos');
UPDATE public.categories SET icon = 'banknote', color = '#22c55e' WHERE LOWER(name) IN ('freelance', 'extra', 'bonus', 'otros ingresos');
UPDATE public.categories SET icon = 'wallet', color = '#eab308' WHERE LOWER(name) IN ('otros', 'other', 'varios', 'misc');
UPDATE public.categories SET icon = 'dog', color = '#f97316' WHERE LOWER(name) IN ('mascotas', 'pets', 'veterinaria');
UPDATE public.categories SET icon = 'baby', color = '#ec4899' WHERE LOWER(name) IN ('hijos', 'kids', 'children', 'bebé');
UPDATE public.categories SET icon = 'sparkles', color = '#a855f7' WHERE LOWER(name) IN ('belleza', 'beauty', 'peluquería', 'cosmética');