-- Remove obsolete columns from transactions table
-- is_projected is no longer needed as credit card consumptions are in credit_card_transactions table
-- payment_method='credit_card' is no longer a valid option

ALTER TABLE public.transactions DROP COLUMN IF EXISTS is_projected;

-- Update any remaining credit_card payment_method to debit (for legacy data)
UPDATE public.transactions SET payment_method = 'debit' WHERE payment_method = 'credit_card';