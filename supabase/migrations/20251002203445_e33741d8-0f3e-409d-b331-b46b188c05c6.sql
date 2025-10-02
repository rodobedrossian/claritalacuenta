-- Add currency column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN currency TEXT NOT NULL CHECK (currency IN ('USD', 'ARS'));

-- Modify savings table to support multiple currencies
ALTER TABLE public.savings 
DROP COLUMN current_amount;

ALTER TABLE public.savings 
ADD COLUMN usd_amount NUMERIC DEFAULT 0 NOT NULL,
ADD COLUMN ars_amount NUMERIC DEFAULT 0 NOT NULL;