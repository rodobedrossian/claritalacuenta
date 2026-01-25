-- Table for storing Gmail OAuth connections
CREATE TABLE public.gmail_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone NOT NULL,
  history_id text,
  watch_expiration timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gmail_connections
CREATE POLICY "Users can view their own gmail connections"
ON public.gmail_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gmail connections"
ON public.gmail_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gmail connections"
ON public.gmail_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gmail connections"
ON public.gmail_connections FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_gmail_connections_updated_at
BEFORE UPDATE ON public.gmail_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Table for email parser configurations
CREATE TABLE public.email_parsers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  sender_email text NOT NULL,
  subject_pattern text,
  amount_regex text NOT NULL,
  currency text DEFAULT 'ARS',
  category text NOT NULL,
  transaction_type text DEFAULT 'expense',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_parsers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_parsers
CREATE POLICY "Users can view their own email parsers"
ON public.email_parsers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email parsers"
ON public.email_parsers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email parsers"
ON public.email_parsers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email parsers"
ON public.email_parsers FOR DELETE
USING (auth.uid() = user_id);

-- Table for tracking processed emails (deduplication)
CREATE TABLE public.processed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gmail_connection_id uuid REFERENCES public.gmail_connections(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  processed_at timestamp with time zone DEFAULT now(),
  raw_subject text,
  raw_snippet text,
  status text DEFAULT 'processed',
  UNIQUE(message_id)
);

-- Enable RLS
ALTER TABLE public.processed_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for processed_emails
CREATE POLICY "Users can view their own processed emails"
ON public.processed_emails FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processed emails"
ON public.processed_emails FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add source column to transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS email_message_id text;