-- Add columns to transactions for tracking expenses from savings
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS from_savings boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS savings_source text;

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.from_savings IS 'Indicates if this expense was paid from savings';
COMMENT ON COLUMN public.transactions.savings_source IS 'Type of savings used: cash, bank, other';