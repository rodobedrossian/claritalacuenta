-- Add savings_type column to savings_entries to track cash vs bank vs investment
ALTER TABLE public.savings_entries 
ADD COLUMN savings_type TEXT DEFAULT 'cash' CHECK (savings_type IN ('cash', 'bank', 'other'));

-- Update the savings table to track cash separately
ALTER TABLE public.savings 
ADD COLUMN usd_cash NUMERIC DEFAULT 0,
ADD COLUMN ars_cash NUMERIC DEFAULT 0;