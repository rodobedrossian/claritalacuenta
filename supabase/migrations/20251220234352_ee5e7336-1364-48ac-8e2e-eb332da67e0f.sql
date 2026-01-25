-- Add status column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN status text NOT NULL DEFAULT 'confirmed';

-- Create index for filtering by status
CREATE INDEX idx_transactions_status ON public.transactions(status);