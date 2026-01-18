-- 1. Create dedicated table for credit card transactions
CREATE TABLE public.credit_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  statement_import_id UUID REFERENCES statement_imports(id) ON DELETE CASCADE,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('consumo', 'cuota', 'impuesto')),
  installment_current INTEGER,
  installment_total INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.credit_card_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
CREATE POLICY "Users can view their own credit card transactions"
ON public.credit_card_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit card transactions"
ON public.credit_card_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit card transactions"
ON public.credit_card_transactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit card transactions"
ON public.credit_card_transactions
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Create indexes for performance
CREATE INDEX idx_credit_card_transactions_user_id ON public.credit_card_transactions(user_id);
CREATE INDEX idx_credit_card_transactions_statement_import_id ON public.credit_card_transactions(statement_import_id);
CREATE INDEX idx_credit_card_transactions_credit_card_id ON public.credit_card_transactions(credit_card_id);
CREATE INDEX idx_credit_card_transactions_date ON public.credit_card_transactions(date);

-- 5. Create trigger for updated_at
CREATE TRIGGER update_credit_card_transactions_updated_at
BEFORE UPDATE ON public.credit_card_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- 6. Migrate existing credit card transactions from transactions table
INSERT INTO public.credit_card_transactions (
  user_id,
  statement_import_id,
  credit_card_id,
  description,
  amount,
  currency,
  category_id,
  date,
  transaction_type,
  created_at
)
SELECT 
  t.user_id,
  t.statement_import_id,
  t.credit_card_id,
  t.description,
  t.amount,
  t.currency,
  -- Try to match category name to category id
  c.id as category_id,
  t.date::date,
  'consumo' as transaction_type,
  t.created_at
FROM public.transactions t
LEFT JOIN public.categories c ON (c.name = t.category OR c.id::text = t.category)
WHERE t.is_projected = true 
  AND t.payment_method = 'credit_card'
  AND t.statement_import_id IS NOT NULL;

-- 7. Delete migrated transactions from transactions table
DELETE FROM public.transactions 
WHERE is_projected = true 
  AND payment_method = 'credit_card'
  AND statement_import_id IS NOT NULL;