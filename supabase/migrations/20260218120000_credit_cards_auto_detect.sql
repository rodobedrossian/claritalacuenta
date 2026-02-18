-- Add card identification fields for auto-detection from PDF statements
ALTER TABLE public.credit_cards
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS card_network TEXT,
  ADD COLUMN IF NOT EXISTS card_identifier TEXT;

-- Unique index so the same physical card is never duplicated within a workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_cards_identifier_workspace
  ON public.credit_cards (workspace_id, card_identifier)
  WHERE card_identifier IS NOT NULL;
