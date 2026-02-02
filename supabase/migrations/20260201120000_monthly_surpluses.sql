-- Monthly surpluses: store end-of-month balance for prompting users next month
CREATE TABLE public.monthly_surpluses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  surplus_usd NUMERIC NOT NULL DEFAULT 0,
  surplus_ars NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'saved', 'ignored')),
  saved_at TIMESTAMPTZ,
  ignored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Index for lookups
CREATE INDEX idx_monthly_surpluses_user_month ON public.monthly_surpluses(user_id, month);

-- Enable RLS
ALTER TABLE public.monthly_surpluses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own monthly surpluses"
ON public.monthly_surpluses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly surpluses"
ON public.monthly_surpluses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly surpluses"
ON public.monthly_surpluses FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_monthly_surpluses_updated_at
BEFORE UPDATE ON public.monthly_surpluses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
