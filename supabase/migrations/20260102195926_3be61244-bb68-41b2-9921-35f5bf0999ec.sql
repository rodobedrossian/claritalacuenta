-- Create credit_cards table first
CREATE TABLE public.credit_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  bank text,
  closing_day integer CHECK (closing_day >= 1 AND closing_day <= 31),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on credit_cards
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_cards
CREATE POLICY "Users can view their own credit cards"
ON public.credit_cards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit cards"
ON public.credit_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit cards"
ON public.credit_cards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit cards"
ON public.credit_cards FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_credit_cards_updated_at
BEFORE UPDATE ON public.credit_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Now add columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN payment_method text NOT NULL DEFAULT 'cash',
ADD COLUMN is_projected boolean NOT NULL DEFAULT false,
ADD COLUMN credit_card_id uuid REFERENCES public.credit_cards(id) ON DELETE SET NULL;