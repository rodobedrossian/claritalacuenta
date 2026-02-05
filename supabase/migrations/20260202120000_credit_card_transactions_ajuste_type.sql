-- Allow 'ajuste' (credits/adjustments) in credit_card_transactions.transaction_type
ALTER TABLE public.credit_card_transactions
  DROP CONSTRAINT IF EXISTS credit_card_transactions_transaction_type_check;

ALTER TABLE public.credit_card_transactions
  ADD CONSTRAINT credit_card_transactions_transaction_type_check
  CHECK (transaction_type IN ('consumo', 'cuota', 'impuesto', 'ajuste'));
