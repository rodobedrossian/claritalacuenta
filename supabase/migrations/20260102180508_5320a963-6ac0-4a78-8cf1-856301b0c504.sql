-- Create savings_entries table for tracking deposits/withdrawals
CREATE TABLE public.savings_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'ARS')),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('deposit', 'withdrawal', 'interest')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.savings_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own savings entries"
ON public.savings_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings entries"
ON public.savings_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings entries"
ON public.savings_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings entries"
ON public.savings_entries FOR DELETE
USING (auth.uid() = user_id);

-- Create investments table
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  investment_type TEXT NOT NULL CHECK (investment_type IN ('plazo_fijo', 'fci', 'cedear', 'cripto', 'otro')),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'ARS')),
  principal_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL,
  interest_rate NUMERIC,
  rate_type TEXT CHECK (rate_type IN ('fixed', 'variable', 'none')),
  institution TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own investments"
ON public.investments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments"
ON public.investments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
ON public.investments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments"
ON public.investments FOR DELETE
USING (auth.uid() = user_id);

-- Create savings_goals table
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'ARS')),
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own savings goals"
ON public.savings_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings goals"
ON public.savings_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals"
ON public.savings_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals"
ON public.savings_goals FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger for investments
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add updated_at trigger for savings_goals
CREATE TRIGGER update_savings_goals_updated_at
BEFORE UPDATE ON public.savings_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();